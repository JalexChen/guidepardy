import * as path from 'path';
import { Board } from './Board';
import { Player } from './Player';
import { Timer } from './Timer';
import { GamePhase, PublicGameState, HostGameState } from '../types';

const MAX_PLAYERS = 20;
const BUZZ_WINDOW_MS = 100;
const ANSWER_TIME_SECONDS = 30;
const SECOND_CHANCE_SECONDS = 15;

export class GameManager {
  phase: GamePhase = 'lobby';
  private board: Board | null = null;
  private players: Map<string, Player> = new Map(); // keyed by name
  private socketToName: Map<string, string> = new Map(); // socketId -> name

  private currentTile: { col: number; row: number } | null = null;
  private currentClue: string | null = null;
  private currentAnswer: string | null = null;
  private currentValue: number = 0;
  private isDailyDouble: boolean = false;

  private buzzedPlayer: string | null = null; // player name
  private secondChanceUsed: boolean = false;

  private timer: Timer = new Timer();
  private buzzBuffer: { socketId: string; timestamp: number }[] = [];
  private buzzTimeout: NodeJS.Timeout | null = null;

  private boardsDir: string;
  private currentBoardFile: string = 'default';

  private onStateChange: (() => void) | null = null;
  private onTimerExpireCallback: (() => void) | null = null;

  constructor(boardsDir: string) {
    this.boardsDir = boardsDir;
  }

  setOnStateChange(cb: () => void): void {
    this.onStateChange = cb;
  }

  setOnTimerExpire(cb: () => void): void {
    this.onTimerExpireCallback = cb;
  }

  private emitChange(): void {
    if (this.onStateChange) this.onStateChange();
  }

  // Player management
  addPlayer(name: string, socketId: string): { success: boolean; error?: string } {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Name cannot be empty' };

    const existing = this.players.get(trimmed);
    if (existing) {
      if (!existing.connected) {
        // Reconnect
        this.socketToName.delete(existing.id);
        existing.id = socketId;
        existing.connected = true;
        this.socketToName.set(socketId, trimmed);
        this.emitChange();
        return { success: true };
      }
      return { success: false, error: 'Name already taken' };
    }

    if (this.players.size >= MAX_PLAYERS) {
      return { success: false, error: 'Game is full (max 20 players)' };
    }

    const player = new Player(socketId, trimmed);
    this.players.set(trimmed, player);
    this.socketToName.set(socketId, trimmed);
    this.emitChange();
    return { success: true };
  }

  addPlayerByHost(name: string): { success: boolean; error?: string } {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Name cannot be empty' };
    if (this.players.has(trimmed)) return { success: false, error: 'Name already exists' };
    if (this.players.size >= MAX_PLAYERS) return { success: false, error: 'Game is full' };

    const player = new Player('host-added', trimmed);
    player.connected = false; // Host-added players aren't connected via socket
    this.players.set(trimmed, player);
    this.emitChange();
    return { success: true };
  }

  removePlayer(name: string): void {
    const player = this.players.get(name);
    if (player) {
      this.socketToName.delete(player.id);
      this.players.delete(name);
      this.emitChange();
    }
  }

  disconnectPlayer(socketId: string): void {
    const name = this.socketToName.get(socketId);
    if (name) {
      const player = this.players.get(name);
      if (player) {
        player.connected = false;
        this.socketToName.delete(socketId);
        this.emitChange();
      }
    }
  }

  adjustScore(name: string, delta: number): void {
    const player = this.players.get(name);
    if (player) {
      player.score += delta;
      this.emitChange();
    }
  }

  getPlayerBySocket(socketId: string): Player | undefined {
    const name = this.socketToName.get(socketId);
    return name ? this.players.get(name) : undefined;
  }

  // Game flow
  startGame(boardFile?: string): { success: boolean; error?: string } {
    const file = boardFile || this.currentBoardFile;
    const boardPath = path.join(this.boardsDir, `${file}.json`);

    try {
      this.board = new Board(boardPath);
      this.currentBoardFile = file;
      this.phase = 'board';
      this.emitChange();
      return { success: true };
    } catch (err) {
      return { success: false, error: `Failed to load board: ${file}` };
    }
  }

  resetGame(): void {
    this.phase = 'lobby';
    this.board = null;
    this.currentTile = null;
    this.currentClue = null;
    this.currentAnswer = null;
    this.currentValue = 0;
    this.isDailyDouble = false;
    this.buzzedPlayer = null;
    this.secondChanceUsed = false;
    this.timer.cancel();
    this.clearBuzzBuffer();
    // Reset scores
    for (const player of this.players.values()) {
      player.score = 0;
    }
    this.emitChange();
  }

  selectTile(col: number, row: number): { success: boolean; error?: string } {
    if (this.phase !== 'board') return { success: false, error: 'Not in board phase' };
    if (!this.board) return { success: false, error: 'No board loaded' };

    const tileState = this.board.getTileState(col, row);
    if (tileState.used) return { success: false, error: 'Tile already used' };

    const tileData = this.board.getTileData(col, row);
    this.currentTile = { col, row };
    this.currentClue = tileData.clue;
    this.currentAnswer = tileData.answer;
    this.currentValue = tileData.value;
    this.isDailyDouble = this.board.isDailyDouble(col, row);
    this.buzzedPlayer = null;
    this.secondChanceUsed = false;

    this.phase = 'clue_revealed';
    this.emitChange();
    return { success: true };
  }

  buzzIn(socketId: string): void {
    if (this.phase !== 'clue_revealed' && this.phase !== 'second_chance') return;

    const player = this.getPlayerBySocket(socketId);
    if (!player) return;

    // If in second_chance, the original wrong answerer can't buzz again
    if (this.phase === 'second_chance' && player.name === this.buzzedPlayer) return;

    this.buzzBuffer.push({ socketId, timestamp: Date.now() });

    if (!this.buzzTimeout) {
      this.buzzTimeout = setTimeout(() => {
        this.resolveBuzz();
      }, BUZZ_WINDOW_MS);
    }
  }

  private resolveBuzz(): void {
    if (this.buzzBuffer.length === 0) return;

    this.buzzBuffer.sort((a, b) => a.timestamp - b.timestamp);
    const winner = this.buzzBuffer[0];
    this.clearBuzzBuffer();

    const player = this.getPlayerBySocket(winner.socketId);
    if (!player) return;

    this.buzzedPlayer = player.name;
    this.phase = 'answering';

    const seconds = this.secondChanceUsed ? SECOND_CHANCE_SECONDS : ANSWER_TIME_SECONDS;
    this.timer.start(seconds, () => {
      this.handleTimerExpire();
    });

    this.emitChange();
  }

  private clearBuzzBuffer(): void {
    this.buzzBuffer = [];
    if (this.buzzTimeout) {
      clearTimeout(this.buzzTimeout);
      this.buzzTimeout = null;
    }
  }

  markCorrect(): void {
    if (this.phase !== 'answering') return;
    if (!this.buzzedPlayer || !this.board || !this.currentTile) return;

    const player = this.players.get(this.buzzedPlayer);
    if (player) {
      const points = this.isDailyDouble ? this.currentValue * 2 : this.currentValue;
      player.score += points;
    }

    this.timer.cancel();
    this.board.markUsed(this.currentTile.col, this.currentTile.row);
    this.closeTile();
  }

  markWrong(): void {
    if (this.phase !== 'answering') return;
    if (!this.board || !this.currentTile) return;

    this.timer.cancel();

    // Deduct points from the player who answered incorrectly
    if (this.buzzedPlayer) {
      const player = this.players.get(this.buzzedPlayer);
      if (player) {
        const points = this.isDailyDouble ? this.currentValue * 2 : this.currentValue;
        player.score -= points;
      }
    }

    if (!this.secondChanceUsed) {
      // First wrong — give second chance
      this.secondChanceUsed = true;
      this.phase = 'second_chance';

      this.timer.start(SECOND_CHANCE_SECONDS, () => {
        this.handleTimerExpire();
      });

      this.emitChange();
    } else {
      // Second wrong — close tile
      this.board.markUsed(this.currentTile.col, this.currentTile.row);
      this.closeTile();
    }
  }

  skipTile(): void {
    if (this.phase !== 'clue_revealed' && this.phase !== 'answering' && this.phase !== 'second_chance') return;
    if (!this.board || !this.currentTile) return;

    this.timer.cancel();
    this.clearBuzzBuffer();
    this.board.markUsed(this.currentTile.col, this.currentTile.row);
    this.closeTile();
  }

  private closeTile(): void {
    this.currentTile = null;
    this.currentClue = null;
    this.currentAnswer = null;
    this.currentValue = 0;
    this.isDailyDouble = false;
    this.buzzedPlayer = null;
    this.secondChanceUsed = false;
    this.clearBuzzBuffer();

    if (this.board && this.board.allTilesUsed()) {
      this.phase = 'game_over';
    } else {
      this.phase = 'board';
    }
    this.emitChange();
  }

  private handleTimerExpire(): void {
    if (this.phase === 'answering') {
      if (!this.secondChanceUsed) {
        // Time ran out on first answer — give second chance
        this.secondChanceUsed = true;
        this.phase = 'second_chance';
        this.timer.start(SECOND_CHANCE_SECONDS, () => {
          this.handleTimerExpire();
        });
        this.emitChange();
      } else {
        // Time ran out on second chance answerer — close tile
        if (this.board && this.currentTile) {
          this.board.markUsed(this.currentTile.col, this.currentTile.row);
        }
        this.closeTile();
      }
    } else if (this.phase === 'second_chance') {
      // No one buzzed during second chance — close tile
      if (this.board && this.currentTile) {
        this.board.markUsed(this.currentTile.col, this.currentTile.row);
      }
      this.closeTile();
    }

    if (this.onTimerExpireCallback) this.onTimerExpireCallback();
  }

  // State serialization
  getPublicState(): PublicGameState {
    return {
      phase: this.phase,
      categories: this.board?.categories ?? [],
      tiles: this.board?.getTileStates() ?? [],
      players: Array.from(this.players.values()).map(p => p.toState()),
      currentTile: this.currentTile,
      currentClue: this.currentClue,
      currentValue: this.currentValue,
      isDailyDouble: this.isDailyDouble,
      buzzedPlayer: this.buzzedPlayer,
      timerEndsAt: this.timer.endsAt,
      boardName: this.board?.name ?? '',
    };
  }

  getHostState(): HostGameState {
    return {
      ...this.getPublicState(),
      currentAnswer: this.currentAnswer,
      availableBoards: Board.listBoards(this.boardsDir),
    };
  }
}

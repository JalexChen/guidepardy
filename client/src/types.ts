export type GamePhase = 'lobby' | 'board' | 'clue_revealed' | 'answering' | 'second_chance' | 'game_over';

export interface TileState {
  value: number;
  used: boolean;
  isDailyDouble: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  connected: boolean;
}

export interface PublicGameState {
  phase: GamePhase;
  categories: string[];
  tiles: TileState[][];
  players: PlayerState[];
  currentTile: { col: number; row: number } | null;
  currentClue: string | null;
  currentValue: number | null;
  isDailyDouble: boolean;
  buzzedPlayer: string | null;
  timerEndsAt: number | null;
  boardName: string;
}

export interface HostGameState extends PublicGameState {
  currentAnswer: string | null;
  availableBoards: string[];
}

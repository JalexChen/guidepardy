import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket';
import { PublicGameState, HostGameState } from '../types';

const defaultState: PublicGameState = {
  phase: 'lobby',
  categories: [],
  tiles: [],
  players: [],
  currentTile: null,
  currentClue: null,
  currentValue: null,
  isDailyDouble: false,
  buzzedPlayer: null,
  timerEndsAt: null,
  boardName: '',
};

interface GameContextType {
  gameState: PublicGameState;
  hostState: HostGameState | null;
  isHost: boolean;
  playerName: string | null;
  isConnected: boolean;
  joinAsPlayer: (name: string) => Promise<{ success: boolean; error?: string }>;
  joinAsHost: (secret: string) => Promise<{ success: boolean; error?: string }>;
  buzz: () => void;
  selectTile: (col: number, row: number) => void;
  markCorrect: () => void;
  markWrong: () => void;
  skipTile: () => void;
  startGame: (board?: string) => void;
  addPlayer: (name: string) => void;
  removePlayer: (name: string) => void;
  adjustScore: (name: string, delta: number) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<PublicGameState>(defaultState);
  const [hostState, setHostState] = useState<HostGameState | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('game:state', (state: PublicGameState) => {
      setGameState(state);
    });

    socket.on('game:host_state', (state: HostGameState) => {
      setHostState(state);
      setGameState(state); // host state is a superset
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game:state');
      socket.off('game:host_state');
    };
  }, []);

  const joinAsPlayer = useCallback((name: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socket.emit('player:join', { name });
      socket.once('player:joined', (data: { success: boolean; error?: string; name?: string }) => {
        if (data.success) {
          setPlayerName(name);
          localStorage.setItem('guidepardy-name', name);
        }
        resolve(data);
      });
    });
  }, []);

  const joinAsHost = useCallback((secret: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socket.emit('host:join', { secret });
      socket.once('host:authenticated', (data: { success: boolean; error?: string }) => {
        if (data.success) {
          setIsHost(true);
        }
        resolve(data);
      });
    });
  }, []);

  const buzz = useCallback(() => {
    socket.emit('player:buzz');
  }, []);

  const selectTile = useCallback((col: number, row: number) => {
    socket.emit('host:select_tile', { col, row });
  }, []);

  const markCorrect = useCallback(() => {
    socket.emit('host:correct');
  }, []);

  const markWrong = useCallback(() => {
    socket.emit('host:wrong');
  }, []);

  const skipTile = useCallback(() => {
    socket.emit('host:skip');
  }, []);

  const startGame = useCallback((board?: string) => {
    socket.emit('host:start', { board });
  }, []);

  const addPlayer = useCallback((name: string) => {
    socket.emit('host:add_player', { name });
  }, []);

  const removePlayer = useCallback((name: string) => {
    socket.emit('host:remove_player', { name });
  }, []);

  const adjustScore = useCallback((name: string, delta: number) => {
    socket.emit('host:adjust_score', { name, delta });
  }, []);

  const resetGame = useCallback(() => {
    socket.emit('host:reset');
  }, []);

  return (
    <GameContext.Provider value={{
      gameState,
      hostState,
      isHost,
      playerName,
      isConnected,
      joinAsPlayer,
      joinAsHost,
      buzz,
      selectTile,
      markCorrect,
      markWrong,
      skipTile,
      startGame,
      addPlayer,
      removePlayer,
      adjustScore,
      resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

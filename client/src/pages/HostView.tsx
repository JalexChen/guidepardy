import { useState } from 'react';
import { useGame } from '../context/GameContext';
import Board from '../components/Board';
import Clue from '../components/Clue';
import Leaderboard from '../components/Leaderboard';
import ScoreEditor from '../components/ScoreEditor';
import Timer from '../components/Timer';

export default function HostView() {
  const {
    gameState, hostState, isHost,
    joinAsHost, selectTile, markCorrect, markWrong, skipTile,
    startGame, addPlayer, removePlayer, adjustScore, resetGame,
  } = useGame();

  const [secret, setSecret] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('default');

  if (!isHost) {
    return (
      <div className="join-page">
        <div className="join-card">
          <h1 className="join-title">HOST LOGIN</h1>
          <div className="join-form">
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  joinAsHost(secret).then(r => {
                    if (!r.success) setAuthError(r.error || 'Invalid secret');
                  });
                }
              }}
              placeholder="Host secret"
              className="join-input"
              autoFocus
            />
            <button
              onClick={() => {
                joinAsHost(secret).then(r => {
                  if (!r.success) setAuthError(r.error || 'Invalid secret');
                });
              }}
              className="btn btn-gold btn-large"
            >
              Login
            </button>
          </div>
          {authError && <div className="join-error">{authError}</div>}
        </div>
      </div>
    );
  }

  const state = hostState || gameState;
  const { phase, categories, tiles, currentTile, currentClue, currentValue, isDailyDouble, buzzedPlayer, timerEndsAt, players } = state;
  const currentAnswer = hostState?.currentAnswer ?? null;
  const availableBoards = hostState?.availableBoards ?? [];

  const showClue = phase === 'clue_revealed' || phase === 'answering' || phase === 'second_chance';
  const currentCategory = currentTile ? categories[currentTile.col] : '';

  return (
    <div className="host-view">
      <div className="host-main">
        {phase === 'lobby' && (
          <div className="host-lobby">
            <h1 className="join-title">GUIDEPARDY!</h1>
            <p className="host-subtitle">Host Control Panel</p>

            <div className="host-start-controls">
              {availableBoards.length > 0 && (
                <select
                  value={selectedBoard}
                  onChange={e => setSelectedBoard(e.target.value)}
                  className="host-board-select"
                >
                  {availableBoards.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}
              <button onClick={() => startGame(selectedBoard)} className="btn btn-gold btn-large">
                Start Game
              </button>
            </div>
          </div>
        )}

        {phase === 'game_over' && (
          <div className="game-over">
            <h1 className="join-title">GAME OVER!</h1>
            <Leaderboard players={players} />
            <button onClick={resetGame} className="btn btn-gold btn-large" style={{ marginTop: '1rem' }}>
              New Game
            </button>
          </div>
        )}

        {(phase === 'board' || showClue) && (
          <>
            {showClue && currentClue && currentValue !== null ? (
              <div className="host-clue-area">
                <Clue
                  clue={currentClue}
                  value={currentValue}
                  category={currentCategory}
                  isDailyDouble={isDailyDouble}
                  timerEndsAt={timerEndsAt}
                  answer={currentAnswer}
                  buzzedPlayer={buzzedPlayer}
                />

                <div className="host-judge-controls">
                  {(phase === 'answering') && (
                    <>
                      <button onClick={markCorrect} className="btn btn-large btn-correct">
                        Correct
                      </button>
                      <button onClick={markWrong} className="btn btn-large btn-wrong">
                        Wrong
                      </button>
                    </>
                  )}
                  {phase === 'second_chance' && (
                    <div className="host-second-chance">
                      Waiting for second buzz...
                    </div>
                  )}
                  <button onClick={skipTile} className="btn btn-large btn-skip">
                    Skip / Close
                  </button>
                </div>
              </div>
            ) : (
              <Board
                categories={categories}
                tiles={tiles}
                currentTile={currentTile}
                clickable={phase === 'board'}
                onTileClick={selectTile}
              />
            )}
          </>
        )}
      </div>

      <div className="host-sidebar">
        <ScoreEditor
          players={players}
          onAdjustScore={adjustScore}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
        />

        {phase !== 'lobby' && phase !== 'game_over' && (
          <button onClick={resetGame} className="btn btn-wrong btn-small" style={{ marginTop: '1rem', width: '100%' }}>
            Reset Game
          </button>
        )}
      </div>
    </div>
  );
}

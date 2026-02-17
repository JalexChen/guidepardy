import { useGame } from '../context/GameContext';
import Board from '../components/Board';
import Clue from '../components/Clue';
import BuzzButton from '../components/BuzzButton';
import Leaderboard from '../components/Leaderboard';

export default function PlayerView() {
  const { gameState, playerName, buzz } = useGame();
  const { phase, categories, tiles, currentTile, currentClue, currentValue, isDailyDouble, buzzedPlayer, timerEndsAt, players } = gameState;

  const showClue = phase === 'clue_revealed' || phase === 'answering' || phase === 'second_chance';
  const canBuzz = (phase === 'clue_revealed' || phase === 'second_chance') && buzzedPlayer !== playerName;

  if (phase === 'lobby') {
    return (
      <div className="player-view">
        <div className="lobby-waiting">
          <h1 className="join-title">GUIDEPARDY!</h1>
          <p>Welcome, <strong>{playerName}</strong>!</p>
          <p>Waiting for the host to start the game...</p>
          <Leaderboard players={players} />
        </div>
      </div>
    );
  }

  if (phase === 'game_over') {
    return (
      <div className="player-view">
        <div className="game-over">
          <h1 className="join-title">GAME OVER!</h1>
          <Leaderboard players={players} />
        </div>
      </div>
    );
  }

  const currentCategory = currentTile ? categories[currentTile.col] : '';

  return (
    <div className="player-view">
      <div className="player-main">
        {showClue && currentClue && currentValue !== null ? (
          <div className="player-clue-area">
            <Clue
              clue={currentClue}
              value={currentValue}
              category={currentCategory}
              isDailyDouble={isDailyDouble}
              timerEndsAt={timerEndsAt}
              buzzedPlayer={buzzedPlayer}
            />
            <BuzzButton
              onBuzz={buzz}
              disabled={!canBuzz}
              buzzedPlayer={buzzedPlayer}
              playerName={playerName}
            />
          </div>
        ) : (
          <Board
            categories={categories}
            tiles={tiles}
            currentTile={currentTile}
            clickable={false}
          />
        )}
      </div>
      <div className="player-sidebar">
        <Leaderboard players={players} />
      </div>
    </div>
  );
}

import { PlayerState } from '../types';

interface LeaderboardProps {
  players: PlayerState[];
}

export default function Leaderboard({ players }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Leaderboard</h3>
      <div className="leaderboard-list">
        {sorted.map((player, i) => (
          <div key={player.name} className={`leaderboard-item ${!player.connected ? 'leaderboard-disconnected' : ''}`}>
            <span className="leaderboard-rank">#{i + 1}</span>
            <span className="leaderboard-name">
              <span className={`leaderboard-dot ${player.connected ? 'dot-connected' : 'dot-disconnected'}`} />
              {player.name}
            </span>
            <span className={`leaderboard-score ${player.score < 0 ? 'score-negative' : ''}`}>
              ${player.score.toLocaleString()}
            </span>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="leaderboard-empty">No players yet</div>
        )}
      </div>
    </div>
  );
}

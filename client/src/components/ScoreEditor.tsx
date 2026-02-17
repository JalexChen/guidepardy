import { useState } from 'react';
import { PlayerState } from '../types';

interface ScoreEditorProps {
  players: PlayerState[];
  onAdjustScore: (name: string, delta: number) => void;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (name: string) => void;
}

export default function ScoreEditor({ players, onAdjustScore, onAddPlayer, onRemovePlayer }: ScoreEditorProps) {
  const [newName, setNewName] = useState('');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const handleAdd = () => {
    if (newName.trim()) {
      onAddPlayer(newName.trim());
      setNewName('');
    }
  };

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="score-editor">
      <h3 className="score-editor-title">Players</h3>

      <div className="score-editor-add">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add player name..."
          className="score-editor-input"
        />
        <button onClick={handleAdd} className="btn btn-small btn-gold">Add</button>
      </div>

      <div className="score-editor-list">
        {sorted.map(player => (
          <div key={player.name} className="score-editor-item">
            <div className="score-editor-info">
              <span className={`leaderboard-dot ${player.connected ? 'dot-connected' : 'dot-disconnected'}`} />
              <span className="score-editor-name">{player.name}</span>
              <span className={`score-editor-score ${player.score < 0 ? 'score-negative' : ''}`}>
                ${player.score.toLocaleString()}
              </span>
            </div>
            <div className="score-editor-controls">
              <button onClick={() => onAdjustScore(player.name, -100)} className="btn btn-tiny btn-wrong">-100</button>
              <input
                type="number"
                value={customAmounts[player.name] || ''}
                onChange={e => setCustomAmounts({ ...customAmounts, [player.name]: e.target.value })}
                placeholder="Pts"
                className="score-editor-custom"
              />
              <button
                onClick={() => {
                  const amt = parseInt(customAmounts[player.name] || '0');
                  if (amt !== 0) {
                    onAdjustScore(player.name, amt);
                    setCustomAmounts({ ...customAmounts, [player.name]: '' });
                  }
                }}
                className="btn btn-tiny btn-gold"
              >Set</button>
              <button onClick={() => onAdjustScore(player.name, 100)} className="btn btn-tiny btn-correct">+100</button>
              <button onClick={() => onRemovePlayer(player.name)} className="btn btn-tiny btn-wrong">X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

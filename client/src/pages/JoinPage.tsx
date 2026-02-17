import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function JoinPage() {
  const { joinAsPlayer, isConnected } = useGame();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  // Try to reconnect with saved name
  useEffect(() => {
    const saved = localStorage.getItem('guidepardy-name');
    if (saved && isConnected) {
      setName(saved);
      joinAsPlayer(saved).then(result => {
        if (result.success) {
          navigate('/play');
        }
      });
    }
  }, [isConnected]);

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setJoining(true);
    setError('');

    const result = await joinAsPlayer(name.trim());
    if (result.success) {
      navigate('/play');
    } else {
      setError(result.error || 'Failed to join');
      setJoining(false);
    }
  };

  return (
    <div className="join-page">
      <div className="join-card">
        <h1 className="join-title">GUIDEPARDY!</h1>
        <p className="join-subtitle">Enter your name to join the game</p>

        {!isConnected && (
          <div className="join-status">Connecting to server...</div>
        )}

        <div className="join-form">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="Your name"
            className="join-input"
            disabled={!isConnected || joining}
            maxLength={20}
            autoFocus
          />
          <button
            onClick={handleJoin}
            className="btn btn-gold btn-large"
            disabled={!isConnected || joining}
          >
            {joining ? 'Joining...' : 'Join Game'}
          </button>
        </div>

        {error && <div className="join-error">{error}</div>}
      </div>
    </div>
  );
}

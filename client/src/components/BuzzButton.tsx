interface BuzzButtonProps {
  onBuzz: () => void;
  disabled: boolean;
  buzzedPlayer: string | null;
  playerName: string | null;
}

export default function BuzzButton({ onBuzz, disabled, buzzedPlayer, playerName }: BuzzButtonProps) {
  const isBuzzed = buzzedPlayer === playerName;

  return (
    <button
      className={`buzz-button ${isBuzzed ? 'buzz-button-active' : ''} ${disabled ? 'buzz-button-disabled' : ''}`}
      onClick={onBuzz}
      disabled={disabled}
    >
      {isBuzzed ? 'YOU BUZZED IN!' : disabled ? 'WAIT...' : 'BUZZ IN!'}
    </button>
  );
}

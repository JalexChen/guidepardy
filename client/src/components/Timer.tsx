import { useTimer } from '../hooks/useTimer';

interface TimerProps {
  endsAt: number | null;
}

export default function Timer({ endsAt }: TimerProps) {
  const remaining = useTimer(endsAt);

  if (!endsAt || remaining <= 0) return null;

  const seconds = Math.ceil(remaining / 1000);
  const isUrgent = seconds <= 5;

  return (
    <div className={`timer ${isUrgent ? 'timer-urgent' : ''}`}>
      <span className="timer-value">{seconds}</span>
      <span className="timer-label">seconds</span>
    </div>
  );
}

import Timer from './Timer';

interface ClueProps {
  clue: string;
  value: number;
  category: string;
  isDailyDouble: boolean;
  timerEndsAt: number | null;
  answer?: string | null;  // Only shown to host
  buzzedPlayer?: string | null;
}

export default function Clue({ clue, value, category, isDailyDouble, timerEndsAt, answer, buzzedPlayer }: ClueProps) {
  return (
    <div className="clue-overlay">
      <div className="clue-content">
        {isDailyDouble && (
          <div className="clue-daily-double">DAILY DOUBLE!</div>
        )}
        <div className="clue-category">{category}</div>
        <div className="clue-value">${isDailyDouble ? value * 2 : value}</div>
        <div className="clue-text">{clue}</div>

        {buzzedPlayer && (
          <div className="clue-buzzer">
            <span className="clue-buzzer-name">{buzzedPlayer}</span> buzzed in!
          </div>
        )}

        <Timer endsAt={timerEndsAt} />

        {answer && (
          <div className="clue-answer">
            <span className="clue-answer-label">Answer:</span> What is {answer}?
          </div>
        )}
      </div>
    </div>
  );
}

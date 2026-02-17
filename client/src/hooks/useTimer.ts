import { useState, useEffect } from 'react';

export function useTimer(endsAt: number | null): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }

    let animFrame: number;

    const tick = () => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r > 0) {
        animFrame = requestAnimationFrame(tick);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [endsAt]);

  return remaining;
}

import { useCallback, useEffect, useRef, useState } from 'react';

export type ResendCooldown = {
  /** Seconds left before resend is allowed again. 0 when idle/ready. */
  remaining: number;
  /** True when the user is allowed to trigger a resend. */
  canResend: boolean;
  /** Begins (or restarts) the cooldown countdown. */
  start: () => void;
};

/**
 * Tracks a countdown (in seconds) that gates OTP resend actions, so a user
 * can't hammer the SMS/email provider with repeat requests.
 */
export function useResendCooldown(seconds: number): ResendCooldown {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          clear();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }, [clear, seconds]);

  useEffect(() => clear, [clear]);

  return { remaining, canResend: remaining === 0, start };
}

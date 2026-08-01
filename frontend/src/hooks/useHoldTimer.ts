"use client";

import { useEffect, useRef, useState } from "react";

export function useHoldTimer(
  expiresAt: number | null,
  onExpired: () => void
): number | null {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const onExpiredRef = useRef(onExpired);
  const expiredCalledRef = useRef(false);

  onExpiredRef.current = onExpired;

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(null);
      expiredCalledRef.current = false;
      return;
    }

    expiredCalledRef.current = false;

    const tick = () => {
      const left = expiresAt - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        if (!expiredCalledRef.current) {
          expiredCalledRef.current = true;
          onExpiredRef.current();
        }
      } else {
        setRemainingMs(left);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  return remainingMs;
}

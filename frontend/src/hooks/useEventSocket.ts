"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { SeatStatus, SeatUpdatedPayload } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_BOOKING_WS_URL ?? "http://localhost:5002";

export function useEventSocket(
  eventId: string | null,
  onSeatUpdated: (payload: SeatUpdatedPayload) => void
) {
  const callbackRef = useRef(onSeatUpdated);
  callbackRef.current = onSeatUpdated;

  useEffect(() => {
    if (!eventId) return;

    let socket: Socket | null = null;

    try {
      socket = io(WS_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socket.emit("joinEvent", eventId);

      socket.on("seatUpdated", (payload: { seatId: string; status: SeatStatus }) => {
        callbackRef.current(payload);
      });
    } catch {
      // WebSocket unavailable — seat map still works via polling on actions
    }

    return () => {
      socket?.disconnect();
    };
  }, [eventId]);
}

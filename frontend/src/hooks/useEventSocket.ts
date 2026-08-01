"use client";

import { useCallback, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { SeatStatus, SeatUpdatedPayload } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_BOOKING_WS_URL ?? "http://localhost:5002";

function roomName(eventId: string) {
  return `event:${eventId}`;
}

export function useEventSocket(
  eventId: string | null,
  onSeatUpdated: (payload: SeatUpdatedPayload) => void
) {
  const callbackRef = useRef(onSeatUpdated);
  callbackRef.current = onSeatUpdated;

  const socketRef = useRef<Socket | null>(null);
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;

  const joinEventRoom = useCallback((reason = "manual") => {
    const socket = socketRef.current;
    const id = eventIdRef.current;

    if (!socket || !id) {
      console.warn("[Socket] joinEvent skipped — no socket or eventId", { reason, id });
      return;
    }

    if (!socket.connected) {
      console.warn("[Socket] joinEvent skipped — socket not connected yet", {
        reason,
        eventId: id,
        room: roomName(id),
      });
      return;
    }

    console.log("[Socket] joinEvent", {
      reason,
      eventId: id,
      room: roomName(id),
      socketId: socket.id,
    });
    socket.emit("joinEvent", id);
  }, []);

  useEffect(() => {
    if (!eventId) return;

    let socket: Socket | null = null;

    try {
      socket = io(WS_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
      });
      socketRef.current = socket;

      const handleConnect = (reason: string) => {
        console.log("[Socket] connected", {
          reason,
          eventId,
          room: roomName(eventId),
          socketId: socket?.id,
        });
        socket?.emit("joinEvent", eventId);
        console.log("[Socket] joinEvent emitted on connect", {
          eventId,
          room: roomName(eventId),
        });
      };

      socket.on("connect", () => handleConnect("initial-or-reconnect"));
      if (socket.connected) {
        handleConnect("already-connected");
      }

      socket.io.on("reconnect", (attempt) => {
        console.log("[Socket] reconnected", { attempt, eventId, room: roomName(eventId) });
        socket?.emit("joinEvent", eventId);
      });

      socket.on("disconnect", (disconnectReason) => {
        console.log("[Socket] disconnected", { disconnectReason, eventId });
      });

      socket.on("seatUpdated", (payload: { seatId: string; status: SeatStatus }) => {
        console.log("[Socket] seatUpdated received", {
          payload,
          eventId,
          room: roomName(eventId),
          socketId: socket?.id,
          connected: socket?.connected,
        });
        callbackRef.current(payload);
      });
    } catch (err) {
      console.error("[Socket] failed to initialize", err);
    }

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [eventId]);

  return { joinEventRoom };
}

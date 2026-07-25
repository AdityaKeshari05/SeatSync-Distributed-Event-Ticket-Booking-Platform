"use client";

import { useCallback, useState } from "react";
import { Armchair, Check, Clock, Loader2, Lock, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEventSocket } from "@/hooks/useEventSocket";
import { api, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import type { Seat, SeatStatus } from "@/types";

interface SeatMapProps {
  eventId: string;
  initialSeats: Seat[];
}

const statusConfig: Record<
  SeatStatus,
  { label: string; className: string; icon: typeof Armchair }
> = {
  available: {
    label: "Available",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20 cursor-pointer",
    icon: Armchair,
  },
  locked: {
    label: "Held",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300 cursor-not-allowed opacity-80",
    icon: Lock,
  },
  booked: {
    label: "Booked",
    className: "border-red-500/20 bg-red-500/10 text-red-400/70 cursor-not-allowed opacity-60",
    icon: X,
  },
};

export function SeatMap({ eventId, initialSeats }: SeatMapProps) {
  const { user } = useAuth();
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [heldSeatId, setHeldSeatId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const updateSeatStatus = useCallback((seatId: string, status: SeatStatus) => {
    setSeats((prev) =>
      prev.map((s) => (s.id === seatId ? { ...s, status } : s))
    );
  }, []);

  useEventSocket(eventId, ({ seatId, status }) => {
    updateSeatStatus(seatId, status);
    if (status === "available" && heldSeatId === seatId) {
      setHeldSeatId(null);
    }
  });

  const handleSelect = async (seat: Seat) => {
    if (!user) {
      setMessage({ type: "error", text: "Please login to select a seat." });
      return;
    }
    if (seat.status !== "available") return;

    setLoading(seat.id);
    setMessage(null);

    try {
      await api.seats.select(seat.id, user.token);
      updateSeatStatus(seat.id, "locked");
      setHeldSeatId(seat.id);
      setSelectedSeatId(seat.id);
      setMessage({
        type: "success",
        text: "Seat held for 5 minutes. Confirm your booking before the hold expires.",
      });
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to select seat";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(null);
    }
  };

  const handleBook = async () => {
    if (!user || !heldSeatId) return;

    setLoading("book");
    setMessage(null);

    try {
      const { booking } = await api.seats.book(heldSeatId, user.token);
      updateSeatStatus(heldSeatId, "booked");
      setHeldSeatId(null);
      setSelectedSeatId(null);
      setMessage({
        type: "success",
        text: `Booking confirmed! Reference: ${booking.id.slice(0, 8).toUpperCase()}`,
      });
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to book seat";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(null);
    }
  };

  const handleRelease = async () => {
    if (!user || !heldSeatId) return;

    setLoading("release");
    setMessage(null);

    try {
      await api.seats.release(heldSeatId, user.token);
      updateSeatStatus(heldSeatId, "available");
      setHeldSeatId(null);
      setSelectedSeatId(null);
      setMessage({ type: "info", text: "Seat released successfully." });
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to release seat";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(null);
    }
  };

  const availableCount = seats.filter((s) => s.status === "available").length;
  const bookedCount = seats.filter((s) => s.status === "booked").length;
  const lockedCount = seats.filter((s) => s.status === "locked").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Available", count: availableCount, color: "text-emerald-400" },
          { label: "Held", count: lockedCount, color: "text-amber-400" },
          { label: "Booked", count: bookedCount, color: "text-red-400" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center"
          >
            <p className={cn("text-2xl font-bold", color)}>{count}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
        {(["available", "locked", "booked"] as SeatStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className={cn(
                "h-4 w-4 rounded border",
                status === "available" && "border-emerald-500/50 bg-emerald-500/20",
                status === "locked" && "border-amber-500/50 bg-amber-500/20",
                status === "booked" && "border-red-500/30 bg-red-500/10"
              )}
            />
            <span className="capitalize">{statusConfig[status].label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-violet-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-violet-400" />
          Live updates via WebSocket
        </div>
      </div>

      {message && (
        <Alert
          variant={message.type === "error" ? "error" : message.type === "success" ? "success" : "info"}
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Stage */}
      <div className="relative">
        <div className="mx-auto mb-8 max-w-md rounded-t-full border border-violet-500/20 bg-gradient-to-b from-violet-500/10 to-transparent px-8 py-3 text-center">
          <span className="text-sm font-medium tracking-widest text-violet-300/80 uppercase">
            Stage
          </span>
        </div>

        {/* Seat grid */}
        <div className="mx-auto grid max-w-2xl grid-cols-5 gap-2 sm:grid-cols-8 sm:gap-3 md:grid-cols-10">
          {seats.map((seat) => {
            const config = statusConfig[seat.status];
            const isHeld = heldSeatId === seat.id;
            const isSelected = selectedSeatId === seat.id;
            const isLoading = loading === seat.id;

            return (
              <button
                key={seat.id}
                onClick={() => handleSelect(seat)}
                disabled={
                  seat.status !== "available" ||
                  isLoading ||
                  (!!heldSeatId && !isHeld)
                }
                title={`${seat.seatNumber} — ${config.label}`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-medium transition-all duration-200",
                  config.className,
                  isSelected && "ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950",
                  isHeld && "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <config.icon className="mb-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{seat.seatIndex}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking actions */}
      {heldSeatId && user && (
        <div className="sticky bottom-4 rounded-2xl border border-violet-500/20 bg-slate-900/95 p-4 shadow-2xl shadow-violet-500/10 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-white">
                Seat {seats.find((s) => s.id === heldSeatId)?.seatNumber} selected
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-300">
                <Clock className="h-4 w-4" />
                Held for 5 minutes — confirm or release
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRelease}
                isLoading={loading === "release"}
              >
                Release
              </Button>
              <Button onClick={handleBook} isLoading={loading === "book"}>
                <Check className="h-4 w-4" />
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {!user && (
        <Alert variant="warning" title="Login required">
          Sign in to select and book seats. Browse the seat map freely — updates appear in real time.
        </Alert>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { SeatMap } from "@/components/events/SeatMap";
import { Alert } from "@/components/ui/Alert";
import { api, ApiClientError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Event, Seat } from "@/types";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [{ events }, seatsRes] = await Promise.all([
          api.events.list(),
          api.events.getSeats(eventId),
        ]);

        if (cancelled) return;

        const found = events.find((e) => e.id === eventId);
        if (!found) {
          setError("Event not found.");
          setEvent(null);
        } else {
          setEvent(found);
        }
        setSeats(seatsRes.seats);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load event. Check that services are running."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (eventId) load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-white/5" />
          <div className="h-32 rounded-2xl bg-white/5" />
          <div className="h-64 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <Link
          href="/events"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
        <Alert variant="error">{error ?? "Event not found"}</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/events"
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All events
      </Link>

      <header className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-white">{event.title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-violet-400" />
            {event.venue}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-400" />
            {formatDate(event.eventDate)}
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" />
            {event.totalSeats} total seats
          </span>
        </div>
        <p className="mt-4 font-mono text-xs text-slate-500">
          Seats: GET /events/event/{event.id.slice(0, 8)}…/seats · Hold: POST /seats/:seatId/select|release · Pay: POST /seats/:seatId/checkout
        </p>
      </header>

      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Select your seat</h2>
        <SeatMap eventId={event.id} initialSeats={seats} />
      </section>
    </div>
  );
}

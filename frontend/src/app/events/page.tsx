"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { Event } from "@/types";
import Link from "next/link";

export default function EventsPage() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const { events: list } = await api.events.list();
      const sorted = [...list].sort(
        (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );
      setEvents(sorted);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to load events. Ensure gateway and event service are running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Events</h1>
          <p className="mt-2 text-slate-400">
            Public listing from the event microservice —{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-violet-300">
              GET /events/
            </code>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={loadEvents} isLoading={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {isAdmin && (
            <Link
              href="/admin/events/new"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white"
            >
              Create event
            </Link>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-8" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && events.length === 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-lg text-slate-400">No events yet</p>
          {isAdmin ? (
            <Link href="/admin/events/new" className="mt-4 inline-block text-violet-400 hover:underline">
              Create the first event
            </Link>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              An admin can add events from the admin panel.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

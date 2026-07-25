"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { ApiClientError, useAuth } from "@/context/AuthContext";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { getMinEventDate } from "@/lib/utils";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [totalSeats, setTotalSeats] = useState("50");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEventDate(getMinEventDate());
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Alert variant="warning" title="Authentication required">
          You must be logged in to access the admin panel.{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Alert variant="error" title="Admin access only">
          <span className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            Creating events requires an admin JWT (
            <code className="text-xs">POST /events/event</code>
            ). Your account has the <strong>user</strong> role. Promote your user to admin in the
            auth database to use this page.
          </span>
        </Alert>
        <Link href="/events" className="mt-6 inline-block text-violet-400 hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const seatsNum = parseInt(totalSeats, 10);

    try {
      const { event } = await api.events.create(
        {
          title,
          venue,
          eventDate: new Date(eventDate).toISOString(),
          totalSeats: seatsNum,
        },
        user.token
      );
      setSuccess(`Event "${event.title}" created with ${event.totalSeats} seats.`);
      setTimeout(() => router.push(`/events/${event.id}`), 1500);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        if (err.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, vals] of Object.entries(err.errors)) {
            mapped[key] = vals[0] ?? "";
          }
          setFieldErrors(mapped);
        }
      } else {
        setError("Failed to create event.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-white">Create event</h1>
      <p className="mb-8 text-slate-400">
        Admin endpoint —{" "}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-violet-300">
          POST /events/event
        </code>{" "}
        with Bearer token and admin role.
      </p>

      <Card>
        <CardHeader>
          <p className="text-sm text-slate-400">
            Creates the event and generates seats (1–1000) in the event service.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && <Alert variant="success">{success}</Alert>}

            <Input
              label="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={fieldErrors.title}
              required
              minLength={2}
              placeholder="Summer Concert 2026"
            />
            <Input
              label="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              error={fieldErrors.venue}
              required
              minLength={3}
              placeholder="City Arena"
            />
            <Input
              label="Event date & time"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              error={fieldErrors.eventDate}
              required
            />
            <Input
              label="Total seats"
              type="number"
              min={1}
              max={1000}
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
              error={fieldErrors.totalSeats}
              required
            />
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Create event
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

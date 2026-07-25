import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const isPast = new Date(event.eventDate) < new Date();

  return (
    <Link href={`/events/${event.id}`}>
      <Card hover className="group h-full overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.3),transparent_50%)]" />
          <div className="absolute bottom-3 left-4">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isPast
                  ? "bg-slate-500/20 text-slate-400"
                  : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {isPast ? "Past" : formatRelativeDate(event.eventDate)}
            </span>
          </div>
        </div>
        <CardBody>
          <h3 className="mb-3 text-lg font-semibold text-white transition-colors group-hover:text-violet-300">
            {event.title}
          </h3>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-violet-400" />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-violet-400" />
              <span>{formatDate(event.eventDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-violet-400" />
              <span>{event.totalSeats} seats available</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

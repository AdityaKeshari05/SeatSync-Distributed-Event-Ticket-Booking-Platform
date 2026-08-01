import {
  ArrowRight,
  Lock,
  Radio,
  Server,
  Shield,
  Zap,
} from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

const features = [
  {
    icon: Shield,
    title: "JWT Authentication",
    description:
      "Register and login via the auth microservice. Protected routes use Bearer tokens with user and admin roles.",
  },
  {
    icon: Server,
    title: "Microservices Gateway",
    description:
      "All REST traffic flows through the API gateway — auth, events, and booking services on dedicated paths.",
  },
  {
    icon: Lock,
    title: "Distributed Seat Locks",
    description:
      "Select a seat for a 5-minute hold with Redis-backed locking, then confirm or release before it expires.",
  },
  {
    icon: Radio,
    title: "Live WebSocket Updates",
    description:
      "Socket.io on the booking service broadcasts seat status changes to everyone viewing the same event.",
  },
  {
    icon: Zap,
    title: "Race-Safe Booking",
    description:
      "Concurrent booking attempts resolve cleanly — only one user wins when multiple people target the same seat.",
  },
];

const flow = [
  { step: "1", title: "Browse events", detail: "GET /events/ — public event listing from the event service." },
  { step: "2", title: "View seat map", detail: "GET /events/event/:id/seats — load availability for an event." },
  { step: "3", title: "Select (hold)", detail: "POST /seats/:seatId/select — lock seat for 5 minutes (auth required)." },
  { step: "4", title: "Pay via Razorpay", detail: "POST /seats/:seatId/checkout — create payment order for held seat." },
  { step: "5", title: "Server confirms", detail: "Live seatUpdated (status: booked) after server-side payment verification." },
  { step: "6", title: "Release (optional)", detail: "POST /seats/:seatId/release — cancel hold before paying." },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-sm text-violet-300">
            Advanced Seat Booking Platform
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Book seats in{" "}
            <span className="text-gradient">real time</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400">
            A frontend built for your Node.js microservices stack — auth, events, booking,
            and gateway — with live seat maps and secure JWT flows.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LinkButton href="/events" size="lg">
              Browse Events
              <ArrowRight className="h-5 w-5" />
            </LinkButton>
            <LinkButton href="/system" variant="outline" size="lg">
              System Status
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-white">Backend capabilities</h2>
          <p className="mb-12 text-center text-slate-400">
            Every major API surface from your services is reflected in this UI.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15">
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Booking flow</h2>
          <div className="space-y-4">
            {flow.map(({ step, title, detail }) => (
              <Card key={step}>
                <CardBody className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
                    {step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-1 font-mono text-xs text-slate-500 sm:text-sm">{detail}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Admins can create events via POST /events/event (JWT + admin role).
          </p>
        </div>
      </section>
    </div>
  );
}

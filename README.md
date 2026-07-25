# SeatSync — Distributed Event Ticket Booking Platform

A microservices-based ticket booking system built to solve the real engineering
problems behind live event ticketing: preventing double-booking under concurrent
demand, real-time seat availability, and safe payment handling — the same class
of problems platforms like Ticketmaster and BookMyShow deal with at scale.

Built as a deep-dive into distributed systems concepts using Node.js, TypeScript,
Redis, PostgreSQL, and Docker.

## Why this project

Most booking-system tutorials skip the hard part: what happens when 100 people
try to book the same seat at the exact same moment? This project doesn't skip
it. It reproduces the race condition under real concurrent load, then fixes it
with a Redis-based distributed lock — with a load test proving the fix holds
at 100 simultaneous requests.

## Architecture

The system is split into four independently deployable services, coordinated
through an API gateway and a shared Redis pub/sub layer:

- **API Gateway** — single entry point, routes requests to the correct
  downstream service
- **Auth Service** — signup, login, JWT issuance
- **Event Service** — event and seat management
- **Booking Service** — seat holds, booking confirmation, WebSocket broadcasts

Each service owns its own data boundary and communicates with the others over
HTTP or Redis pub/sub — not shared database access. JWT verification is
decentralized: every service independently verifies tokens using a shared
secret, rather than calling back to the auth service on every request.

```
Client
  │
  ▼
API Gateway (5000)
  │
  ├──► Auth Service (5001) ─────► PostgreSQL (users)
  ├──► Event Service (5002) ────► PostgreSQL (events, seats)
  │         │
  │         └──► Redis (pub/sub: seat status changes)
  │
  └──► Booking Service (5003) ──► PostgreSQL (bookings)
            │
            ├──► Redis (distributed locks + pub/sub subscriber)
            └──► Socket.io (live seat updates to connected clients)
```

## Key engineering decisions

**Race condition prevention.** Seat booking uses a Redis `SET ... NX PX` lock
before any database write. This closes the gap between "check if available"
and "mark as booked" that naive implementations leave open — verified with a
concurrency test firing 100 simultaneous booking requests at a single seat.

**Seat hold flow.** Booking isn't instant. Selecting a seat acquires a
time-limited hold (mirroring real ticketing UX) and broadcasts the change
live to every other client viewing that event. The booking only finalizes
once the hold owner confirms — matching how production ticketing systems
actually behave.

**Cross-service real-time updates.** Socket.io connections live in the
booking service, but seat state can change from the event service too (e.g.
an expired hold being cleaned up). Rather than having services call each
other directly for this, the event service publishes to a Redis channel and
the booking service subscribes — a standard pattern for scaling WebSocket
broadcasts across services that don't share a process.

**Modular monolith on a shared database.** All services share one PostgreSQL
instance, but each service's Prisma schema only declares the tables it owns.
Relations that would cross a service boundary are deliberately replaced with
plain foreign-key fields — a pragmatic middle ground between a full monolith
and fully isolated per-service databases.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js, TypeScript |
| API | Express |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Caching / Locking | Redis (ioredis) |
| Real-time | Socket.io |
| Auth | JWT, bcrypt |
| Validation | Zod |
| Containerization | Docker, Docker Compose |

## Running locally

Requires Docker and Docker Compose.

```bash
git clone <repo-url>
cd seat-sync
docker compose up --build
```

This starts all four services, Redis, and the frontend together. The gateway
is available at `http://localhost:5000`.

Each service also has its own `.env.example` if you'd rather run services
individually during development.

## Project status

Actively in development. Completed: auth, event/seat management, booking
with race-condition-safe locking, real-time updates, microservices split,
API gateway, and full Docker Compose orchestration. In progress: Stripe
payment integration. Planned: CI/CD pipeline and cloud deployment.
# SeatFlow Frontend

Next.js UI for the Advanced Seat Booking Platform microservices backend.

## Prerequisites

Backend services must be running:

| Service | Port | Command (from repo root) |
|---------|------|---------------------------|
| Gateway | 5000 | `cd gateway && npm run dev` |
| Auth | 5001 | `cd services/auth_service && npm run dev` |
| Booking | 5002 | `cd services/booking_service && npm run dev` |
| Event | 5003 | `cd services/event_service && npm run dev` |

Also ensure PostgreSQL and Redis are available per each service's `.env`.

## Setup

```bash
cd frontend
cp .env.local.example .env.local   # optional if .env.local already exists
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- **REST:** Browser calls `/api/gateway/*`; Next.js rewrites to `GATEWAY_URL` (default `http://localhost:5000`) to avoid CORS on the gateway.
- **WebSocket:** Socket.io connects directly to `NEXT_PUBLIC_BOOKING_WS_URL` (default `http://localhost:5002`).

## Features mapped to backend

| UI | Backend |
|----|---------|
| Register / Login | `POST /auth/register`, `POST /auth/login` |
| Events list | `GET /events/` |
| Event detail + seat map | `GET /events/event/:id/seats` |
| Select / book / release | `POST /seats/:seatId/select|book|release` |
| Live seat updates | Socket.io `joinEvent` + `seatUpdated` |
| Create event (admin) | `POST /events/event` |
| System status | Gateway + service health endpoints |

## Admin events

New users register with role `user`. To create events, set `role` to `admin` for your user in the auth service database.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint

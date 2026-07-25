"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ServiceCheck {
  id: string;
  name: string;
  path: string;
  port: string;
  description: string;
  status: "loading" | "ok" | "error";
  message?: string;
}

const initialServices: Omit<ServiceCheck, "status" | "message">[] = [
  {
    id: "gateway",
    name: "API Gateway",
    path: "/health",
    port: "5000",
    description: "Reverse proxy for /auth, /events, /seats",
  },
  {
    id: "auth",
    name: "Auth Service",
    path: "/auth/health",
    port: "5001",
    description: "Register, login, JWT issuance",
  },
  {
    id: "events",
    name: "Event Service",
    path: "/events/health",
    port: "5003",
    description: "Event CRUD, seat listing, internal seat API",
  },
  {
    id: "booking",
    name: "Booking Service",
    path: "/seats/health",
    port: "5002",
    description: "Select, book, release + Socket.io on :5002",
  },
];

const apiEndpoints = [
  { method: "POST", path: "/auth/register", auth: "None", service: "Auth" },
  { method: "POST", path: "/auth/login", auth: "None", service: "Auth" },
  { method: "GET", path: "/events/", auth: "None", service: "Event" },
  { method: "POST", path: "/events/event", auth: "Admin JWT", service: "Event" },
  { method: "GET", path: "/events/event/:id/seats", auth: "None", service: "Event" },
  { method: "POST", path: "/seats/:seatId/select", auth: "User JWT", service: "Booking" },
  { method: "POST", path: "/seats/:seatId/book", auth: "User JWT", service: "Booking" },
  { method: "POST", path: "/seats/:seatId/release", auth: "User JWT", service: "Booking" },
];

export default function SystemPage() {
  const [services, setServices] = useState<ServiceCheck[]>(
    initialServices.map((s) => ({ ...s, status: "loading" as const }))
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setServices((prev) =>
      prev.map((s) => ({ ...s, status: "loading" as const, message: undefined }))
    );

    const checks = await Promise.all(
      initialServices.map(async (svc) => {
        try {
          let res;
          switch (svc.id) {
            case "gateway":
              res = await api.health.gateway();
              break;
            case "auth":
              res = await api.health.auth();
              break;
            case "events":
              res = await api.health.events();
              break;
            case "booking":
              res = await api.health.booking();
              break;
            default:
              throw new Error("Unknown service");
          }
          return {
            ...svc,
            status: "ok" as const,
            message: res.message,
          };
        } catch (err) {
          return {
            ...svc,
            status: "error" as const,
            message:
              err instanceof ApiClientError
                ? err.message
                : "Unreachable — start the service and gateway",
          };
        }
      })
    );

    setServices(checks);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const allOk = services.every((s) => s.status === "ok");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <Activity className="h-8 w-8 text-violet-400" />
            System status
          </h1>
          <p className="mt-2 text-slate-400">
            Health checks for gateway and microservices (via Next.js proxy to{" "}
            <code className="text-violet-300">localhost:5000</code>).
          </p>
        </div>
        <Button variant="outline" onClick={checkHealth} isLoading={services.some((s) => s.status === "loading")}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {lastChecked && (
        <p className="mb-6 text-sm text-slate-500">
          Last checked: {lastChecked.toLocaleTimeString()}
          {allOk && services[0]?.status !== "loading" && (
            <span className="ml-3 text-emerald-400">All services operational</span>
          )}
        </p>
      )}

      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {services.map((svc) => (
          <Card key={svc.id}>
            <CardBody className="flex gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  svc.status === "ok" && "bg-emerald-500/15",
                  svc.status === "error" && "bg-red-500/15",
                  svc.status === "loading" && "bg-white/5"
                )}
              >
                {svc.status === "loading" ? (
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                ) : svc.status === "ok" ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{svc.name}</h3>
                  <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-400">
                    :{svc.port}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{svc.description}</p>
                <p className="mt-2 font-mono text-xs text-violet-400/80">GET {svc.path}</p>
                {svc.message && (
                  <p
                    className={cn(
                      "mt-2 text-xs",
                      svc.status === "ok" ? "text-emerald-400/80" : "text-red-400"
                    )}
                  >
                    {svc.message}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Server className="h-5 w-5 text-violet-400" />
            REST API surface (via gateway)
          </h2>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0 sm:px-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500">
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium">Path</th>
                <th className="px-6 py-3 font-medium">Auth</th>
                <th className="px-6 py-3 font-medium">Service</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((row) => (
                <tr key={row.path + row.method} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-3">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 font-mono text-xs font-medium",
                        row.method === "GET" && "bg-blue-500/15 text-blue-300",
                        row.method === "POST" && "bg-emerald-500/15 text-emerald-300"
                      )}
                    >
                      {row.method}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-300">{row.path}</td>
                  <td className="px-6 py-3 text-slate-400">{row.auth}</td>
                  <td className="px-6 py-3 text-slate-400">{row.service}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Alert variant="info" title="Real-time (WebSocket)">
        Clients connect directly to the booking service at{" "}
        <code className="text-violet-300">NEXT_PUBLIC_BOOKING_WS_URL</code> (default{" "}
        <code className="text-violet-300">http://localhost:5002</code>). Emit{" "}
        <code className="text-violet-300">joinEvent</code> with an event ID; listen for{" "}
        <code className="text-violet-300">seatUpdated</code> payloads.
      </Alert>

      <p className="mt-8 text-center text-sm text-slate-500">
        Legacy monolith at repo root (port 4999) is not used by this frontend — only the
        microservices gateway.
      </p>
    </div>
  );
}

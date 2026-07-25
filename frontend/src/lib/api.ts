import type {
  ApiError,
  AuthUser,
  Booking,
  CreateEventPayload,
  Event,
  HealthResponse,
  LoginPayload,
  RegisterPayload,
  Seat,
} from "@/types";

const API_BASE = "/api/gateway";

class ApiClientError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = data as ApiError;
    throw new ApiClientError(
      error.message ?? "Something went wrong",
      response.status,
      error.errors ?? error.error
    );
  }

  return data as T;
}

export const api = {
  health: {
    gateway: () => request<HealthResponse>("/health"),
    auth: () => request<HealthResponse>("/auth/health"),
    events: () => request<HealthResponse>("/events/health"),
    booking: () => request<HealthResponse>("/seats/health"),
  },

  auth: {
    register: (payload: RegisterPayload) =>
      request<{ user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    login: (payload: LoginPayload) =>
      request<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  events: {
    list: () => request<{ events: Event[] }>("/events/"),

    create: (payload: CreateEventPayload, token: string) =>
      request<{ event: Event }>("/events/event", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token),

    getSeats: (eventId: string) =>
      request<{ seats: Seat[] }>(`/events/event/${eventId}/seats`),
  },

  seats: {
    select: (seatId: string, token: string) =>
      request<{ message: string; seatId: string }>(
        `/seats/${seatId}/select`,
        { method: "POST" },
        token
      ),

    book: (seatId: string, token: string) =>
      request<{ booking: Booking }>(
        `/seats/${seatId}/book`,
        { method: "POST" },
        token
      ),

    release: (seatId: string, token: string) =>
      request<{ message: string; seatId: string }>(
        `/seats/${seatId}/release`,
        { method: "POST" },
        token
      ),
  },
};

export { ApiClientError };

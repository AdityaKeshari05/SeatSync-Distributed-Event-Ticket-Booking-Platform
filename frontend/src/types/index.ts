export type Role = "user" | "admin";
export type SeatStatus = "available" | "locked" | "booked";
export type BookingStatus = "confirmed" | "cancelled";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  eventDate: string;
  totalSeats: number;
  priceInPaise?: number;
  createdBy: string;
  createdAt: string;
}

export interface Seat {
  id: string;
  eventId: string;
  seatNumber: string;
  seatIndex: number;
  status: SeatStatus;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  seatId: string;
  eventId: string;
  status: BookingStatus;
  bookedAt: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  error?: Record<string, string[]>;
}

export interface HealthResponse {
  status: string;
  message: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateEventPayload {
  title: string;
  venue: string;
  eventDate: string;
  totalSeats: number;
  priceInRupees: number;
}

export interface SeatUpdatedPayload {
  seatId: string;
  status: SeatStatus;
}

export interface CheckoutOrder {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  keyId: string;
}

export type CheckoutPhase =
  | "held"
  | "checkout_loading"
  | "razorpay_open"
  | "confirming"
  | "confirm_pending"
  | "confirmed";

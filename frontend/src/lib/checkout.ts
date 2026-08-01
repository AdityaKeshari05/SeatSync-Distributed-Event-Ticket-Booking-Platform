import { ApiClientError } from "@/lib/api";

export const HOLD_DURATION_MS = 5 * 60 * 1000;
export const BOOKING_CONFIRM_TIMEOUT_MS = 18 * 1000;

export function getCheckoutErrorMessage(err: unknown): string {
  if (!(err instanceof ApiClientError)) {
    return "Unable to start checkout. Please try again.";
  }

  if (err.status === 403) {
    return "This seat is being held by someone else. Please choose a different seat.";
  }

  if (err.status === 404) {
    return "This seat no longer exists. Please select another seat.";
  }

  if (err.status === 409) {
    const msg = err.message.toLowerCase();
    if (msg.includes("booked") || msg.includes("must be selected")) {
      return "Your hold on this seat is no longer active. Please select the seat again.";
    }
    return "You need an active hold before paying. Select the seat again if your hold expired.";
  }

  return err.message || "Something went wrong while starting checkout.";
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatPaise(paise: number, currency: string): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(paise / 100);
  }
  return `${(paise / 100).toFixed(2)} ${currency}`;
}

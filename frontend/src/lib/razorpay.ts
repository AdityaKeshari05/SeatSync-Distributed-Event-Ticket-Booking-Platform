import type { CheckoutOrder } from "@/types";

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface OpenRazorpayCheckoutOptions {
  order: CheckoutOrder;
  seatLabel: string;
  userName: string;
  userEmail: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss: () => void;
  onFailure?: (response: { error: { description: string } }) => void;
}

interface RazorpayConstructorOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayConstructorOptions) => RazorpayInstance;
  }
}

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(
  options: OpenRazorpayCheckoutOptions
): Promise<RazorpayInstance> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout is unavailable");
  }

  const instance = new window.Razorpay({
    key: options.order.keyId,
    amount: options.order.orderAmount,
    currency: options.order.orderCurrency,
    name: "SeatFlow",
    description: `Booking for ${options.seatLabel}`,
    order_id: options.order.orderId,
    prefill: {
      name: options.userName,
      email: options.userEmail,
    },
    theme: { color: "#7c3aed" },
    handler: options.onSuccess,
    modal: {
      ondismiss: options.onDismiss,
    },
  });

  if (options.onFailure) {
    instance.on("payment.failed", options.onFailure);
  }

  instance.open();
  return instance;
}

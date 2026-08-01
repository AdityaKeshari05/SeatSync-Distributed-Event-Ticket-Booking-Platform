"use client";

import {

  ArrowRight,

  CalendarDays,

  CheckCircle2,

  Clock,

  CreditCard,

  Loader2,

  Sparkles,

  X,

} from "lucide-react";

import { cn } from "@/lib/utils";

import { formatCountdown, formatPaise } from "@/lib/checkout";

import { Alert } from "@/components/ui/Alert";

import { Button, LinkButton } from "@/components/ui/Button";

import type { CheckoutPhase, Seat } from "@/types";



interface CheckoutPanelProps {

  eventId: string;

  seat: Seat;

  remainingMs: number | null;

  phase: CheckoutPhase;

  checkoutMessage: string | null;

  checkoutMessageType: "error" | "info" | "success";

  lastOrderAmount: number | null;

  lastOrderCurrency: string;

  isCancelling: boolean;

  paymentDisabled: boolean;

  onCancel: () => void;

  onProceedToPayment: () => void;

  onDismissConfirmed?: () => void;

}



export function CheckoutPanel({

  seat,

  remainingMs,

  phase,

  checkoutMessage,

  checkoutMessageType,

  lastOrderAmount,

  lastOrderCurrency,

  isCancelling,

  paymentDisabled,

  onCancel,

  onProceedToPayment,

  onDismissConfirmed,

}: CheckoutPanelProps) {

  const isUrgent = remainingMs !== null && remainingMs <= 30_000 && remainingMs > 0;

  const isExpired = remainingMs === 0;



  if (phase === "confirmed") {

    return (

      <div className="sticky bottom-4 rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">

        <div className="flex flex-col gap-5">

          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">

              <CheckCircle2 className="h-9 w-9 text-emerald-400" />

            </div>

            <div className="flex-1">

              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/80">

                Payment verified

              </p>

              <h3 className="mt-1 text-xl font-semibold text-white">Booking confirmed</h3>

              <p className="mt-2 text-sm text-slate-400">

                <span className="font-medium text-emerald-300">{seat.seatNumber}</span> is

                reserved for you. Your payment was verified server-side and the seat is now

                marked as booked.

              </p>

            </div>

            <Sparkles className="hidden h-7 w-7 text-emerald-400/80 sm:block" />

          </div>



          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

            <LinkButton href="/events" variant="outline" size="md">

              <CalendarDays className="h-4 w-4" />

              Browse events

            </LinkButton>

            <button

              onClick={onDismissConfirmed || onCancel}

              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-teal-500 cursor-pointer"

            >

              Back to this event

              <ArrowRight className="h-4 w-4" />

            </button>

          </div>

        </div>

      </div>

    );

  }



  if (phase === "confirming" || phase === "confirm_pending") {

    return (

      <div className="sticky bottom-4 rounded-2xl border border-violet-500/30 bg-slate-900/95 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-xl">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">

            {phase === "confirming" ? (

              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />

            ) : (

              <Clock className="h-6 w-6 text-amber-400" />

            )}

          </div>

          <div className="flex-1 space-y-2">

            <h3 className="font-semibold text-white">

              {phase === "confirming"

                ? "Confirming your booking…"

                : "Payment received, confirming your booking — this may take a moment"}

            </h3>

            <p className="text-sm text-slate-400">

              {phase === "confirming"

                ? `Waiting for server verification of ${seat.seatNumber}. Your seat will update automatically once payment is confirmed.`

                : "Server confirmation is still in progress. Stay on this page — your seat will update automatically when verified."}

            </p>

            {phase === "confirm_pending" && (

              <p className="text-xs text-slate-500">

                You can stay on this page or check back shortly — booking completes when a live

                seat update arrives from the server.

              </p>

            )}

          </div>

        </div>

      </div>

    );

  }



  return (

    <div className="sticky bottom-4 rounded-2xl border border-violet-500/20 bg-slate-900/95 p-4 shadow-2xl shadow-violet-500/10 backdrop-blur-xl sm:p-6">

      <div className="flex flex-col gap-4">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <p className="font-semibold text-white">{seat.seatNumber} selected</p>

            <p className="mt-1 text-sm text-slate-400">

              Complete payment before your hold expires

            </p>

            {lastOrderAmount !== null && (

              <p className="mt-2 text-sm font-medium text-violet-300">

                {formatPaise(lastOrderAmount, lastOrderCurrency)}

              </p>

            )}

          </div>



          {remainingMs !== null && !isExpired && (

            <div

              className={cn(

                "flex items-center gap-2 rounded-xl border px-4 py-2.5",

                isUrgent

                  ? "border-red-500/30 bg-red-500/10 text-red-300"

                  : "border-amber-500/20 bg-amber-500/10 text-amber-200"

              )}

            >

              <Clock className={cn("h-4 w-4 shrink-0", isUrgent && "animate-pulse")} />

              <div>

                <p className="text-xs uppercase tracking-wide opacity-70">Hold expires in</p>

                <p className="font-mono text-lg font-semibold tabular-nums">

                  {formatCountdown(remainingMs)}

                </p>

              </div>

            </div>

          )}

        </div>



        {checkoutMessage && (

          <Alert

            variant={

              checkoutMessageType === "error"

                ? "error"

                : checkoutMessageType === "success"

                  ? "success"

                  : "info"

            }

          >

            {checkoutMessage}

          </Alert>

        )}



        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

          <Button

            variant="outline"

            onClick={onCancel}

            isLoading={isCancelling}

            disabled={paymentDisabled || isCancelling}

            className="sm:order-1"

          >

            <X className="h-4 w-4" />

            Release hold

          </Button>

          <Button

            onClick={onProceedToPayment}

            isLoading={phase === "checkout_loading"}

            disabled={paymentDisabled || isExpired || isCancelling}

            className="sm:order-2"

          >

            {phase === "razorpay_open" ? (

              <>

                <Loader2 className="h-4 w-4 animate-spin" />

                Payment window open…

              </>

            ) : (

              <>

                <CreditCard className="h-4 w-4" />

                Pay with Razorpay

              </>

            )}

          </Button>

        </div>



        <p className="text-center text-xs text-slate-500 sm:text-right">

          Checkout via POST /seats/:seatId/checkout · booking confirmed via live seat update

        </p>

      </div>

    </div>

  );

}



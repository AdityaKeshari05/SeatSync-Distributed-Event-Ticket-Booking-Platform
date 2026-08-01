"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Armchair, Loader2, Lock, X } from "lucide-react";
import { CheckoutPanel } from "@/components/events/CheckoutPanel";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/context/AuthContext";
import { useHoldTimer } from "@/hooks/useHoldTimer";
import { useEventSocket } from "@/hooks/useEventSocket";
import { api, ApiClientError } from "@/lib/api";
import {
  BOOKING_CONFIRM_TIMEOUT_MS,
  getCheckoutErrorMessage,
  HOLD_DURATION_MS,
} from "@/lib/checkout";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { cn, normalizeSeatId } from "@/lib/utils";
import type { CheckoutPhase, Seat, SeatStatus } from "@/types";

interface SeatMapProps {
  eventId: string;
  initialSeats: Seat[];
}

const statusConfig: Record<
  SeatStatus,
  { label: string; className: string; icon: typeof Armchair }
> = {
  available: {
    label: "Available",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20 cursor-pointer",
    icon: Armchair,
  },
  locked: {
    label: "Held",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300 cursor-not-allowed opacity-80",
    icon: Lock,
  },
  booked: {
    label: "Booked",
    className: "border-red-500/20 bg-red-500/10 text-red-400/70 cursor-not-allowed opacity-60",
    icon: X,
  },
};

export function SeatMap({ eventId, initialSeats }: SeatMapProps) {
  const { user } = useAuth();
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [heldSeatId, setHeldSeatId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>("held");
  const [selectLoading, setSelectLoading] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutMessageType, setCheckoutMessageType] = useState<"error" | "info" | "success">(
    "info"
  );
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [lastOrderAmount, setLastOrderAmount] = useState<number | null>(null);
  const [lastOrderCurrency, setLastOrderCurrency] = useState("INR");

  const heldSeatIdRef = useRef<string | null>(null);
  const userTokenRef = useRef<string | null>(null);
  const shouldReleaseOnUnmountRef = useRef(false);
  const holdExpiredNaturallyRef = useRef(false);
  const checkoutPhaseRef = useRef<CheckoutPhase>("held");
  const confirmTimeoutRef = useRef<number | null>(null);
  const awaitingConfirmationSeatIdRef = useRef<string | null>(null);
  const seatsRef = useRef<Seat[]>(seats);
  const confirmingStartedAtRef = useRef<number | null>(null);
  const confirmDelayTimerRef = useRef<number | null>(null);

  heldSeatIdRef.current = heldSeatId;
  userTokenRef.current = user?.token ?? null;
  checkoutPhaseRef.current = checkoutPhase;
  seatsRef.current = seats;

  const updateSeatStatus = useCallback((seatId: string, status: SeatStatus) => {
    const normalized = normalizeSeatId(seatId);
    setSeats((prev) =>
      prev.map((s) =>
        normalizeSeatId(s.id) === normalized ? { ...s, status } : s
      )
    );
  }, []);

  const resetHoldState = useCallback(
    (options?: { releaseOnUnmount?: boolean; clearSelection?: boolean }) => {
      setHeldSeatId(null);
      setHoldExpiresAt(null);
      setCheckoutPhase("held");
      checkoutPhaseRef.current = "held";
      awaitingConfirmationSeatIdRef.current = null;
      confirmingStartedAtRef.current = null;
      if (confirmDelayTimerRef.current) {
        window.clearTimeout(confirmDelayTimerRef.current);
        confirmDelayTimerRef.current = null;
      }
      setLastOrderAmount(null);
      setCheckoutMessage(null);
      shouldReleaseOnUnmountRef.current = options?.releaseOnUnmount ?? false;
      if (options?.clearSelection !== false) {
        setSelectedSeatId(null);
      }
    },
    []
  );

  const handleDismissConfirmed = useCallback(() => {
    resetHoldState({ releaseOnUnmount: false, clearSelection: true });
    setBannerMessage(null);
  }, [resetHoldState]);

  const handleHoldExpired = useCallback(() => {
    if (!heldSeatIdRef.current) return;
    if (["confirming", "confirm_pending", "confirmed"].includes(checkoutPhaseRef.current)) {
      return;
    }

    const expiredSeatId = heldSeatIdRef.current;
    holdExpiredNaturallyRef.current = true;
    shouldReleaseOnUnmountRef.current = false;
    updateSeatStatus(expiredSeatId, "available");
    resetHoldState({ releaseOnUnmount: false });
    setBannerMessage({
      type: "info",
      text: "Your hold on this seat expired. Please select again.",
    });
  }, [resetHoldState, updateSeatStatus]);

  const remainingMs = useHoldTimer(holdExpiresAt, handleHoldExpired);

  const handleBookingConfirmed = useCallback(
    (seatId: string) => {
      if (confirmTimeoutRef.current) {
        window.clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = null;
      }
      if (confirmDelayTimerRef.current) {
        window.clearTimeout(confirmDelayTimerRef.current);
        confirmDelayTimerRef.current = null;
      }
      awaitingConfirmationSeatIdRef.current = null;
      updateSeatStatus(seatId, "booked");
      shouldReleaseOnUnmountRef.current = false;

      const minConfirmingDuration = 1500;
      const startedAt = confirmingStartedAtRef.current;
      const elapsed = startedAt ? Date.now() - startedAt : minConfirmingDuration;
      const remainingDelay = Math.max(0, minConfirmingDuration - elapsed);

      if (checkoutPhaseRef.current !== "confirming" && remainingDelay > 0) {
        checkoutPhaseRef.current = "confirming";
        setCheckoutPhase("confirming");
      }

      confirmDelayTimerRef.current = window.setTimeout(() => {
        confirmingStartedAtRef.current = null;
        checkoutPhaseRef.current = "confirmed";
        setCheckoutPhase("confirmed");
        setHeldSeatId(seatId);
        setHoldExpiresAt(null);
        setCheckoutMessage(null);
        setBannerMessage({
          type: "success",
          text: "Your seat is booked!",
        });
      }, remainingDelay);
    },
    [updateSeatStatus]
  );

  const { joinEventRoom } = useEventSocket(eventId, ({ seatId, status }) => {
    console.log("[SeatMap] seatUpdated handler", {
      seatId,
      status,
      heldSeatId: heldSeatIdRef.current,
      awaitingConfirmationSeatId: awaitingConfirmationSeatIdRef.current,
      checkoutPhase: checkoutPhaseRef.current,
    });

    updateSeatStatus(seatId, status);

    const phase = checkoutPhaseRef.current;
    const normalizedIncoming = normalizeSeatId(seatId);
    const isOurHeldSeat =
      normalizeSeatId(heldSeatIdRef.current) === normalizedIncoming;
    const isAwaitingConfirmation =
      normalizeSeatId(awaitingConfirmationSeatIdRef.current) === normalizedIncoming;

    if (
      status === "booked" &&
      (isOurHeldSeat || isAwaitingConfirmation)
    ) {
      console.log("[SeatMap] booking confirmed via seatUpdated", { seatId, phase });
      handleBookingConfirmed(seatId);
      return;
    }

    if (
      status === "available" &&
      isOurHeldSeat &&
      !["confirming", "confirm_pending", "confirmed"].includes(phase)
    ) {
      resetHoldState({ releaseOnUnmount: false });
      awaitingConfirmationSeatIdRef.current = null;
      setBannerMessage({
        type: "info",
        text: "Your hold on this seat is no longer active. Please select again.",
      });
    }
  });

  // Auto-confirm if held/awaiting seat status becomes "booked" in seats state while in checkout flow
  useEffect(() => {
    const targetId = awaitingConfirmationSeatIdRef.current || heldSeatIdRef.current;
    if (!targetId) return;

    if (["confirming", "confirm_pending", "razorpay_open", "checkout_loading", "held"].includes(checkoutPhase)) {
      const isBooked = seats.some(
        (s) => normalizeSeatId(s.id) === normalizeSeatId(targetId) && s.status === "booked"
      );
      if (isBooked && checkoutPhaseRef.current !== "confirmed") {
        console.log("[SeatMap] seat status is booked in seats array, confirming booking", { targetId });
        handleBookingConfirmed(targetId);
      }
    }
  }, [seats, checkoutPhase, handleBookingConfirmed]);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        window.clearTimeout(confirmTimeoutRef.current);
      }

      const seatId = heldSeatIdRef.current;
      const token = userTokenRef.current;
      if (shouldReleaseOnUnmountRef.current && seatId && token) {
        api.seats.release(seatId, token).catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (checkoutPhase !== "confirming") return;

    confirmTimeoutRef.current = window.setTimeout(() => {
      setCheckoutPhase("confirm_pending");
    }, BOOKING_CONFIRM_TIMEOUT_MS);

    return () => {
      if (confirmTimeoutRef.current) {
        window.clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = null;
      }
    };
  }, [checkoutPhase]);

  const handleSelect = async (seat: Seat) => {
    if (!user) {
      setBannerMessage({ type: "error", text: "Please login to select a seat." });
      return;
    }
    if (seat.status !== "available") return;
    if (heldSeatId && heldSeatId !== seat.id) return;

    setSelectLoading(seat.id);
    setBannerMessage(null);
    setCheckoutMessage(null);
    holdExpiredNaturallyRef.current = false;

    try {
      await api.seats.select(seat.id, user.token);
      updateSeatStatus(seat.id, "locked");
      setHeldSeatId(seat.id);
      setSelectedSeatId(seat.id);
      setHoldExpiresAt(Date.now() + HOLD_DURATION_MS);
      setCheckoutPhase("held");
      shouldReleaseOnUnmountRef.current = true;
      setBannerMessage({
        type: "success",
        text: "Seat held for 5 minutes. Complete payment via Razorpay before the timer runs out.",
      });
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to select seat";
      setBannerMessage({ type: "error", text: msg });
    } finally {
      setSelectLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!user || !heldSeatId) return;
    if (["confirming", "confirm_pending", "confirmed"].includes(checkoutPhase)) return;

    setIsCancelling(true);
    setCheckoutMessage(null);
    shouldReleaseOnUnmountRef.current = false;

    try {
      await api.seats.release(heldSeatId, user.token);
      updateSeatStatus(heldSeatId, "available");
      resetHoldState({ releaseOnUnmount: false });
      setBannerMessage({ type: "info", text: "Seat released — others can book it now." });
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to release seat";
      shouldReleaseOnUnmountRef.current = true;
      setCheckoutMessageType("error");
      setCheckoutMessage(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!user || !heldSeatId) return;
    if (checkoutPhase === "checkout_loading" || checkoutPhase === "razorpay_open") return;
    if (remainingMs === 0) return;

    setCheckoutPhase("checkout_loading");
    setCheckoutMessage(null);
    joinEventRoom("before-checkout");

    try {
      const order = await api.seats.checkout(heldSeatId, user.token);
      setLastOrderAmount(order.orderAmount);
      setLastOrderCurrency(order.orderCurrency);
      setCheckoutPhase("razorpay_open");

      const seatLabel = seats.find((s) => s.id === heldSeatId)?.seatNumber ?? "your seat";

      await openRazorpayCheckout({
        order,
        seatLabel,
        userName: user.name,
        userEmail: user.email,
        onSuccess: () => {
          shouldReleaseOnUnmountRef.current = false;
          const currentHeldSeatId = heldSeatIdRef.current;
          awaitingConfirmationSeatIdRef.current = currentHeldSeatId;
          joinEventRoom("after-razorpay-success");

          const seatIsAlreadyBooked =
            currentHeldSeatId &&
            seatsRef.current.some(
              (s) =>
                normalizeSeatId(s.id) === normalizeSeatId(currentHeldSeatId) &&
                s.status === "booked"
            );

          if (checkoutPhaseRef.current === "confirmed" || seatIsAlreadyBooked) {
            console.log("[SeatMap] already confirmed before/during onSuccess", {
              currentHeldSeatId,
              phase: checkoutPhaseRef.current,
            });
            if (currentHeldSeatId) {
              handleBookingConfirmed(currentHeldSeatId);
            }
          } else {
            confirmingStartedAtRef.current = Date.now();
            checkoutPhaseRef.current = "confirming";
            setBannerMessage(null);
            setCheckoutMessage(null);
            setCheckoutPhase("confirming");
            console.log("[SeatMap] awaiting server seatUpdated", {
              seatId: currentHeldSeatId,
              eventId,
              checkoutPhase: checkoutPhaseRef.current,
            });
          }
        },
        onDismiss: () => {
          if (
            ["confirming", "confirm_pending", "confirmed"].includes(
              checkoutPhaseRef.current
            )
          ) {
            return;
          }
          setCheckoutPhase("held");
          setCheckoutMessageType("info");
          setCheckoutMessage(
            "Payment window closed. Your hold is still active — you can retry payment before it expires."
          );
        },
        onFailure: () => {
          if (
            ["confirming", "confirm_pending", "confirmed"].includes(
              checkoutPhaseRef.current
            )
          ) {
            return;
          }
          setCheckoutPhase("held");
          setCheckoutMessageType("error");
          setCheckoutMessage(
            "Payment failed. Your hold is still active — you can retry payment before it expires."
          );
        },
      });
    } catch (err) {
      setCheckoutPhase("held");
      setCheckoutMessageType("error");
      setCheckoutMessage(getCheckoutErrorMessage(err));

      if (err instanceof ApiClientError && (err.status === 403 || err.status === 409)) {
        resetHoldState({ releaseOnUnmount: false });
        if (heldSeatIdRef.current) {
          updateSeatStatus(heldSeatIdRef.current, "available");
        }
      }
    }
  };

  const heldSeat = heldSeatId ? seats.find((s) => s.id === heldSeatId) : null;
  const showCheckoutPanel =
    !!heldSeat &&
    !!user &&
    (checkoutPhase === "confirmed" ||
      checkoutPhase === "confirming" ||
      checkoutPhase === "confirm_pending" ||
      (remainingMs !== 0 && remainingMs !== null));

  const paymentDisabled =
    checkoutPhase === "checkout_loading" ||
    checkoutPhase === "razorpay_open" ||
    checkoutPhase === "confirming" ||
    checkoutPhase === "confirm_pending" ||
    remainingMs === 0;

  const availableCount = seats.filter((s) => s.status === "available").length;
  const bookedCount = seats.filter((s) => s.status === "booked").length;
  const lockedCount = seats.filter((s) => s.status === "locked").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Available", count: availableCount, color: "text-emerald-400" },
          { label: "Held", count: lockedCount, color: "text-amber-400" },
          { label: "Booked", count: bookedCount, color: "text-red-400" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center"
          >
            <p className={cn("text-2xl font-bold", color)}>{count}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
        {(["available", "locked", "booked"] as SeatStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className={cn(
                "h-4 w-4 rounded border",
                status === "available" && "border-emerald-500/50 bg-emerald-500/20",
                status === "locked" && "border-amber-500/50 bg-amber-500/20",
                status === "booked" && "border-red-500/30 bg-red-500/10"
              )}
            />
            <span className="capitalize">{statusConfig[status].label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-violet-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-violet-400" />
          Live updates via WebSocket
        </div>
      </div>

      {bannerMessage && (
        <Alert
          variant={
            bannerMessage.type === "error"
              ? "error"
              : bannerMessage.type === "success"
                ? "success"
                : "info"
          }
          onDismiss={() => setBannerMessage(null)}
        >
          {bannerMessage.text}
        </Alert>
      )}

      <div className="relative">
        <div className="mx-auto mb-8 max-w-md rounded-t-full border border-violet-500/20 bg-gradient-to-b from-violet-500/10 to-transparent px-8 py-3 text-center">
          <span className="text-sm font-medium tracking-widest text-violet-300/80 uppercase">
            Stage
          </span>
        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-5 gap-2 sm:grid-cols-8 sm:gap-3 md:grid-cols-10">
          {seats.map((seat) => {
            const config = statusConfig[seat.status];
            const isHeld = heldSeatId === seat.id;
            const isSelected = selectedSeatId === seat.id;
            const isLoading = selectLoading === seat.id;

            return (
              <button
                key={seat.id}
                onClick={() => handleSelect(seat)}
                disabled={
                  seat.status !== "available" ||
                  isLoading ||
                  (!!heldSeatId && !isHeld && checkoutPhase !== "confirmed") ||
                  checkoutPhase === "confirming" ||
                  checkoutPhase === "confirm_pending"
                }
                title={`${seat.seatNumber} — ${config.label}`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-medium transition-all duration-200",
                  config.className,
                  isSelected && "ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950",
                  isHeld && checkoutPhase !== "confirmed" && "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950",
                  isHeld && checkoutPhase === "confirmed" && "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <config.icon className="mb-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{seat.seatIndex}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showCheckoutPanel && heldSeat && (
        <CheckoutPanel
          eventId={eventId}
          seat={heldSeat}
          remainingMs={remainingMs}
          phase={checkoutPhase}
          checkoutMessage={checkoutMessage}
          checkoutMessageType={checkoutMessageType}
          lastOrderAmount={lastOrderAmount}
          lastOrderCurrency={lastOrderCurrency}
          isCancelling={isCancelling}
          paymentDisabled={paymentDisabled}
          onCancel={handleCancel}
          onProceedToPayment={handleProceedToPayment}
          onDismissConfirmed={handleDismissConfirmed}
        />
      )}

      {!user && (
        <Alert variant="warning" title="Login required">
          Sign in to select seats and proceed to payment. Browse the seat map freely — updates
          appear in real time.
        </Alert>
      )}
    </div>
  );
}

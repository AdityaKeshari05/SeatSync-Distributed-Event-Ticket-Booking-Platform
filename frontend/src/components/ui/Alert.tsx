"use client";

import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "error" | "warning";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const icons = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
};

const styles = {
  info: "border-blue-500/20 bg-blue-500/10 text-blue-200",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/20 bg-red-500/10 text-red-200",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  onDismiss,
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        styles[variant],
        className
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}

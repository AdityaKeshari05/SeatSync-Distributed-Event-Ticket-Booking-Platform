import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40",
        variant === "secondary" &&
          "bg-slate-800 text-white hover:bg-slate-700",
        variant === "ghost" &&
          "text-slate-300 hover:bg-white/5 hover:text-white",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-500",
        variant === "outline" &&
          "border border-white/10 bg-white/5 text-white hover:bg-white/10",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3.5 text-base",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children: ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200",
        variant === "primary" &&
          "bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500",
        variant === "secondary" &&
          "bg-slate-800 px-5 py-2.5 text-sm text-white hover:bg-slate-700",
        variant === "outline" &&
          "border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white hover:bg-white/10",
        size === "lg" && "px-7 py-3.5 text-base",
        className
      )}
    >
      {children}
    </Link>
  );
}

import Link from "next/link";
import { Ticket } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-slate-950/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-slate-400">
          <Ticket className="h-4 w-4" />
          <span className="text-sm">SeatFlow — Advanced Ticket Booking Platform</span>
        </div>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link href="/events" className="hover:text-slate-300">
            Events
          </Link>
          <Link href="/system" className="hover:text-slate-300">
            System Status
          </Link>
          <Link href="/login" className="hover:text-slate-300">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Ticket,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button, LinkButton } from "@/components/ui/Button";

const navLinks = [
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/system", label: "System Status", icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Seat<span className="text-violet-400">Flow</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/events/new"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!isLoading && user ? (
            <>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs capitalize text-slate-400">{user.role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : !isLoading ? (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                <LogIn className="h-4 w-4" />
                Login
              </LinkButton>
              <LinkButton href="/register" size="sm">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </LinkButton>
            </>
          ) : null}
        </div>

        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-white/5 bg-slate-950 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 hover:bg-white/5"
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/events/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-violet-300 hover:bg-white/5"
              >
                Admin Panel
              </Link>
            )}
            <hr className="my-2 border-white/5" />
            {user ? (
              <>
                <p className="px-3 text-sm text-slate-400">
                  Signed in as <span className="text-white">{user.name}</span>
                </p>
                <Button variant="ghost" onClick={() => { logout(); setMobileOpen(false); }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <LinkButton href="/login" variant="outline" className="w-full">
                  Login
                </LinkButton>
                <LinkButton href="/register" className="w-full">
                  Sign Up
                </LinkButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

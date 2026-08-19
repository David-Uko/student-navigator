import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Sparkles,
  BarChart3,
  Info,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/predict", label: "Predict", icon: Sparkles },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/about", label: "Methodology", icon: Info },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-base font-semibold">
            <GraduationCap className="h-5 w-5 text-sidebar-primary" />
            <span className="hidden sm:inline">Student Result Prediction</span>
            <span className="sm:hidden">SRPS</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>

          <button
            className="ml-auto rounded-md p-2 text-sidebar-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-sidebar-border px-4 pb-4 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(item.to)
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/80"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
          {actions}
        </div>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Rocket as RocketIcon, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase = _sb as any;

const AppShell = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [credits, setCredits] = useState<{ used: number; limit: number; extra: number; plan: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_usage").select("plan, monthly_limit, credits_used, credits_extra").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => data && setCredits({ used: data.credits_used, limit: data.monthly_limit, extra: data.credits_extra || 0, plan: data.plan }));
  }, [user]);

  const remaining = credits ? credits.limit + credits.extra - credits.used : null;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-900 text-white">
              <RocketIcon className="h-4 w-4" />
            </span>
            Rocket
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "text-neutral-900" : "hover:text-neutral-900"}>Dashboard</NavLink>
            <NavLink to="/generate" className={({ isActive }) => isActive ? "text-neutral-900" : "hover:text-neutral-900"}>Generate</NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? "text-neutral-900" : "hover:text-neutral-900"}>Settings</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {credits && (
              <span className="hidden rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 sm:inline">
                <span className="capitalize">{credits.plan}</span> · {remaining?.toLocaleString()} credits
              </span>
            )}
            <button
              onClick={async () => { await signOut(); nav("/"); }}
              className="grid h-8 w-8 place-items-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
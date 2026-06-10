import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut, User as UserIcon, Bell, CreditCard, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sb } from "@/integrations/supabase/client";
import Logo from "./Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const initial = (user?.email?.[0] || "U").toUpperCase();
  const avatarUrl = (user as any)?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo to="/projects" />
          <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex">
            <NavLink to="/projects" className={({ isActive }) => isActive ? "text-neutral-900" : "hover:text-neutral-900"}>Projects</NavLink>
            <NavLink to="/create" className={({ isActive }) => isActive ? "text-neutral-900" : "hover:text-neutral-900"}>Create</NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? "text-neutral-900" : "hover:text-neutral-900"}>Settings</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {credits && (
              <span className="hidden rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 sm:inline">
                <span className="capitalize">{credits.plan}</span> · {remaining?.toLocaleString()} credits
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-neutral-300" aria-label="Account menu">
                <Avatar className="h-8 w-8 border border-neutral-200">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                  <AvatarFallback className="bg-neutral-100 text-xs font-medium text-neutral-700">{initial}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white rounded-xl border border-neutral-200 shadow-lg p-0">
                <div className="px-4 pt-3 pb-3 border-b border-neutral-100">
                  <p className="text-xs text-neutral-500">Signed in as</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{user?.email}</p>
                </div>
                <div className="py-2">
                  <DropdownMenuItem asChild className="px-4 py-2 text-sm text-neutral-800 focus:bg-neutral-100 rounded-none cursor-pointer">
                    <Link to="/settings#billing">Account &amp; billing</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-4 py-2 text-sm text-neutral-800 focus:bg-neutral-100 rounded-none cursor-pointer">
                    <Link to="/settings#profile">Team</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-4 py-2 text-sm text-neutral-800 focus:bg-neutral-100 rounded-none cursor-pointer">
                    <Link to="/pricing">Plans</Link>
                  </DropdownMenuItem>
                </div>
                <div className="border-t border-neutral-100 py-2">
                  <DropdownMenuItem
                    onClick={async () => { await signOut(); nav("/"); }}
                    className="px-4 py-2 text-sm text-neutral-800 focus:bg-neutral-100 rounded-none cursor-pointer"
                  >
                    Sign out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
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
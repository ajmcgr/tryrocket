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
              <DropdownMenuContent align="end" className="w-56 bg-white">
                <DropdownMenuLabel className="truncate text-xs font-normal text-neutral-500">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/settings#profile"><UserIcon className="mr-2 h-4 w-4" /> Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings#notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings#account"><ShieldAlert className="mr-2 h-4 w-4" /> Account</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings#billing"><CreditCard className="mr-2 h-4 w-4" /> Billing</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); nav("/"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
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
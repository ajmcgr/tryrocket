import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "./Logo";
import ChatsSidebar from "./ChatsSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppShell = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const isFullBleedRoute = location.pathname.startsWith("/editor");
  const initial = (user?.email?.[0] || "U").toUpperCase();
  const avatarUrl = (user as any)?.user_metadata?.avatar_url as string | undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarRoutes = ["/create", "/assets", "/editor", "/projects"];
  const showSidebar = sidebarRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + "/"));

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur-xl">
        <div className="flex h-16 w-full items-center px-6">
          <Logo to="/create" className="shrink-0" />
          <nav className="ml-8 hidden items-center gap-2 text-sm font-medium text-neutral-700 md:flex">
            <NavLink to="/create" className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-brand-foreground shadow-sm transition hover:bg-brand-hover">Create</NavLink>
            <NavLink to="/assets" className={({ isActive }) => `rounded-lg px-3 py-1.5 transition ${isActive ? "text-neutral-900" : "hover:bg-neutral-100"}`}>Assets</NavLink>
            <NavLink to="/editor" className={({ isActive }) => `rounded-lg px-3 py-1.5 transition ${isActive ? "text-neutral-900" : "hover:bg-neutral-100"}`}>Editor</NavLink>
            <NavLink to="/projects" className={({ isActive }) => `rounded-lg px-3 py-1.5 transition ${isActive ? "text-neutral-900" : "hover:bg-neutral-100"}`}>Projects</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a href="mailto:alex@tryrocket.ai" className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 md:inline-flex">Support</a>
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
                    <Link to="/settings">Settings</Link>
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
      {showSidebar ? (
        <div className="flex w-full">
          <ChatsSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      ) : (
        <main className="w-full">
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default AppShell;
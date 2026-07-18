import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "./Logo";
import ShareExportModal from "./ShareExportModal";
import OnboardingTour from "./OnboardingTour";
import NotificationsBell from "./NotificationsBell";
import CommandPalette from "./CommandPalette";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AppShellOutletContext = {
  setHeaderCenter: (node: ReactNode | null) => void;
  setHeaderActions: (node: ReactNode | null) => void;
};

const AppShell = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const initial = (user?.email?.[0] || "U").toUpperCase();
  const avatarUrl = (user as any)?.user_metadata?.avatar_url as string | undefined;
  const [shareOpen, setShareOpen] = useState(false);
  const [headerCenter, setHeaderCenter] = useState<ReactNode | null>(null);
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-2.5 py-2 text-sm transition ${isActive
      ? "bg-neutral-900 text-white"
      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"}`;

  return (
    <div className="app-shell min-h-screen bg-[#f7f8fb] text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur-xl">
        <div className="relative flex h-14 w-full items-center px-4">
          <Logo to="/create" className="shrink-0" />
          <nav className="ml-7 hidden items-center gap-1 font-medium md:flex">
            <NavLink data-tour="nav-create" to="/create" className={navItemClass}>Create</NavLink>
            <NavLink data-tour="nav-assets" to="/designs" className={navItemClass}>Designs</NavLink>
            <NavLink data-tour="nav-brand" to="/brands" className={navItemClass}>Brand</NavLink>
            <NavLink to="/projects" className={navItemClass}>Projects</NavLink>
            <NavLink to="/editor" className={navItemClass}>Editor</NavLink>
            <NavLink to="/settings/profile" className={navItemClass}>Settings</NavLink>
            <Link to="/faq" className="rounded-lg px-2.5 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950">Support</Link>
          </nav>
          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center justify-center md:flex">
            <div
              className="pointer-events-auto max-w-full px-4"
              style={{ width: "min(28rem, calc(100vw - 52rem))" }}
            >
              {headerCenter}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {headerActions}
            <WorkspaceSwitcher />
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 md:inline-flex"
              aria-label="Share Rocket"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <div data-tour="nav-notifications" className="inline-flex">
              <NotificationsBell />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-neutral-300" aria-label="Account menu">
                <Avatar className="h-8 w-8 border border-neutral-200">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                  <AvatarFallback className="bg-neutral-100 text-xs font-medium text-neutral-700">{initial}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-neutral-500">Signed in as</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{user?.email}</p>
                </div>
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2 py-1.5 text-sm text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900">
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2 py-1.5 text-sm text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900">
                  <Link to="/pricing">Plans</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => { await signOut(); nav("/"); }}
                  className="cursor-pointer rounded-md px-2 py-1.5 text-sm text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <OnboardingTour />
      <CommandPalette />
      <ShareExportModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        asset={{ id: "site", title: "Rocket — AI brand & content studio" } as any}
        onCreateShareLink={async () => (typeof window !== "undefined" ? window.location.origin : "https://tryrocket.ai")}
      />
      <main className="w-full">
        <Outlet context={{ setHeaderCenter, setHeaderActions }} />
      </main>
    </div>
  );
};

export default AppShell;

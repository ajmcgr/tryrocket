import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "./Logo";
import ShareExportModal from "./ShareExportModal";
import OnboardingTour from "./OnboardingTour";
import NotificationsBell from "./NotificationsBell";
import CommandPalette from "./CommandPalette";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import {
  HelpCircle,
  Palette,
  PenTool,
  Settings,
  Share2,
  Sparkles,
  Shapes,
  LayoutTemplate,
  Star,
  Home,
  Wand2,
  Coins,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AppShellOutletContext = {
  setHeaderLeft: (node: ReactNode | null) => void;
  setHeaderCenter: (node: ReactNode | null) => void;
  setHeaderActions: (node: ReactNode | null) => void;
};

type StudioNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  tour?: string;
};

const studioNav: StudioNavItem[] = [
  { label: "Home", to: "/create", icon: Home, tour: "nav-create" },
  { label: "Wizard", to: "/create/generate", icon: Wand2 },
  { label: "Logo Designer", to: "/logos", icon: Sparkles },
  { label: "Icon Designer", to: "/icons", icon: Shapes },
  { label: "Templates", to: "/templates", icon: LayoutTemplate },
  { label: "Saved", to: "/saved", icon: Star },
  { label: "Editor", to: "/editor", icon: PenTool },
  { label: "Brand Kit", to: "/brands", icon: Palette, tour: "nav-brand" },
];

const AppShell = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const initial = (user?.email?.[0] || "U").toUpperCase();
  const avatarUrl = (user as any)?.user_metadata?.avatar_url as string | undefined;
  const [shareOpen, setShareOpen] = useState(false);
  const [headerLeft, setHeaderLeft] = useState<ReactNode | null>(null);
  const [headerCenter, setHeaderCenter] = useState<ReactNode | null>(null);
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);

  const railItemClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex h-10 w-10 items-center justify-center rounded-xl transition ${isActive
      ? "bg-neutral-900 text-white shadow-sm"
      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"}`;

  return (
    <div className="app-shell min-h-screen bg-[#f5f7fb] text-neutral-900">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[68px] flex-col items-center border-r border-neutral-200 bg-white py-3 lg:flex">
        <Link
          to="/logos"
          className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm transition hover:bg-brand-hover"
          aria-label="Logo Designer"
          title="Logo Designer"
        >
          <Sparkles className="h-5 w-5" />
        </Link>
        <nav className="flex flex-col items-center gap-2" aria-label="Rocket studio">
          {studioNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                data-tour={item.tour}
                className={railItemClass}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                <span className="pointer-events-none absolute left-12 hidden whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-2">
          <NavLink
            to="/settings/billing"
            className={railItemClass}
            aria-label="Buy Credits"
            title="Buy Credits"
          >
            <Coins className="h-[18px] w-[18px]" strokeWidth={1.9} />
            <span className="pointer-events-none absolute left-12 hidden whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block">
              Buy Credits
            </span>
          </NavLink>
          <NavLink
            to="/settings/profile"
            className={railItemClass}
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </NavLink>
          <a
            href="mailto:alex@tryrocket.ai"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            aria-label="Email support"
            title="Email support"
          >
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </a>
        </div>
      </aside>
      <div className="min-h-screen lg:pl-[68px]">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur-xl">
        <div className="relative flex h-14 w-full items-center px-4 sm:px-5">
          <Logo to="/create" size="md" className="shrink-0" />
          {headerLeft && <div className="ml-2 flex shrink-0 items-center gap-2">{headerLeft}</div>}
          <div className="ml-4 hidden items-center gap-1 md:flex lg:hidden">
            {studioNav.slice(0, 3).map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) => `rounded-lg px-2.5 py-2 text-sm font-medium transition ${isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
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
        <Outlet context={{ setHeaderLeft, setHeaderCenter, setHeaderActions }} />
      </main>
      </div>
    </div>
  );
};

export default AppShell;

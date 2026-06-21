import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationKind = "asset" | "export" | "billing" | "system" | "project";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  createdAt: number;
  read: boolean;
};

type Ctx = {
  items: Notification[];
  unread: number;
  add: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
};

const NotificationsContext = createContext<Ctx>({
  items: [], unread: 0,
  add: () => {}, markRead: () => {}, markAllRead: () => {}, remove: () => {}, clearAll: () => {},
});

const KEY = "rocket.notifications.v1";

const seed = (): Notification[] => {
  const now = Date.now();
  return [
    { id: "n1", kind: "system", title: "Welcome to Rocket", body: "Your workspace is ready. Start with Create to ship your first asset.", href: "/create", createdAt: now - 1000 * 60 * 5, read: false },
    { id: "n2", kind: "asset", title: "Logo pack generated", body: "12 logo variants are ready in your library.", href: "/assets", createdAt: now - 1000 * 60 * 60 * 2, read: false },
    { id: "n3", kind: "billing", title: "Trial credits added", body: "200 free credits applied. They expire in 14 days.", href: "/settings/billing", createdAt: now - 1000 * 60 * 60 * 24, read: true },
  ];
};

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const storeKey = user ? `${KEY}.${user.id}` : KEY;
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) { setItems(JSON.parse(raw)); return; }
      const initial = seed();
      setItems(initial);
      localStorage.setItem(storeKey, JSON.stringify(initial));
    } catch { setItems(seed()); }
  }, [storeKey]);

  const persist = useCallback((next: Notification[]) => {
    setItems(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch {}
  }, [storeKey]);

  const add: Ctx["add"] = useCallback((n) => {
    const item: Notification = { ...n, id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), read: false };
    persist([item, ...items].slice(0, 100));
  }, [items, persist]);

  // Cross-app event hook
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (!d.title) return;
      add({ kind: d.kind || "system", title: d.title, body: d.body, href: d.href });
    };
    window.addEventListener("rocket:notify", h as EventListener);
    return () => window.removeEventListener("rocket:notify", h as EventListener);
  }, [add]);

  const markRead = (id: string) => persist(items.map(i => i.id === id ? { ...i, read: true } : i));
  const markAllRead = () => persist(items.map(i => ({ ...i, read: true })));
  const remove = (id: string) => persist(items.filter(i => i.id !== id));
  const clearAll = () => persist([]);

  const unread = useMemo(() => items.filter(i => !i.read).length, [items]);

  return (
    <NotificationsContext.Provider value={{ items, unread, add, markRead, markAllRead, remove, clearAll }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
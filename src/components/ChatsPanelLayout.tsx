import { useEffect, useState, type ReactNode } from "react";
import ChatsSidebar from "./ChatsSidebar";

const STORAGE_KEY = "rocket:chats-panel-collapsed";

export default function ChatsPanelLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(STORAGE_KEY) === "1"); } catch {}
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };
  return (
    <div className="flex w-full items-stretch">
      <ChatsSidebar collapsed={collapsed} onToggle={toggle} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
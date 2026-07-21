import type { ReactNode } from "react";
import ChatsSidebar from "./ChatsSidebar";

export default function ChatsPanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-stretch">
      <ChatsSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

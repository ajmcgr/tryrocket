import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Pin, PinOff, Pencil, Trash2, Plus, PanelLeftClose, PanelLeft, MoreHorizontal, Zap, Sparkles } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const supabase = _sb as any;

export type Chat = {
  id: string;
  title: string;
  pinned: boolean;
  updated_at: string;
};

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

const ChatsSidebar = ({ collapsed, onToggle }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const activeChatId = params.get("chat");
  const [chats, setChats] = useState<Chat[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [tick, setTick] = useState(0);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .select("id,title,pinned,updated_at")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(200);
    setChats(data || []);
  };

  useEffect(() => { load(); }, [user, tick, location.pathname]);
  useEffect(() => {
    const h = () => setTick(t => t + 1);
    window.addEventListener("chats:refresh", h);
    return () => window.removeEventListener("chats:refresh", h);
  }, []);

  const togglePin = async (c: Chat) => {
    await supabase.from("chats").update({ pinned: !c.pinned }).eq("id", c.id);
    load();
  };

  const remove = async (c: Chat) => {
    if (!confirm(`Delete chat "${c.title}"? Assets in it will be kept.`)) return;
    await supabase.from("chats").delete().eq("id", c.id);
    if (activeChatId === c.id) nav("/create");
    load();
  };

  const startRename = (c: Chat) => { setRenamingId(c.id); setRenameValue(c.title); };
  const commitRename = async () => {
    if (!renamingId) return;
    const v = renameValue.trim();
    if (v) {
      const { error } = await supabase.from("chats").update({ title: v }).eq("id", renamingId);
      if (error) toast({ title: "Rename failed", variant: "destructive" });
    }
    setRenamingId(null);
    load();
  };

  if (collapsed) {
    return (
      <aside className="flex h-[calc(100vh-4rem)] w-12 flex-col items-center border-r border-neutral-200 bg-white py-3">
        <button onClick={onToggle} title="Expand chats" className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100">
          <PanelLeft className="h-4 w-4" />
        </button>
        <Link to="/create" title="New chat" className="mt-2 rounded-md p-2 text-neutral-500 hover:bg-neutral-100">
          <Plus className="h-4 w-4" />
        </Link>
        <div className="mt-auto">
          <CreditsPopover compact />
        </div>
      </aside>
    );
  }

  const pinned = chats.filter(c => c.pinned);
  const recent = chats.filter(c => !c.pinned);

  return (
    <aside className="flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Chats</span>
        <button onClick={onToggle} title="Collapse" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100">
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>
      <div className="px-3">
        <Link
          to="/create"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" /> New chat
        </Link>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto px-2 pb-4">
        {pinned.length > 0 && (
          <Section label="Pinned">
            {pinned.map(c => renderItem(c))}
          </Section>
        )}
        {recent.length > 0 && (
          <Section label="Recent">
            {recent.map(c => renderItem(c))}
          </Section>
        )}
        {chats.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-neutral-400">No chats yet</p>
        )}
      </div>
      <div className="border-t border-neutral-200 p-3">
        <CreditsPopover />
      </div>
    </aside>
  );

  function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="mb-3">
        <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</div>
        <div className="flex flex-col">{children}</div>
      </div>
    );
  }

  function renderItem(c: Chat) {
    const active = c.id === activeChatId;
    const isRenaming = renamingId === c.id;
    return (
      <div
        key={c.id}
        className={`group relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm ${active ? "bg-neutral-100 text-neutral-900" : "text-neutral-700 hover:bg-neutral-50"}`}
      >
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
            className="flex-1 rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:border-brand"
          />
        ) : (
          <Link to={`/create?chat=${c.id}`} className="flex-1 truncate">
            {c.title}
          </Link>
        )}
        {!isRenaming && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded p-1 text-neutral-400 opacity-0 transition group-hover:opacity-100 hover:bg-neutral-200 hover:text-neutral-700 data-[state=open]:opacity-100"
              aria-label="Chat actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-white p-1.5 shadow-lg">
              <DropdownMenuItem onClick={() => togglePin(c)} className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900">
                {c.pinned ? <><PinOff className="mr-2 h-3.5 w-3.5" /> Unpin</> : <><Pin className="mr-2 h-3.5 w-3.5" /> Pin</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startRename(c)} className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900">
                <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => remove(c)} className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }
};

export default ChatsSidebar;

function CreditsPopover({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("user_usage").select("*").eq("user_id", user.id).maybeSingle().then(({ data }: any) => {
      if (!data) return;
      setCredits((data.monthly_limit || 0) + (data.credits_extra || 0) - (data.credits_used || 0));
    });
  }, [user]);
  const packs = [
    { label: "500 credits", price: "$5" },
    { label: "1,500 credits", price: "$10" },
    { label: "5,000 credits", price: "$25" },
  ];
  const trigger = compact ? (
    <button title="Credits" className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100">
      <Sparkles className="h-4 w-4" />
    </button>
  ) : (
    <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50">
      <Sparkles className="h-4 w-4" /> Buy credits
    </button>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 rounded-xl border border-neutral-200 bg-white p-0 shadow-lg">
        <div className="border-b border-neutral-100 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-900">{(credits ?? 0).toLocaleString()} credits left</p>
          <p className="text-xs text-neutral-500">One-time top-up, never expires</p>
        </div>
        <div className="py-1">
          {packs.map(p => (
            <button key={p.label} className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-neutral-800 transition hover:bg-neutral-50">
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> {p.label}</span>
              <span className="text-neutral-500">{p.price}</span>
            </button>
          ))}
        </div>
        <Link to="/pricing" className="block border-t border-neutral-100 px-4 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-50">
          Or upgrade your plan →
        </Link>
      </PopoverContent>
    </Popover>
  );
}
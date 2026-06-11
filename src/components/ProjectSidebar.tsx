import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const supabase = _sb as any;

type Props = {
  onSelectRocket?: (id: string) => void;
  activeRocketId?: string | null;
};

export default function ProjectSidebar({ onSelectRocket, activeRocketId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [history, setHistory] = useState<any[]>([]);
  const [renaming, setRenaming] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<any | null>(null);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    extra: number;
  } | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("project_sidebar_open") !== "0";
  });

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem("project_sidebar_open", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!user?.id) return;
    loadHistory();
    supabase
      .from("user_usage")
      .select("monthly_limit, credits_used, credits_extra")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(
        ({ data }: any) =>
          data &&
          setUsage({
            used: data.credits_used,
            limit: data.monthly_limit,
            extra: data.credits_extra || 0,
          })
      );
    const onFocus = () => loadHistory();
    const onVisible = () => { if (document.visibilityState === "visible") loadHistory(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.id]);

  const loadHistory = () => {
    if (!user) return;
    supabase
      .from("rockets")
      .select("id, product_name, product_url, created_at, pinned")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }: any) => setHistory(data || []));
  };

  const togglePin = async (h: any) => {
    const next = !h.pinned;
    setHistory((prev) =>
      [...prev.map((x) => (x.id === h.id ? { ...x, pinned: next } : x))].sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          (a.created_at < b.created_at ? 1 : -1)
      )
    );
    const { error } = await supabase
      .from("rockets")
      .update({ pinned: next })
      .eq("id", h.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      loadHistory();
    }
  };

  const submitRename = async () => {
    if (!renaming) return;
    const name = renameValue.trim();
    if (!name) return;
    const id = renaming.id;
    setHistory((prev) => prev.map((x) => (x.id === id ? { ...x, product_name: name } : x)));
    setRenaming(null);
    const { error } = await supabase
      .from("rockets")
      .update({ product_name: name })
      .eq("id", id);
    if (error) {
      toast({ title: "Rename failed", description: error.message, variant: "destructive" });
      loadHistory();
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    setHistory((prev) => prev.filter((x) => x.id !== id));
    setDeleting(null);
    const { error } = await supabase.from("rockets").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      loadHistory();
    } else {
      toast({ title: "Deleted" });
    }
  };

  const buyPack = async (product: string) => {
    setBuying(product);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { product },
      });
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast({
        title: "Checkout failed",
        description: e.message,
        variant: "destructive",
      });
      setBuying(null);
    }
  };

  if (!open) {
    return (
      <button
        onClick={toggle}
        aria-label="Open sidebar"
        className="absolute left-3 top-3 z-20 hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-50"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-neutral-200 bg-white overflow-hidden shrink-0">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        {/* Backend table is `rockets`; user-facing label is "Assets". */}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Assets
        </span>
        <button
          onClick={toggle}
          aria-label="Collapse sidebar"
          className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-3 pb-3 border-b border-neutral-200">
        <Link
          to="/create"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" /> New Asset
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {history.length === 0 ? (
          <p className="px-2 py-3 text-xs text-neutral-400">
            No assets yet. Create your first asset.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {history.map((h) => {
              const isActive = onSelectRocket
                ? activeRocketId === h.id
                : location.pathname === `/rocket/${h.id}`;
              const label = h.product_name || h.product_url;
              return (
                <li key={h.id} className="group relative">
                  <div
                    className={`flex items-center gap-1 rounded-lg pr-1 transition ${
                      isActive ? "bg-neutral-100" : "hover:bg-neutral-100"
                    }`}
                  >
                    {onSelectRocket ? (
                      <button
                        type="button"
                        onClick={() => onSelectRocket(h.id)}
                        className={`flex-1 min-w-0 text-left truncate px-2 py-1.5 text-sm ${
                          isActive ? "text-neutral-900" : "text-neutral-700"
                        }`}
                      >
                        {h.pinned && (
                          <Pin className="inline h-3 w-3 mr-1 -mt-0.5 text-neutral-400" />
                        )}
                        {label}
                      </button>
                    ) : (
                      <Link
                        to={`/rocket/${h.id}`}
                        className={`flex-1 min-w-0 truncate px-2 py-1.5 text-sm ${
                          isActive ? "text-neutral-900" : "text-neutral-700"
                        }`}
                      >
                        {h.pinned && (
                          <Pin className="inline h-3 w-3 mr-1 -mt-0.5 text-neutral-400" />
                        )}
                        {label}
                      </Link>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Actions"
                          className="shrink-0 rounded p-1 text-neutral-400 opacity-0 transition group-hover:opacity-100 hover:bg-neutral-200 hover:text-neutral-700 data-[state=open]:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => togglePin(h)}>
                          {h.pinned ? (
                            <>
                              <PinOff className="mr-2 h-4 w-4" /> Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="mr-2 h-4 w-4" /> Pin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameValue(h.product_name || "");
                            setRenaming(h);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleting(h)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="p-3 border-t border-neutral-200">
        <Popover>
          <PopoverTrigger className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            <Sparkles className="h-4 w-4" /> Buy credits
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            className="w-[300px] rounded-2xl border border-neutral-200 bg-white p-0 shadow-xl"
          >
            <div className="px-4 pt-3 pb-3 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-900">
                {usage
                  ? (usage.limit + usage.extra - usage.used).toLocaleString()
                  : "—"}{" "}
                credits left
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                One-time top-up, never expires
              </p>
            </div>
            <div className="py-1">
              {[
                { id: "pack_500", label: "500 credits", price: "$5" },
                {
                  id: "pack_1500",
                  label: "1,500 credits",
                  price: "$10",
                  highlight: true,
                },
                { id: "pack_5000", label: "5,000 credits", price: "$25" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => buyPack(p.id)}
                  disabled={!!buying}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition ${
                    p.highlight
                      ? "bg-brand/10 text-brand hover:bg-brand/15"
                      : "text-neutral-800 hover:bg-neutral-50"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {buying === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap
                        className={`h-4 w-4 ${
                          p.highlight ? "text-brand" : "text-neutral-500"
                        }`}
                      />
                    )}
                    <span className="font-medium">{p.label}</span>
                  </span>
                  <span
                    className={p.highlight ? "text-brand" : "text-neutral-500"}
                  >
                    {p.price}
                  </span>
                </button>
              ))}
            </div>
            <Link
              to="/pricing"
              className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <span>Or upgrade your plan</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </PopoverContent>
        </Popover>
      </div>
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename asset</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
            }}
            autoFocus
            placeholder="Name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. "{deleting?.product_name || deleting?.product_url}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}

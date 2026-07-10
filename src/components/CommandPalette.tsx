import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles, LayoutGrid, FolderOpen, LineChart, Settings, CreditCard,
  LogOut, FileText, Palette, Bell,
} from "lucide-react";

const supabase = _sb as any;

type AssetRow = { id: string; title: string; asset_type: string | null };
type ProjectRow = { id: string; name: string };

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [searchAssets, setSearchAssets] = useState<AssetRow[]>([]);
  const [searchProjects, setSearchProjects] = useState<ProjectRow[]>([]);
  const [searching, setSearching] = useState(false);
  const nav = useNavigate();
  const { user, signOut } = useAuth();

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lazy-load user's assets + projects when palette opens
  useEffect(() => {
    if (!open || !user?.id) return;
    let cancel = false;
    (async () => {
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from("assets").select("id,title,asset_type").order("created_at", { ascending: false }).limit(50),
        supabase.from("projects").select("id,name").order("created_at", { ascending: false }).limit(20),
      ]);
      if (cancel) return;
      setAssets((a || []) as AssetRow[]);
      setProjects((p || []) as ProjectRow[]);
    })();
    return () => { cancel = true; };
  }, [open, user?.id]);

  // Debounced server-side search across ALL assets/projects for the user.
  useEffect(() => {
    if (!open || !user?.id) return;
    const q = query.trim();
    if (q.length < 2) { setSearchAssets([]); setSearchProjects([]); setSearching(false); return; }
    setSearching(true);
    const handle = setTimeout(async () => {
      const like = `%${q.replace(/[%_]/g, (m) => "\\" + m)}%`;
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from("assets").select("id,title,asset_type").ilike("title", like).order("created_at", { ascending: false }).limit(20),
        supabase.from("projects").select("id,name").ilike("name", like).order("created_at", { ascending: false }).limit(10),
      ]);
      setSearchAssets((a || []) as AssetRow[]);
      setSearchProjects((p || []) as ProjectRow[]);
      setSearching(false);
    }, 180);
    return () => clearTimeout(handle);
  }, [query, open, user?.id]);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    nav(path);
  };

  const searching_q = query.trim().length >= 2;
  const mergedProjects = searching_q ? searchProjects : projects;
  const mergedAssets = searching_q ? searchAssets : assets;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search assets, projects, or jump to…" />
      <CommandList>
        <CommandEmpty>{searching ? "Searching…" : "No matches."}</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/create")}><Sparkles /> Create new asset</CommandItem>
          <CommandItem onSelect={() => go("/projects/new")}><FolderOpen /> New project</CommandItem>
          <CommandItem onSelect={() => go("/assets")}><LayoutGrid /> Browse all assets</CommandItem>
          <CommandItem onSelect={() => go("/projects")}><FolderOpen /> Browse projects</CommandItem>
          <CommandItem onSelect={() => go("/insights")}><LineChart /> Insights</CommandItem>
          <CommandItem onSelect={() => go("/notifications")}><Bell /> Notifications</CommandItem>
        </CommandGroup>
        {mergedProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={searching_q ? "Matching projects" : "Projects"}>
              {mergedProjects.map((p) => (
                <CommandItem key={p.id} value={`project ${p.name}`} onSelect={() => go(`/projects/${p.id}`)}>
                  <Palette /> {p.name || "Untitled project"}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {mergedAssets.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={searching_q ? "Matching assets" : "Recent assets"}>
              {mergedAssets.map((a) => (
                <CommandItem key={a.id} value={`asset ${a.title} ${a.asset_type || ""}`} onSelect={() => go(`/assets/${a.id}`)}>
                  <FileText />
                  <span className="truncate">{a.title || "Untitled"}</span>
                  {a.asset_type && <span className="ml-auto text-xs text-neutral-400">{a.asset_type.replace(/_/g, " ")}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => go("/settings")}><Settings /> Settings</CommandItem>
          <CommandItem onSelect={() => go("/pricing")}><CreditCard /> Plans & billing</CommandItem>
          <CommandItem onSelect={async () => { setOpen(false); await signOut(); nav("/"); }}>
            <LogOut /> Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
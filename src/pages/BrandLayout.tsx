import { useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Outlet, useParams } from "react-router-dom";
import {
  Image as ImageIcon,
  BookOpen,
  Palette as PaletteIcon,
  Type,
  Download,
  Loader2,
  Pencil,
  Check as CheckIcon,
  X as XIcon,
} from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { loadBrandMeta } from "@/lib/brandMeta";

const supabase = _sb as any;

const isMissingColumnError = (error: any, column: string) => {
  const message = String(error?.message || error?.details || "").toLowerCase();
  return message.includes(column.toLowerCase()) && (
    message.includes("column") || message.includes("schema cache") || message.includes("could not find")
  );
};

type NavKey = "logo-files" | "palette" | "fonts" | "brand-book";

export default function BrandLayout() {
  const { id: projectId } = useParams();
  const { toast } = useToast();
  if (!projectId) return <Navigate to="/brands" replace />;

  const [project, setProject] = useState<any>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("projects").select("id,name,user_id").eq("id", projectId).maybeSingle();
      if (!cancelled) setProject(data || null);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const startRename = () => { setNameDraft(project?.name || ""); setRenaming(true); };
  const cancelRename = () => { setRenaming(false); setNameDraft(""); };
  const commitRename = async () => {
    const name = nameDraft.trim();
    if (!name || name === project?.name) { cancelRename(); return; }
    setSavingName(true);
    const { error } = await supabase.from("projects").update({ name }).eq("id", projectId);
    setSavingName(false);
    if (error) return toast({ title: "Rename failed", description: error.message, variant: "destructive" });
    setProject((p: any) => ({ ...(p || {}), name }));
    setRenaming(false);
  };

  const downloadBrandKit = async () => {
    setZipping(true);
    try {
      let res = await supabase
        .from("assets")
        .select("id,title,asset_type,image_url,thumbnail_url,content,created_at")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (res.error && isMissingColumnError(res.error, "deleted_at")) {
        res = await supabase
          .from("assets")
          .select("id,title,asset_type,image_url,thumbnail_url,content,created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(200);
      }
      const assets = (res.data || []) as any[];
      const zip = new JSZip();
      const brandName = String(project?.name || "brand-kit");
      const safeName = brandName.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "brand-kit";
      const safeFile = (s: string) =>
        s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "file";

      // --- Logo files ---
      const logos = assets.filter((a) => ["logo", "logotype", "wordmark", "icon"].includes(a.asset_type));
      const logoFolder = zip.folder("logo-files")!;
      let logoCount = 0;
      for (const a of logos) {
        const url = a.image_url || a.thumbnail_url;
        if (!url) continue;
        try {
          const r = await fetch(url, { mode: "cors" });
          if (!r.ok) continue;
          const bytes = await r.arrayBuffer();
          const ct = r.headers.get("content-type") || "";
          const ext = ct.includes("svg") ? "svg" : ct.includes("jpeg") ? "jpg" : ct.includes("webp") ? "webp" : "png";
          logoFolder.file(`${safeFile(a.title || "logo")}.${ext}`, bytes);
          logoCount += 1;
        } catch {}
      }

      // --- Other assets ---
      const others = assets.filter((a) => !["logo", "logotype", "wordmark", "icon"].includes(a.asset_type));
      let otherCount = 0;
      if (others.length) {
        const folder = zip.folder("assets")!;
        for (const a of others) {
          const url = a.image_url || a.thumbnail_url;
          if (url) {
            try {
              const r = await fetch(url, { mode: "cors" });
              if (!r.ok) continue;
              const bytes = await r.arrayBuffer();
              const ct = r.headers.get("content-type") || "";
              const ext = ct.includes("svg") ? "svg" : ct.includes("jpeg") ? "jpg" : ct.includes("webp") ? "webp" : "png";
              folder.file(`${safeFile(a.title || "asset")}.${ext}`, bytes);
              otherCount += 1;
            } catch {}
          } else if (a.content) {
            folder.file(`${safeFile(a.title || "asset")}.txt`, `${a.title || ""}\n\n${a.content}\n`);
            otherCount += 1;
          }
        }
      }

      // --- Palette ---
      const meta = loadBrandMeta(projectId);
      const palette = meta.palette && meta.palette.length ? meta.palette : (meta.brand_color ? [meta.brand_color] : []);
      const paletteName = meta.palette_key || "brand";
      const paletteLines = [
        `${brandName} · Palette`,
        paletteName ? `Name: ${paletteName}` : "",
        "",
        ...palette.map((c, i) => `${i + 1}. ${c}`),
      ].filter(Boolean).join("\n");
      zip.folder("palette")!.file(
        "palette.txt",
        palette.length ? `${paletteLines}\n` : `${brandName} · Palette\n\nNo palette selected yet. Open the brand kit and choose a palette in Palette Explorer.\n`,
      );

      // --- Fonts ---
      const font = meta.font || "";
      zip.folder("fonts")!.file(
        "fonts.txt",
        font
          ? `${brandName} · Fonts\n\nPrimary: ${font}\nSource: Google Fonts (https://fonts.google.com/specimen/${encodeURIComponent(font.replace(/\s+/g, "+"))})\n`
          : `${brandName} · Fonts\n\nNo font selected yet. Open the brand kit and choose a font in Font Explorer.\n`,
      );

      // --- Brand Book ---
      const brandBook = [
        `# ${brandName} — Brand Book`,
        "",
        `Generated by Rocket on ${new Date().toLocaleDateString()}.`,
        "",
        "## Logo",
        logoCount ? `${logoCount} logo file(s) included in /logo-files.` : "No logo files saved yet.",
        "",
        "## Palette",
        palette.length ? palette.map((c) => `- ${c}`).join("\n") : "No palette selected yet.",
        "",
        "## Typography",
        font ? `- ${font}` : "No font selected yet.",
        "",
        "## Usage",
        "- Maintain clear space around the logo equal to the height of its shortest letter.",
        "- Do not stretch, recolor, or rotate the logo.",
        "- Use the inverse variant on dark or photographic backgrounds.",
      ].join("\n");
      zip.folder("brand-book")!.file("brand-book.md", `${brandBook}\n`);

      // --- README ---
      zip.file(
        "README.txt",
        [
          `${brandName} — Brand Kit`,
          `Generated ${new Date().toISOString()}`,
          "",
          "Contents:",
          `  /logo-files    ${logoCount} file(s)`,
          `  /palette       palette.txt`,
          `  /fonts         fonts.txt`,
          `  /brand-book    brand-book.md`,
          otherCount ? `  /assets        ${otherCount} file(s)` : "",
        ].filter(Boolean).join("\n") + "\n",
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${safeName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      const total = logoCount + otherCount + 3; // + palette, fonts, brand book
      toast({ title: "Brand kit downloaded", description: `${total} files packed.` });
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setZipping(false);
    }
  };

  const nav: { key: NavKey; label: string; icon: React.ComponentType<{ className?: string }>; to: string; end?: boolean }[] = useMemo(() => ([
    { key: "logo-files", label: "Logo Files", icon: ImageIcon, to: `/brands/${projectId}`, end: true },
    { key: "palette", label: "Palette", icon: PaletteIcon, to: `/brands/${projectId}/palette` },
    { key: "fonts", label: "Fonts", icon: Type, to: `/brands/${projectId}/fonts` },
    { key: "brand-book", label: "Brand Book", icon: BookOpen, to: `/brands/${projectId}/brand-book` },
  ]), [projectId]);

  return (
    <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden bg-neutral-50 font-body">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="min-w-0 flex-1">
            {renaming ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
                  className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-brand"
                />
                <button onClick={commitRename} disabled={savingName} className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"><CheckIcon className="h-3.5 w-3.5" /></button>
                <button onClick={cancelRename} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100"><XIcon className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <button onClick={startRename} className="group flex w-full items-center gap-1 truncate text-left text-base font-semibold text-neutral-900" title="Rename brand">
                <span className="truncate">{project?.name || "Untitled brand"}</span>
                <Pencil className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-70" />
              </button>
            )}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-neutral-100 font-medium text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 p-3">
          <button
            onClick={downloadBrandKit}
            disabled={zipping}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download brand kit
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet context={{ project, projectId, downloadBrandKit, zipping }} />
      </main>
    </div>
  );
}
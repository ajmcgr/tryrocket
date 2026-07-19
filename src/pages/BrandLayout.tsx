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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";

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
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("projects").select("id,name,user_id").eq("id", projectId).maybeSingle();
      if (!cancelled) setProject(data || null);
      const logoRes = await supabase
        .from("assets")
        .select("image_url,thumbnail_url,asset_type,created_at")
        .eq("project_id", projectId)
        .in("asset_type", ["logo", "logotype", "wordmark", "icon"])
        .order("created_at", { ascending: false })
        .limit(1);
      const url = logoRes.data?.[0]?.image_url || logoRes.data?.[0]?.thumbnail_url || null;
      if (!cancelled) setPrimaryLogoUrl(url);
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

  const safeBrandFile = () => {
    const brandName = String(project?.name || "brand-kit");
    return brandName.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "brand-kit";
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const downloadLogoVariant = async (variant: "regular" | "inverse" | "black") => {
    if (!primaryLogoUrl) {
      toast({ title: "No logo yet", description: "Save a logo to this brand kit first.", variant: "destructive" });
      return;
    }
    try {
      const img = await loadImage(primaryLogoUrl);
      const w = img.naturalWidth || 1024;
      const h = img.naturalHeight || 1024;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      if (variant !== "regular") {
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = variant === "inverse" ? "#ffffff" : "#000000";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/png"),
      );
      triggerDownload(blob, `${safeBrandFile()}-logo-${variant}.png`);
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const buildBrandBookCanvas = async () => {
    const brandName = String(project?.name || "Brand");
    const meta = loadBrandMeta(projectId);
    const palette = meta.palette && meta.palette.length ? meta.palette : (meta.brand_color ? [meta.brand_color] : []);
    const font = meta.font || "";
    const W = 1240; // ~ A4 @ 150dpi
    const H = 1754;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "600 56px Inter, system-ui, sans-serif";
    ctx.fillText(`${brandName}`, 80, 140);
    ctx.fillStyle = "#6b7280";
    ctx.font = "400 22px Inter, system-ui, sans-serif";
    ctx.fillText("Brand Book", 80, 180);
    ctx.fillText(`Generated by Rocket on ${new Date().toLocaleDateString()}`, 80, 214);

    let y = 300;
    // Logo preview
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "600 28px Inter, system-ui, sans-serif";
    ctx.fillText("Logo", 80, y);
    y += 24;
    if (primaryLogoUrl) {
      try {
        const img = await loadImage(primaryLogoUrl);
        const boxW = 480, boxH = 260;
        ctx.strokeStyle = "#e5e7eb";
        ctx.strokeRect(80, y, boxW, boxH);
        const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight) * 0.8;
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, 80 + (boxW - dw) / 2, y + (boxH - dh) / 2, dw, dh);
        y += boxH + 40;
      } catch { y += 40; }
    } else {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "400 18px Inter, system-ui, sans-serif";
      ctx.fillText("No logo saved yet.", 80, y + 28);
      y += 80;
    }

    // Palette
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "600 28px Inter, system-ui, sans-serif";
    ctx.fillText("Palette", 80, y);
    y += 24;
    if (palette.length) {
      const sw = 140, sh = 140, gap = 20;
      palette.slice(0, 6).forEach((c, i) => {
        const x = 80 + i * (sw + gap);
        ctx.fillStyle = c;
        ctx.fillRect(x, y, sw, sh);
        ctx.strokeStyle = "#e5e7eb";
        ctx.strokeRect(x, y, sw, sh);
        ctx.fillStyle = "#374151";
        ctx.font = "500 18px Inter, system-ui, sans-serif";
        ctx.fillText(c.toUpperCase(), x, y + sh + 24);
      });
      y += sh + 70;
    } else {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "400 18px Inter, system-ui, sans-serif";
      ctx.fillText("No palette selected yet.", 80, y + 28);
      y += 80;
    }

    // Typography
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "600 28px Inter, system-ui, sans-serif";
    ctx.fillText("Typography", 80, y);
    y += 40;
    ctx.fillStyle = "#0a0a0a";
    if (font) {
      ctx.font = `600 64px "${font}", Inter, system-ui, sans-serif`;
      ctx.fillText(font, 80, y + 40);
      ctx.font = `400 22px "${font}", Inter, system-ui, sans-serif`;
      ctx.fillStyle = "#6b7280";
      ctx.fillText("The quick brown fox jumps over the lazy dog.", 80, y + 80);
      y += 120;
    } else {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "400 18px Inter, system-ui, sans-serif";
      ctx.fillText("No font selected yet.", 80, y);
      y += 60;
    }

    // Usage
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "600 28px Inter, system-ui, sans-serif";
    ctx.fillText("Usage", 80, y);
    y += 34;
    ctx.fillStyle = "#374151";
    ctx.font = "400 20px Inter, system-ui, sans-serif";
    const rules = [
      "• Maintain clear space around the logo equal to the height of its shortest letter.",
      "• Do not stretch, recolor, or rotate the logo.",
      "• Use the inverse variant on dark or photographic backgrounds.",
    ];
    rules.forEach((r, i) => ctx.fillText(r, 80, y + i * 32));

    return canvas;
  };

  const downloadBrandBook = async (fmt: "pdf" | "png") => {
    try {
      const canvas = await buildBrandBookCanvas();
      if (fmt === "png") {
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b as Blob), "image/png"),
        );
        triggerDownload(blob, `${safeBrandFile()}-brand-book.png`);
      } else {
        const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
        pdf.save(`${safeBrandFile()}-brand-book.pdf`);
      }
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || String(e), variant: "destructive" });
    }
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={zipping}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download brand kit
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white">
              <DropdownMenuLabel>Logo</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => downloadLogoVariant("regular")}>
                Regular
                <span className="ml-auto text-xs text-neutral-500">Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadLogoVariant("inverse")}>
                Inverse
                <span className="ml-auto text-xs text-neutral-500">Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadLogoVariant("black")}>
                Black
                <span className="ml-auto text-xs text-neutral-500">Download</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Brand Book</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => downloadBrandBook("pdf")}>
                PDF
                <span className="ml-auto text-xs text-neutral-500">Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadBrandBook("png")}>
                PNG
                <span className="ml-auto text-xs text-neutral-500">Download</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={downloadBrandKit}>
                Full brand kit
                <span className="ml-auto text-xs text-neutral-500">.zip</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet context={{ project, projectId, downloadBrandKit, zipping }} />
      </main>
    </div>
  );
}
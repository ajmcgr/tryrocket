import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Logotype } from "@/components/Logotype";
import { Heart, Wand2 } from "lucide-react";
const supabase = _sb as any;

type GalleryEntry = { project: any; assets: any[] };

const Gallery = () => {
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("rocket:gallery:likes") || "{}"); } catch { return {}; }
  });

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikes((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      localStorage.setItem("rocket:gallery:likes", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    (async () => {
      // Requires column projects.is_public_gallery boolean default false + RLS policy allowing anon SELECT.
      // If the column doesn't exist yet, we get an error and just render an empty state.
      const { data: projects, error } = await supabase
        .from("projects")
        .select("id, name, description, brand_context, share_token, updated_at")
        .eq("is_public_gallery", true)
        .not("share_token", "is", null)
        .order("updated_at", { ascending: false })
        .limit(60);
      if (error || !projects?.length) { setLoading(false); return; }
      const ids = projects.map((p: any) => p.id);
      const { data: assets } = await supabase
        .from("assets")
        .select("id, project_id, title, asset_type, image_url, editor_state, content")
        .in("project_id", ids)
        .order("created_at", { ascending: false });
      const byProject: Record<string, any[]> = {};
      (assets || []).forEach((a: any) => {
        (byProject[a.project_id] ||= []).push(a);
      });
      setEntries(projects.map((p: any) => ({ project: p, assets: (byProject[p.id] || []).slice(0, 4) })));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <Link to="/" className="text-sm font-semibold tracking-tight">Rocket</Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-xs uppercase tracking-wider text-brand">Public gallery</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Brand kits built with Rocket</h1>
        <p className="mt-2 text-sm text-neutral-600">A curated stream of founder-made brand kits. Turn yours on from any project's share menu.</p>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500">
            The gallery is empty. Be the first — enable "Show in public gallery" on one of your shared projects.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {entries.map(({ project, assets }) => (
              <Link
                key={project.id}
                to={`/share/project/${project.share_token}`}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-brand"
              >
                <div className="grid grid-cols-2 gap-1 bg-neutral-50 p-1">
                  {assets.length === 0 && <div className="col-span-2 aspect-[2/1]" />}
                  {assets.map((a) => (
                    <div key={a.id} className="aspect-square overflow-hidden rounded-md bg-white">
                      {a?.editor_state?.kind === "logotype" ? (
                        <Logotype state={a.editor_state} fit="contain" />
                      ) : a.image_url ? (
                        <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-3 text-[10px] text-neutral-500">
                          <div className="line-clamp-6 whitespace-pre-wrap text-center">{(a.content || a.title || "").slice(0, 120)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-start justify-between gap-3 border-t border-neutral-100 p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-neutral-900 group-hover:text-brand">{project.name}</div>
                    {(project.description || project.brand_context?.tagline) && (
                      <div className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{project.description || project.brand_context?.tagline}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={(e) => toggleLike(project.id, e)}
                      title={likes[project.id] ? "Unlike" : "Like"}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${likes[project.id] ? "border-brand bg-brand/10 text-brand" : "border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}
                    >
                      <Heart className="h-3.5 w-3.5" fill={likes[project.id] ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const prompt = `Create a brand kit inspired by "${project.name}"${project.brand_context?.tagline ? ` — ${project.brand_context.tagline}` : ""}`;
                        window.location.href = `/create?prompt=${encodeURIComponent(prompt)}`;
                      }}
                      title="Remix this"
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-neutral-200 px-2.5 text-xs font-medium text-neutral-700 hover:border-brand hover:text-brand"
                    >
                      <Wand2 className="h-3 w-3" /> Remix
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Gallery;
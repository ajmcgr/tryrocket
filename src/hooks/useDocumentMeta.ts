import { useEffect } from "react";

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => { if (k !== "content") el!.setAttribute(k, v); });
    document.head.appendChild(el);
  }
  if (attrs.content) el.setAttribute("content", attrs.content);
}

export function useDocumentMeta(opts: { title?: string; description?: string; image?: string | null }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (opts.title) document.title = opts.title;
    if (opts.description) {
      upsertMeta('meta[name="description"]', { name: "description", content: opts.description });
      upsertMeta('meta[property="og:description"]', { property: "og:description", content: opts.description });
      upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: opts.description });
    }
    if (opts.title) {
      upsertMeta('meta[property="og:title"]', { property: "og:title", content: opts.title });
      upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: opts.title });
    }
    if (opts.image) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: opts.image });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: opts.image });
      upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    }
    return () => { document.title = prevTitle; };
  }, [opts.title, opts.description, opts.image]);
}
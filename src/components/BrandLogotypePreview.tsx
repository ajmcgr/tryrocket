import { useEffect, useState } from "react";
import { brandLogotypeToPng, logotypeLabel } from "@/lib/brandLogoAsset";

export default function BrandLogotypePreview({
  asset,
  color,
  fallback = "Brand",
  className = "max-h-full max-w-full object-contain",
}: {
  asset: any;
  color: string;
  fallback?: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    void (async () => {
      try {
        const dataUrl = await brandLogotypeToPng(asset, color, fallback, 3);
        if (!cancelled) setSrc(dataUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();
    return () => { cancelled = true; };
  }, [asset, color, fallback]);

  if (!src) {
    return <div className="text-sm font-medium text-neutral-400">{logotypeLabel(asset, fallback)}</div>;
  }

  return <img src={src} alt={logotypeLabel(asset, fallback)} className={className} />;
}
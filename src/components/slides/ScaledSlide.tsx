import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Renders children at a fixed 1920x1080 canvas, scaled to fit the parent.
 * Parent must have position:relative and overflow:hidden with a defined size.
 */
export default function ScaledSlide({
  children,
  className = "",
  padding = 0,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current?.parentElement;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth - padding * 2;
      const h = el.clientHeight - padding * 2;
      const s = Math.min(w / 1920, h / 1080);
      setScale(s > 0 ? s : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [padding]);

  return (
    <div
      ref={wrapRef}
      className={`slide-content ${className}`}
      style={{
        position: "absolute",
        width: 1920,
        height: 1080,
        left: "50%",
        top: "50%",
        marginLeft: -960,
        marginTop: -540,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
}

export function SlideStage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Container with 16:9 aspect ratio that hosts a ScaledSlide.
  const ref = useRef<HTMLDivElement | null>(null);
  const [, force] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => force((n) => n + 1));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: "16 / 9" }}>
      {children}
    </div>
  );
}
export type CanvasBase = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  visible: boolean;
  locked: boolean;
};

export type CanvasTextEl = CanvasBase & {
  kind: "text";
  text: string;
  color: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  align?: "left" | "center" | "right";
};

export type CanvasRectEl = CanvasBase & {
  kind: "rect";
  fill: string;
  radius: number;
};

export type CanvasCircEl = CanvasBase & {
  kind: "circle";
  fill: string;
};

export type CanvasImgEl = CanvasBase & {
  kind: "image";
  src: string;
  color?: string;
};

export type CanvasLineEl = CanvasBase & {
  kind: "line";
  color: string;
  thickness: number;
};

export type CanvasStickyEl = CanvasBase & {
  kind: "sticky";
  text: string;
  fill: string;
  color: string;
};

export type CanvasTriEl = CanvasBase & {
  kind: "triangle";
  fill: string;
};

export type CanvasStarEl = CanvasBase & {
  kind: "star";
  fill: string;
};

export type CanvasTableEl = CanvasBase & {
  kind: "table";
  rows: number;
  cols: number;
  color: string;
  lineColor: string;
};

export type CanvasElement =
  | CanvasTextEl
  | CanvasRectEl
  | CanvasCircEl
  | CanvasImgEl
  | CanvasLineEl
  | CanvasStickyEl
  | CanvasTriEl
  | CanvasStarEl
  | CanvasTableEl;

export function isCanvasAsset(asset: unknown): asset is { editor_state: CanvasElement[] } {
  return !!asset && typeof asset === "object" && Array.isArray((asset as { editor_state?: unknown }).editor_state);
}

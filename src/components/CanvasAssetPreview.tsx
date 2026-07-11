import { Layer, Stage, Rect, Circle as KCircle, Text as KText, Image as KImage, Line as KLine, RegularPolygon, Star as KStar } from "react-konva";
import useImage from "use-image";
import { type CanvasElement } from "@/lib/canvasAsset";

const STAGE_W = 800;
const STAGE_H = 600;

function CanvasImageNode({ el }: { el: Extract<CanvasElement, { kind: "image" }> }) {
  const [img] = useImage(el.src, "anonymous");
  if (!img) return null;
  return <KImage image={img} x={el.x} y={el.y} width={el.w} height={el.h} rotation={el.rotation || 0} />;
}

function RenderEl({ el }: { el: CanvasElement }) {
  if (!el.visible) return null;
  switch (el.kind) {
    case "text":
      return (
        <KText
          x={el.x}
          y={el.y}
          width={el.w}
          height={el.h}
          rotation={el.rotation || 0}
          text={el.text}
          fill={el.color}
          fontSize={el.fontSize}
          fontStyle={el.fontWeight >= 700 ? "bold" : "normal"}
          fontFamily={el.fontFamily}
          align={el.align || "left"}
          verticalAlign="middle"
        />
      );
    case "rect":
      return <Rect x={el.x} y={el.y} width={el.w} height={el.h} rotation={el.rotation || 0} fill={el.fill} cornerRadius={el.radius} />;
    case "circle":
      return <KCircle x={el.x + el.w / 2} y={el.y + el.h / 2} radius={Math.min(el.w, el.h) / 2} fill={el.fill} rotation={el.rotation || 0} />;
    case "image":
      return <CanvasImageNode el={el} />;
    case "line":
      return <KLine points={[el.x, el.y, el.x + el.w, el.y + el.h]} stroke={el.color} strokeWidth={el.thickness} />;
    case "sticky":
      return (
        <>
          <Rect x={el.x} y={el.y} width={el.w} height={el.h} fill={el.fill} cornerRadius={12} shadowBlur={8} shadowOpacity={0.12} />
          <KText x={el.x + 12} y={el.y + 12} width={el.w - 24} height={el.h - 24} text={el.text} fill={el.color} fontSize={18} fontFamily="Inter" />
        </>
      );
    case "triangle":
      return <RegularPolygon x={el.x + el.w / 2} y={el.y + el.h / 2} sides={3} radius={Math.min(el.w, el.h) / 2} fill={el.fill} rotation={(el.rotation || 0) - 90} />;
    case "star":
      return <KStar x={el.x + el.w / 2} y={el.y + el.h / 2} numPoints={5} innerRadius={Math.min(el.w, el.h) * 0.2} outerRadius={Math.min(el.w, el.h) / 2} fill={el.fill} rotation={(el.rotation || 0) - 90} />;
    case "table": {
      const rowH = el.h / Math.max(1, el.rows);
      const colW = el.w / Math.max(1, el.cols);
      return (
        <>
          <Rect x={el.x} y={el.y} width={el.w} height={el.h} fill={el.color} />
          {Array.from({ length: el.rows + 1 }).map((_, row) => (
            <KLine key={`r-${row}`} points={[el.x, el.y + row * rowH, el.x + el.w, el.y + row * rowH]} stroke={el.lineColor} strokeWidth={1} />
          ))}
          {Array.from({ length: el.cols + 1 }).map((_, col) => (
            <KLine key={`c-${col}`} points={[el.x + col * colW, el.y, el.x + col * colW, el.y + el.h]} stroke={el.lineColor} strokeWidth={1} />
          ))}
        </>
      );
    }
    default:
      return null;
  }
}

export default function CanvasAssetPreview({
  elements,
  className,
  background = "#ffffff",
}: {
  elements: CanvasElement[];
  className?: string;
  background?: string;
}) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: "100%", aspectRatio: `${STAGE_W} / ${STAGE_H}` }}>
        <Stage width={STAGE_W} height={STAGE_H} scaleX={1} scaleY={1} style={{ width: "100%", height: "100%" }}>
          <Layer>
            <Rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill={background} />
            {elements.map((el) => <RenderEl key={el.id} el={el} />)}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

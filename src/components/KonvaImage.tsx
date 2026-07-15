import { forwardRef } from "react";
import { Image as KImage, Shape } from "react-konva";
import useImage from "use-image";

type ImageEl = {
  kind: "image";
  src: string;
  color?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
};

const KonvaImage = forwardRef<any, { el: ImageEl; [k: string]: any }>(
  ({ el, ...rest }, ref) => {
    const [img] = useImage(el.src, "anonymous");
    if (el.color) {
      return (
        <Shape
          ref={ref}
          x={el.x}
          y={el.y}
          width={el.w}
          height={el.h}
          rotation={el.rotation || 0}
          {...rest}
          sceneFunc={(context: any, shape: any) => {
            if (!img) {
              context.beginPath();
              context.rect(0, 0, el.w, el.h);
              context.closePath();
              context.fillStrokeShape(shape);
              return;
            }
            const ctx = context._context as CanvasRenderingContext2D;
            ctx.drawImage(img, 0, 0, el.w, el.h);
            ctx.save();
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = el.color as string;
            ctx.fillRect(0, 0, el.w, el.h);
            ctx.restore();
            context.beginPath();
            context.rect(0, 0, el.w, el.h);
            context.closePath();
            context.fillStrokeShape(shape);
          }}
        />
      );
    }
    return (
      <KImage
        ref={ref as any}
        image={img as any}
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rotation={el.rotation || 0}
        {...rest}
      />
    );
  }
);

KonvaImage.displayName = "KonvaImage";

export default KonvaImage;

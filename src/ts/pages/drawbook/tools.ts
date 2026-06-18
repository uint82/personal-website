import type { DrawingConfig } from "./types";

export class ToolEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: DrawingConfig;

  private lastBrushX = 0;
  private lastBrushY = 0;

  private shapeStartX = 0;
  private shapeStartY = 0;
  private shapeLastX = 0;
  private shapeLastY = 0;
  private shapePreviewSnapshot: ImageData | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    config: DrawingConfig,
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.config = config;
  }

  startBrushStroke(x: number, y: number): void {
    this.lastBrushX = x;
    this.lastBrushY = y;
    this.drawPixelSegment(x, y, x, y);
  }

  continueBrushStroke(x: number, y: number): void {
    this.drawPixelSegment(this.lastBrushX, this.lastBrushY, x, y);
    this.lastBrushX = x;
    this.lastBrushY = y;
  }

  spray(x: number, y: number): void {
    const radius = Math.max(10, this.config.brushWidth * 3);
    const density = Math.round(Math.max(15, this.config.brushWidth * 2.5));

    this.ctx.globalAlpha = this.config.opacity * 0.6;
    this.ctx.globalCompositeOperation = this.config.blendMode;
    this.ctx.fillStyle = this.config.currentColor;

    this.sprayDots(x, y, radius, density);

    if (this.config.symmetry !== "none") {
      this.mirroredPoints(x, y).forEach(([mx, my]) => {
        this.sprayDots(mx, my, radius, density);
      });
    }

    this.resetCtx();
  }

  floodFill(startX: number, startY: number): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imageData = this.ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    const sx = Math.floor(startX);
    const sy = Math.floor(startY);
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

    const si = (sy * w + sx) * 4;
    const tR = data[si], tG = data[si + 1], tB = data[si + 2], tA = data[si + 3];

    const tmp = document.createElement("canvas");
    tmp.width = tmp.height = 1;
    const tc = tmp.getContext("2d")!;
    tc.fillStyle = this.config.currentColor;
    tc.fillRect(0, 0, 1, 1);
    const fp = tc.getImageData(0, 0, 1, 1).data;
    const fR = fp[0], fG = fp[1], fB = fp[2];
    const alpha = this.config.opacity;
    const invAlpha = 1 - alpha;

    const TOL = 110;
    const same = (i: number) =>
      Math.abs(data[i] - tR) <= TOL &&
      Math.abs(data[i + 1] - tG) <= TOL &&
      Math.abs(data[i + 2] - tB) <= TOL &&
      Math.abs(data[i + 3] - tA) <= TOL;

    if (same(si) && data[si] === fR && data[si + 1] === fG && data[si + 2] === fB) return;

    const visited = new Uint8Array(w * h);
    const stack: number[] = [sy * w + sx];

    while (stack.length > 0) {
      const pos = stack.pop()!;
      if (visited[pos]) continue;
      visited[pos] = 1;

      const pi = pos * 4;
      if (!same(pi)) continue;

      data[pi] = Math.round(fR * alpha + data[pi] * invAlpha);
      data[pi + 1] = Math.round(fG * alpha + data[pi + 1] * invAlpha);
      data[pi + 2] = Math.round(fB * alpha + data[pi + 2] * invAlpha);
      data[pi + 3] = 255;

      const px = pos % w;
      const py = (pos / w) | 0;

      if (px > 0) stack.push(pos - 1);
      if (px < w - 1) stack.push(pos + 1);
      if (py > 0) stack.push(pos - w);
      if (py < h - 1) stack.push(pos + w);
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  startShape(x: number, y: number, snapshot: ImageData): void {
    this.shapeStartX = x;
    this.shapeStartY = y;
    this.shapeLastX = x;
    this.shapeLastY = y;
    this.shapePreviewSnapshot = snapshot;
  }

  previewShape(endX: number, endY: number): void {
    if (!this.shapePreviewSnapshot) return;
    this.ctx.putImageData(this.shapePreviewSnapshot, 0, 0);
    this.renderShape(this.shapeStartX, this.shapeStartY, endX, endY);
    this.shapeLastX = endX;
    this.shapeLastY = endY;
  }

  commitShape(): void {
    if (!this.shapePreviewSnapshot) return;
    this.ctx.putImageData(this.shapePreviewSnapshot, 0, 0);
    this.renderShape(this.shapeStartX, this.shapeStartY, this.shapeLastX, this.shapeLastY);
    this.shapePreviewSnapshot = null;
  }

  private stampPixel(x: number, y: number, size: number, half: number): void {
    this.ctx.fillRect(Math.floor(x) - half, Math.floor(y) - half, size, size);
  }

  private drawPixelSegment(x1: number, y1: number, x2: number, y2: number): void {
    const isEraser = this.config.activeTool === "eraser";
    const size = Math.max(1, Math.round(this.config.brushWidth));
    const half = Math.floor(size / 2);

    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = isEraser ? "source-over" : this.config.blendMode;
    this.ctx.fillStyle = isEraser
      ? "#ffffff"
      : this.bakedColor(this.config.currentColor, this.config.opacity);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) {
      this.stampPixel(x1, y1, size, half);
      if (this.config.symmetry !== "none") {
        this.mirroredPoints(x1, y1).forEach(([mx, my]) => this.stampPixel(mx, my, size, half));
      }
    } else {
      const step = 0.5;
      const steps = Math.ceil(dist / step);
      const nx = dx / dist;
      const ny = dy / dist;

      for (let i = 0; i <= steps; i++) {
        const t = i * step;
        const cx = x1 + nx * t;
        const cy = y1 + ny * t;
        this.stampPixel(cx, cy, size, half);
        if (this.config.symmetry !== "none") {
          this.mirroredPoints(cx, cy).forEach(([mx, my]) => this.stampPixel(mx, my, size, half));
        }
      }
    }

    this.resetCtx();
  }

  private renderShape(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = this.config.blendMode;
    this.ctx.fillStyle = this.bakedColor(this.config.currentColor, this.config.opacity);

    this.drawPixelShapeGeometry(x1, y1, x2, y2);

    if (this.config.symmetry !== "none") {
      this.mirroredPairs(x1, y1, x2, y2).forEach(([mx1, my1, mx2, my2]) => {
        this.drawPixelShapeGeometry(mx1, my1, mx2, my2);
      });
    }

    this.resetCtx();
  }

  private drawPixelShapeGeometry(x1: number, y1: number, x2: number, y2: number): void {
    switch (this.config.activeShape) {
      case "line":
        this.pixelLine(Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2));
        break;

      case "rect":
        this.pixelRect(Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2));
        break;

      case "circle":
        this.pixelEllipse(
          Math.round(x1), Math.round(y1),
          Math.round(x2), Math.round(y2),
        );
        break;

      case "triangle": {
        const mx = Math.round((x1 + x2) / 2);
        const iy1 = Math.round(y1);
        const iy2 = Math.round(y2);
        const ix1 = Math.round(x1);
        const ix2 = Math.round(x2);
        this.pixelLine(mx, iy1, ix2, iy2);
        this.pixelLine(ix2, iy2, ix1, iy2);
        this.pixelLine(ix1, iy2, mx, iy1);
        break;
      }
    }
  }

  private pixelLine(x0: number, y0: number, x1: number, y1: number): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    const size = Math.max(1, Math.round(this.config.brushWidth));
    const half = Math.floor(size / 2);

    while (true) {
      this.ctx.fillRect(x0 - half, y0 - half, size, size);

      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  private pixelRect(x1: number, y1: number, x2: number, y2: number): void {
    const [lx, rx] = x1 < x2 ? [x1, x2] : [x2, x1];
    const [ty, by] = y1 < y2 ? [y1, y2] : [y2, y1];

    this.pixelLine(lx, ty, rx, ty); // top
    this.pixelLine(rx, ty, rx, by); // right
    this.pixelLine(rx, by, lx, by); // bottom
    this.pixelLine(lx, by, lx, ty); // left
  }

  private pixelEllipse(x1: number, y1: number, x2: number, y2: number): void {
    const cx = (x1 + x2) >> 1;
    const cy = (y1 + y2) >> 1;
    const rx = Math.abs(x2 - x1) >> 1;
    const ry = Math.abs(y2 - y1) >> 1;

    if (rx === 0 || ry === 0) {
      this.pixelLine(x1, y1, x2, y2);
      return;
    }

    const size = Math.max(1, Math.round(this.config.brushWidth));
    const half = Math.floor(size / 2);

    const plot = (x: number, y: number) => {
      this.ctx.fillRect(x - half, y - half, size, size);
    };

    const plotPoints = (px: number, py: number) => {
      plot(cx + px, cy + py);
      plot(cx - px, cy + py);
      plot(cx + px, cy - py);
      plot(cx - px, cy - py);
    };

    // area 1
    let px = 0;
    let py = ry;
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    let p1 = Math.round(ry2 - rx2 * ry + 0.25 * rx2);
    let dx = 2 * ry2 * px;
    let dy = 2 * rx2 * py;

    while (dx < dy) {
      plotPoints(px, py);
      px++;
      dx += 2 * ry2;
      if (p1 < 0) {
        p1 += ry2 + dx;
      } else {
        py--;
        dy -= 2 * rx2;
        p1 += ry2 + dx - dy;
      }
    }

    // area 2
    let p2 = Math.round(
      ry2 * (px + 0.5) * (px + 0.5) +
      rx2 * (py - 1) * (py - 1) -
      rx2 * ry2,
    );

    while (py >= 0) {
      plotPoints(px, py);
      py--;
      dy -= 2 * rx2;
      if (p2 > 0) {
        p2 += rx2 - dy;
      } else {
        px++;
        dx += 2 * ry2;
        p2 += rx2 - dy + dx;
      }
    }
  }

  private sprayDots(cx: number, cy: number, radius: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.5) * radius;
      const dotX = cx + r * Math.cos(angle);
      const dotY = cy + r * Math.sin(angle);
      const dotR = Math.random() * 1.2 + 0.3;
      this.ctx.beginPath();
      this.ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private _bakedColorCache: { color: string; opacity: number; result: string } | null = null;

  private bakedColor(color: string, opacity: number): string {
    if (
      this._bakedColorCache &&
      this._bakedColorCache.color === color &&
      this._bakedColorCache.opacity === opacity
    ) {
      return this._bakedColorCache.result;
    }

    const tmp = document.createElement("canvas");
    tmp.width = tmp.height = 1;
    const tc = tmp.getContext("2d")!;
    tc.fillStyle = color;
    tc.fillRect(0, 0, 1, 1);
    const [r, g, b] = tc.getImageData(0, 0, 1, 1).data;
    const result = `rgba(${r},${g},${b},${opacity})`;

    this._bakedColorCache = { color, opacity, result };
    return result;
  }

  private resetCtx(): void {
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = "source-over";
  }

  private mirroredPoints(x: number, y: number): [number, number][] {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const { symmetry } = this.config;
    const pts: [number, number][] = [];

    if (symmetry === "horizontal" || symmetry === "both") pts.push([w - x, y]);
    if (symmetry === "vertical" || symmetry === "both") pts.push([x, h - y]);
    if (symmetry === "both") pts.push([w - x, h - y]);

    return pts;
  }

  private mirroredPairs(
    x1: number, y1: number,
    x2: number, y2: number,
  ): [number, number, number, number][] {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const { symmetry } = this.config;
    const pairs: [number, number, number, number][] = [];

    if (symmetry === "horizontal" || symmetry === "both")
      pairs.push([w - x1, y1, w - x2, y2]);
    if (symmetry === "vertical" || symmetry === "both")
      pairs.push([x1, h - y1, x2, h - y2]);
    if (symmetry === "both")
      pairs.push([w - x1, h - y1, w - x2, h - y2]);

    return pairs;
  }
}

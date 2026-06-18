export interface CanvasPointerCallbacks {
  onPointerDown: (x: number, y: number) => void;
  onPointerMove: (x: number, y: number) => void;
  onPointerUp: () => void;
}

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private callbacks: CanvasPointerCallbacks;
  private isPointerDown = false;

  private boundWindowMouseUp: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: CanvasPointerCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.initCanvasEvents();
  }

  attachWindowListeners(): void {
    this.boundWindowMouseUp = this.onPointerUp.bind(this);
    window.addEventListener("mouseup", this.boundWindowMouseUp);
  }

  detachWindowListeners(): void {
    if (this.boundWindowMouseUp) {
      window.removeEventListener("mouseup", this.boundWindowMouseUp);
      this.boundWindowMouseUp = null;
    }
  }

  setCursor(type: "crosshair" | "fill" | "bucket" | "spray"): void {
    switch (type) {
      case "fill":
      case "bucket":
        this.canvas.style.cursor = "cell";
        break;
      case "spray":
        this.canvas.style.cursor = "cell";
        break;
      default:
        this.canvas.style.cursor = this.makeCrosshairCursor();
    }
  }

  private makeCrosshairCursor(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <line x1="12" y1="2" x2="12" y2="22" stroke="white" stroke-width="3.5"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="white" stroke-width="3.5"/>
      <circle cx="12" cy="12" r="2" fill="none" stroke="white" stroke-width="3.5"/>
      <line x1="12" y1="2" x2="12" y2="22" stroke="black" stroke-width="1.5"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="black" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="2" fill="none" stroke="black" stroke-width="1.5"/>
    </svg>`;
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 12 12, crosshair`;
  }

  private initCanvasEvents(): void {
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onPointerUp.bind(this));
    this.canvas.addEventListener("mouseleave", this.onMouseLeave.bind(this));
    this.canvas.addEventListener("mouseenter", this.onMouseEnter.bind(this));

    this.canvas.addEventListener("touchstart", this.onTouchStart.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this.onTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.onPointerUp.bind(this));
  }

  private getPos(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isPointerDown = true;
    const { x, y } = this.getPos(e.clientX, e.clientY);
    this.callbacks.onPointerDown(x, y);
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isPointerDown) return;
    const { x, y } = this.getPos(e.clientX, e.clientY);
    this.callbacks.onPointerMove(x, y);
  }

  private onPointerUp(): void {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    this.callbacks.onPointerUp();
  }

  private onMouseLeave(_e: MouseEvent): void {
  }

  private onMouseEnter(e: MouseEvent): void {
    if (!this.isPointerDown) return;
    const { x, y } = this.getPos(e.clientX, e.clientY);
    this.callbacks.onPointerMove(x, y);
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.isPointerDown = true;
    const t = e.touches[0];
    const { x, y } = this.getPos(t.clientX, t.clientY);
    this.callbacks.onPointerDown(x, y);
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isPointerDown) return;
    const t = e.touches[0];
    const { x, y } = this.getPos(t.clientX, t.clientY);
    this.callbacks.onPointerMove(x, y);
  }
}

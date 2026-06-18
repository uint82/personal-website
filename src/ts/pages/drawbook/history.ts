import type { DrawingState } from "./types";

const MAX_HISTORY = 50;

export class HistoryManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private history: DrawingState[] = [];
  private historyStep = -1;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  saveState(): void {
    this.history = this.history.slice(0, this.historyStep + 1);

    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
    this.history.push({ imageData });
    this.historyStep++;

    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
      this.historyStep--;
    }
  }

  undo(): void {
    const targetStep = this.historyStep - 1;

    if (targetStep < 0) {
      if (this.history.length > 0) {
        this.historyStep = 0;
        this.ctx.putImageData(this.history[0].imageData, 0, 0);
      } else {
        this.clearCanvas();
      }
      return;
    }

    this.historyStep = targetStep;
    const state = this.history[this.historyStep];
    if (state) this.ctx.putImageData(state.imageData, 0, 0);
  }

  redo(): void {
    if (this.historyStep >= this.history.length - 1) return;
    this.historyStep++;
    const state = this.history[this.historyStep];
    if (state) this.ctx.putImageData(state.imageData, 0, 0);
  }

  clear(): void {
    this.clearCanvas();
    this.history = [];
    this.historyStep = -1;
    this.saveState();
  }

  snapshot(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  restore(imageData: ImageData): void {
    this.ctx.putImageData(imageData, 0, 0);
  }

  private clearCanvas(): void {
    this.ctx.fillStyle = "white";
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

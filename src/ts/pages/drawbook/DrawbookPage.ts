import Page from "../page";
import type { DrawingConfig, ToolName, ShapeName } from "./types";
import { HistoryManager } from "./history";
import { ToolEngine } from "./tools";
import { CanvasManager } from "./canvas";
import { ControlsManager } from "./controls";
import { GalleryManager } from "./gallery";

export class DrawbookPage extends Page {
  private static readonly CANVAS_WIDTH = 700;
  private static readonly CANVAS_HEIGHT = 500;

  private config: DrawingConfig = {
    activeTool: "brush",
    currentColor: localStorage.getItem("drawbook-color") || "#bd0074",
    brushWidth: parseFloat(localStorage.getItem("drawbook-width") || "3"),
    opacity: parseFloat(localStorage.getItem("drawbook-opacity") || "100") / 100,
    blendMode: (localStorage.getItem("drawbook-blend") ||
      "source-over") as GlobalCompositeOperation,
    symmetry: "none",
    activeShape: "rect",
  };

  private canvas: HTMLCanvasElement | null = null;

  private historyManager: HistoryManager | null = null;
  private toolEngine: ToolEngine | null = null;
  private canvasManager: CanvasManager | null = null;
  private controlsManager: ControlsManager | null = null;
  private galleryManager: GalleryManager | null = null;

  private isPointerActive = false;

  constructor() {
    super({
      name: "drawbook",
      pathname: "/drawbook",
      element: document.querySelector('[data-page="drawbook"]') as HTMLElement,
    });
  }

  async afterShow(): Promise<void> {
    const canvasEl = document.getElementById("drawbook-canvas") as HTMLCanvasElement | null;
    if (!canvasEl) return;

    if (this.canvas !== canvasEl) {
      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;

      this.canvas = canvasEl;

      canvasEl.width = DrawbookPage.CANVAS_WIDTH;
      canvasEl.height = DrawbookPage.CANVAS_HEIGHT;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

      this.historyManager = new HistoryManager(canvasEl, ctx);
      this.historyManager.saveState();

      this.toolEngine = new ToolEngine(canvasEl, ctx, this.config);

      this.canvasManager = new CanvasManager(canvasEl, {
        onPointerDown: this.onPointerDown.bind(this),
        onPointerMove: this.onPointerMove.bind(this),
        onPointerUp: this.onPointerUp.bind(this),
      });

      this.galleryManager = new GalleryManager(canvasEl);
      this.galleryManager.initLightbox();

      this.controlsManager = new ControlsManager(this.config, {
        onToolChange: (t) => this.setTool(t),
        onShapeChange: (s) => this.setShape(s),
        onUndo: () => this.historyManager?.undo(),
        onRedo: () => this.historyManager?.redo(),
        onClear: () => this.historyManager?.clear(),
        onSubmit: () =>
          this.galleryManager?.submitDrawing(() => this.historyManager?.clear()),
        onDownload: () => this.download(),
      });

      this.controlsManager.initButtons();
      this.controlsManager.initColorPicker();

      this.controlsManager.setActiveTool(this.config.activeTool);
      this.controlsManager.setActiveShape(this.config.activeShape);
      this.canvasManager.setCursor("crosshair");
    } else {
      this.controlsManager?.syncPickrColor();
    }

    this.canvasManager?.attachWindowListeners();
    this.controlsManager?.attachKeyboardShortcuts();
    this.galleryManager?.attachLightboxKeydown();

    void this.galleryManager?.loadGallery();
  }

  async beforeHide(): Promise<void> {
    this.canvasManager?.detachWindowListeners();
    this.controlsManager?.detachKeyboardShortcuts();
    this.controlsManager?.hidePickr();
    this.galleryManager?.detachLightboxKeydown();
  }

  async afterHide(): Promise<void> {
    // placeholder
  }

  private setTool(tool: ToolName): void {
    this.config.activeTool = tool;
    this.controlsManager?.setActiveTool(tool);
    this.canvasManager?.setCursor(tool === "fill" ? "fill" : "crosshair");
  }

  private setShape(shape: ShapeName): void {
    this.config.activeShape = shape;
    this.controlsManager?.setActiveShape(shape);
  }

  private onPointerDown(x: number, y: number): void {
    this.isPointerActive = true;
    const te = this.toolEngine;
    if (!te) return;

    switch (this.config.activeTool) {
      case "brush":
      case "eraser":
        te.startBrushStroke(x, y);
        break;

      case "fill":
        te.floodFill(x, y);
        this.historyManager?.saveState();
        this.isPointerActive = false;
        break;

      case "spray":
        te.spray(x, y);
        break;

      case "shape":
        if (this.historyManager) {
          te.startShape(x, y, this.historyManager.snapshot());
        }
        break;
    }
  }

  private onPointerMove(x: number, y: number): void {
    if (!this.isPointerActive) return;
    const te = this.toolEngine;
    if (!te) return;

    switch (this.config.activeTool) {
      case "brush":
      case "eraser":
        te.continueBrushStroke(x, y);
        break;

      case "spray":
        te.spray(x, y);
        break;

      case "shape":
        te.previewShape(x, y);
        break;
    }
  }

  private onPointerUp(): void {
    if (!this.isPointerActive) return;
    this.isPointerActive = false;
    const te = this.toolEngine;
    if (!te) return;

    switch (this.config.activeTool) {
      case "brush":
      case "eraser":
      case "spray":
        this.historyManager?.saveState();
        break;

      case "shape":
        te.commitShape();
        this.historyManager?.saveState();
        break;
    }
  }

  private download(): void {
    if (!this.canvas) return;
    const a = document.createElement("a");
    a.download = `drawbook-${Date.now()}.png`;
    a.href = this.canvas.toDataURL("image/png");
    a.click();
  }
}

import type { DrawingConfig, ToolName, ShapeName, SymmetryMode } from "./types";
import Pickr from "@simonwep/pickr";

export interface ControlCallbacks {
  onToolChange: (tool: ToolName) => void;
  onShapeChange: (shape: ShapeName) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSubmit: () => void;
  onDownload: () => void;
}

const TOOLS: ToolName[] = ["brush", "eraser", "fill", "spray", "shape"];
const SHAPES: ShapeName[] = ["line", "rect", "circle", "triangle"];
const SYM_MODES: { id: string; value: SymmetryMode }[] = [
  { id: "sym-none", value: "none" },
  { id: "sym-h", value: "horizontal" },
  { id: "sym-v", value: "vertical" },
  { id: "sym-both", value: "both" },
];

export class ControlsManager {
  private config: DrawingConfig;
  private callbacks: ControlCallbacks;
  private pickr: Pickr | null = null;
  private buttonsInitialized = false;
  private pickrInitialized = false;

  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: DrawingConfig, callbacks: ControlCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  initButtons(): void {
    if (this.buttonsInitialized) return;
    this.buttonsInitialized = true;

    this.initToolButtons();
    this.initShapePicker();
    this.initSliders();
    this.initBlendMode();
    this.initSymmetry();
    this.initActionButtons();
  }

  initColorPicker(): void {
    if (this.pickrInitialized) return;
    this.pickrInitialized = true;

    const el = document.getElementById("color-picker");
    if (!el) return;

    this.pickr = Pickr.create({
      el,
      theme: "nano",
      default: this.config.currentColor,
      swatches: [
        "#bd0074", "#000000", "#ffffff", "#ff0000", "#ff6600",
        "#ffcc00", "#00cc44", "#0088ff", "#8800ff", "#ff00cc",
        "#a0522d", "#808080", "#c0c0c0", "#008080", "#000080", "#2d2d2d",
      ],
      components: {
        preview: true,
        opacity: false,
        hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true },
      },
    });

    this.pickr.on("change", (color: Pickr.HSVaColor) => {
      this.config.currentColor = color.toHEXA().toString();
      localStorage.setItem("drawbook-color", this.config.currentColor);
    });

    this.pickr.on("hide", (instance: Pickr) => {
      instance.setColor(this.config.currentColor);
    });

    this.pickr.on("save", () => this.pickr?.hide());
  }

  attachKeyboardShortcuts(): void {
    this.boundKeydown = this.handleKeydown.bind(this);
    window.addEventListener("keydown", this.boundKeydown);
  }

  detachKeyboardShortcuts(): void {
    if (this.boundKeydown) {
      window.removeEventListener("keydown", this.boundKeydown);
      this.boundKeydown = null;
    }
  }

  hidePickr(): void {
    this.pickr?.hide();
  }

  setActiveTool(tool: ToolName): void {
    TOOLS.forEach((t) => document.getElementById(`tool-${t}`)?.classList.remove("active"));
    document.getElementById(`tool-${tool}`)?.classList.add("active");

    const shapePicker = document.getElementById("shape-picker") as HTMLElement | null;
    if (shapePicker) shapePicker.hidden = tool !== "shape";
  }

  setActiveShape(shape: ShapeName): void {
    SHAPES.forEach((s) => document.getElementById(`shape-${s}`)?.classList.remove("active"));
    document.getElementById(`shape-${shape}`)?.classList.add("active");
  }

  syncPickrColor(): void {
    this.pickr?.setColor(this.config.currentColor);
    this.pickr?.hide();
  }

  updateSymmetryOverlay(): void {
    const overlay = document.getElementById("symmetry-overlay");
    if (!overlay) return;
    overlay.setAttribute("data-sym", this.config.symmetry);
  }

  private initToolButtons(): void {
    TOOLS.forEach((tool) => {
      document.getElementById(`tool-${tool}`)?.addEventListener("click", () => {
        this.callbacks.onToolChange(tool);
      });
    });
  }

  private initShapePicker(): void {
    SHAPES.forEach((shape) => {
      document.getElementById(`shape-${shape}`)?.addEventListener("click", () => {
        this.callbacks.onShapeChange(shape);
      });
    });
  }

  private initSliders(): void {
    const bwInput = document.getElementById("brush-width") as HTMLInputElement | null;
    const bwDisplay = document.getElementById("width-value");
    if (bwInput) {
      bwInput.value = this.config.brushWidth.toString();
      if (bwDisplay) bwDisplay.textContent = this.config.brushWidth.toString();
      bwInput.addEventListener("input", () => {
        this.config.brushWidth = parseFloat(bwInput.value);
        if (bwDisplay) bwDisplay.textContent = this.config.brushWidth.toString();
        localStorage.setItem("drawbook-width", bwInput.value);
      });
    }

    const opInput = document.getElementById("opacity-slider") as HTMLInputElement | null;
    const opDisplay = document.getElementById("opacity-value");
    if (opInput) {
      const stored = parseFloat(localStorage.getItem("drawbook-opacity") || "100");
      this.config.opacity = stored / 100;
      opInput.value = stored.toString();
      if (opDisplay) opDisplay.textContent = stored.toString();
      opInput.addEventListener("input", () => {
        const pct = parseFloat(opInput.value);
        this.config.opacity = pct / 100;
        if (opDisplay) opDisplay.textContent = pct.toString();
        localStorage.setItem("drawbook-opacity", pct.toString());
      });
    }
  }

  private initBlendMode(): void {
    const sel = document.getElementById("blend-mode") as HTMLSelectElement | null;
    if (!sel) return;
    const stored = localStorage.getItem("drawbook-blend") || "source-over";
    this.config.blendMode = stored as GlobalCompositeOperation;
    sel.value = stored;
    sel.addEventListener("change", () => {
      this.config.blendMode = sel.value as GlobalCompositeOperation;
      localStorage.setItem("drawbook-blend", sel.value);
    });
  }

  private initSymmetry(): void {
    SYM_MODES.forEach(({ id, value }) => {
      document.getElementById(id)?.addEventListener("click", () => {
        SYM_MODES.forEach(({ id: sid }) =>
          document.getElementById(sid)?.classList.remove("active"),
        );
        document.getElementById(id)?.classList.add("active");
        this.config.symmetry = value;
        this.updateSymmetryOverlay();
      });
    });
  }

  private initActionButtons(): void {
    document.getElementById("undo-btn")?.addEventListener("click", () => this.callbacks.onUndo());
    document.getElementById("redo-btn")?.addEventListener("click", () => this.callbacks.onRedo());
    document.getElementById("download-btn")?.addEventListener("click", () => this.callbacks.onDownload());
    document.getElementById("submit-btn")?.addEventListener("click", () => this.callbacks.onSubmit());

    document.getElementById("clear-btn")?.addEventListener("click", () => {
      if (confirm("Clear your drawing? This cannot be undone.")) {
        this.callbacks.onClear();
      }
    });
  }

  private handleKeydown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z") {
        e.preventDefault();
        e.shiftKey ? this.callbacks.onRedo() : this.callbacks.onUndo();
        return;
      }
      if (e.key === "y") { e.preventDefault(); this.callbacks.onRedo(); return; }
      if (e.key === "s") { e.preventDefault(); this.callbacks.onDownload(); return; }
      return;
    }

    const bwInput = document.getElementById("brush-width") as HTMLInputElement | null;

    switch (e.key.toLowerCase()) {
      case "b": this.callbacks.onToolChange("brush"); break;
      case "e": this.callbacks.onToolChange("eraser"); break;
      case "f": this.callbacks.onToolChange("fill"); break;
      case "a": this.callbacks.onToolChange("spray"); break;
      case "s": this.callbacks.onToolChange("shape"); break;
      case "[":
        if (bwInput) {
          bwInput.value = String(Math.max(1, this.config.brushWidth - 1));
          bwInput.dispatchEvent(new Event("input"));
        }
        break;
      case "]":
        if (bwInput) {
          bwInput.value = String(Math.min(120, this.config.brushWidth + 1));
          bwInput.dispatchEvent(new Event("input"));
        }
        break;
    }
  }
}

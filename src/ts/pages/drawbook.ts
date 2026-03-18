import Page from "./page";
import Pickr from "@simonwep/pickr";

interface DrawingState {
  imageData: ImageData;
}

interface GalleryImage {
  url: string;
  timestamp: string;
}

class DrawbookPage extends Page {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isSubmitting = false;
  private isDrawing = false;
  private activeTool: "brush" | "eraser" = "brush";

  private currentColor = localStorage.getItem("drawbook-color") || "#bd0074";

  private brushWidth = parseFloat(
    localStorage.getItem("drawbook-width") || "3",
  );
  private history: DrawingState[] = [];
  private historyStep = -1;
  private boundStopDrawing: ((e: Event) => void) | null = null;

  private pickr: Pickr | null = null;

  private galleryImages: GalleryImage[] = [];
  private currentLightboxIndex: number = -1;
  private boundHandleKeydown: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    super({
      name: "drawbook",
      pathname: "/drawbook",
      element: document.querySelector('[data-page="drawbook"]') as HTMLElement,
    });
  }

  async afterShow(): Promise<void> {
    this.initCanvas();
    this.initControls();
    this.initLightbox();
    this.loadGallery();
  }

  private getCursorSVG(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <!-- white outline layer (drawn first, thicker) -->
      <line x1="12" y1="2" x2="12" y2="22" stroke="white" stroke-width="3.5"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="white" stroke-width="3.5"/>
      <circle cx="12" cy="12" r="2" fill="none" stroke="white" stroke-width="3.5"/>
      <!-- black fill layer (drawn on top, thinner) -->
      <line x1="12" y1="2" x2="12" y2="22" stroke="black" stroke-width="1.5"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="black" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="2" fill="none" stroke="black" stroke-width="1.5"/>
    </svg>`;
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 12 12, crosshair`;
  }

  private initCanvas(): void {
    const canvasEl = document.getElementById(
      "drawbook-canvas",
    ) as HTMLCanvasElement;

    if (!canvasEl) return;

    if (this.canvas === canvasEl && this.ctx) {
      return;
    }

    this.canvas = canvasEl;
    this.ctx = this.canvas.getContext("2d");

    if (!this.ctx) return;

    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.style.cursor = this.getCursorSVG();

    if (this.history.length === 0) {
      this.saveState();
    }

    this.canvas.addEventListener("mousedown", this.startDrawing.bind(this));
    this.canvas.addEventListener("mousemove", this.draw.bind(this));
    this.canvas.addEventListener("mouseup", this.stopDrawing.bind(this));
    this.canvas.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this),
    );
    this.canvas.addEventListener(
      "mouseenter",
      this.handleMouseEnter.bind(this),
    );

    this.boundStopDrawing = this.stopDrawing.bind(this);
    window.addEventListener("mouseup", this.boundStopDrawing);

    this.canvas.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
    );
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
    this.canvas.addEventListener("touchend", this.stopDrawing.bind(this));
  }

  private initControls(): void {
    const brushBtn = document.getElementById("tool-brush");
    const eraserBtn = document.getElementById("tool-eraser");

    if (brushBtn) {
      brushBtn.onclick = () => {
        this.activeTool = "brush";
        brushBtn.classList.add("active");
        eraserBtn?.classList.remove("active");
        if (this.canvas)
          this.canvas.style.cursor = this.getCursorSVG();
      };
    }

    if (eraserBtn) {
      eraserBtn.onclick = () => {
        this.activeTool = "eraser";
        eraserBtn.classList.add("active");
        brushBtn?.classList.remove("active");
        if (this.canvas)
          this.canvas.style.cursor = this.getCursorSVG();
      };
    }

    if (this.pickr) {
      this.pickr.setColor(this.currentColor);
      this.pickr.hide();
    } else {
      const colorPickerElement = document.getElementById("color-picker");

      if (colorPickerElement) {
        this.pickr = Pickr.create({
          el: colorPickerElement,
          theme: "nano",
          default: this.currentColor,
          swatches: [
            "#bd0074",
            "#000000",
            "#FFFFFF",
            "#FF0000",
            "#0000FF",
            "#FFFF00",
            "#00FFFF",
            "#FF00FF",
            "#C0C0C0",
            "#808080",
            "#800000",
            "#808000",
            "#008000",
            "#800080",
            "#008080",
            "#000080",
          ],
          components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: { hex: true, rgba: true, input: true, save: true },
          },
        });

        this.pickr.on("change", (color: any) => {
          const hexColor = color.toHEXA().toString();
          this.currentColor = hexColor;
          localStorage.setItem("drawbook-color", this.currentColor);
          if (this.activeTool === "brush" && this.canvas) {
            this.canvas.style.cursor = this.getCursorSVG();
          }
          if (this.activeTool === "eraser") {
            brushBtn?.click();
          }
        });

        this.pickr.on("hide", (instance: any) => {
          instance.setColor(this.currentColor);
        });

        this.pickr.on("save", () => {
          this.pickr?.hide();
        });
      }
    }

    const brushWidthInput = document.getElementById(
      "brush-width",
    ) as HTMLInputElement;
    const widthValue = document.getElementById("width-value");

    if (brushWidthInput) {
      brushWidthInput.value = this.brushWidth.toString();
      if (widthValue) widthValue.textContent = this.brushWidth.toString();

      brushWidthInput.oninput = (e) => {
        this.brushWidth = parseFloat((e.target as HTMLInputElement).value);
        if (widthValue) widthValue.textContent = this.brushWidth.toString();
        localStorage.setItem("drawbook-width", this.brushWidth.toString());
      };
    }

    const undoBtn = document.getElementById("undo-btn");
    if (undoBtn) {
      undoBtn.onclick = () => this.undo();
    }

    const redoBtn = document.getElementById("redo-btn");
    if (redoBtn) {
      redoBtn.onclick = () => this.redo();
    }

    const clearBtn = document.getElementById("clear-btn");
    if (clearBtn) {
      clearBtn.onclick = () => {
        const confirmClear = confirm(
          "Are you sure you want to clear your drawing? This cannot be undone.",
        );
        if (confirmClear) {
          this.clear();
        }
      };
    }

    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
      submitBtn.onclick = () => this.submitDrawing();
    }
  }

  private initLightbox(): void {
    const closeBtn = document.getElementById("lightbox-close");
    const prevBtn = document.getElementById("lightbox-prev");
    const nextBtn = document.getElementById("lightbox-next");
    const lightbox = document.getElementById("lightbox");

    closeBtn?.addEventListener("click", () => this.closeLightbox());

    prevBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.navigateLightbox(-1);
    });

    nextBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.navigateLightbox(1);
    });

    lightbox?.addEventListener("click", (e) => {
      if (e.target === lightbox) this.closeLightbox();
    });

    this.boundHandleKeydown = this.handleLightboxKeydown.bind(this);
    window.addEventListener("keydown", this.boundHandleKeydown);
  }

  private async openLightbox(index: number): Promise<void> {
    this.currentLightboxIndex = index;

    const imageObj = this.galleryImages[index];
    if (!imageObj) return;

    const img = new Image();
    img.src = imageObj.url;
    img.decoding = "async";

    await img.decode().catch(() => { });

    const imgEl = document.getElementById("lightbox-img") as HTMLImageElement;
    const timeEl = document.getElementById("lightbox-timestamp");

    if (imgEl) imgEl.src = imageObj.url;
    if (timeEl) timeEl.textContent = imageObj.timestamp;

    document.getElementById("lightbox")?.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    this.preloadNearby();
  }

  private preloadNearby(): void {
    const next = this.galleryImages[this.currentLightboxIndex + 1];
    const prev = this.galleryImages[this.currentLightboxIndex - 1];

    [next, prev].forEach(img => {
      if (!img) return;
      const i = new Image();
      i.src = img.url;
    });
  }

  private closeLightbox(): void {
    document.getElementById("lightbox")?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  private async navigateLightbox(direction: number): Promise<void> {
    if (this.galleryImages.length === 0) return;

    this.currentLightboxIndex += direction;

    if (this.currentLightboxIndex < 0) {
      this.currentLightboxIndex = this.galleryImages.length - 1;
    } else if (this.currentLightboxIndex >= this.galleryImages.length) {
      this.currentLightboxIndex = 0;
    }

    const imageObj = this.galleryImages[this.currentLightboxIndex];
    if (!imageObj) return;

    const img = new Image();
    img.src = imageObj.url;
    await img.decode().catch(() => { });

    this.updateLightboxContent();
    this.preloadNearby();
  }

  private updateLightboxContent(): void {
    const imageObj = this.galleryImages[this.currentLightboxIndex];
    if (!imageObj) return;

    const imgEl = document.getElementById("lightbox-img") as HTMLImageElement;
    const timeEl = document.getElementById("lightbox-timestamp");

    if (imgEl) imgEl.src = imageObj.url;
    if (timeEl) timeEl.textContent = imageObj.timestamp;
  }

  private handleLightboxKeydown(e: KeyboardEvent): void {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox || lightbox.classList.contains("hidden")) return;

    if (e.key === "Escape") this.closeLightbox();
    if (e.key === "ArrowLeft") this.navigateLightbox(-1);
    if (e.key === "ArrowRight") this.navigateLightbox(1);
  }

  private getPointerPos(clientX: number, clientY: number) {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  private startDrawing(e: MouseEvent): void {
    if (!this.ctx || !this.canvas) return;

    this.isDrawing = true;
    this.ctx.beginPath();

    const { x, y } = this.getPointerPos(e.clientX, e.clientY);
    this.ctx.moveTo(x, y);
  }

  private draw(e: MouseEvent): void {
    if (!this.isDrawing || !this.ctx || !this.canvas) return;

    const { x, y } = this.getPointerPos(e.clientX, e.clientY);

    this.ctx.lineTo(x, y);

    if (this.activeTool === "eraser") {
      this.ctx.strokeStyle = "white";
    } else {
      this.ctx.strokeStyle = this.currentColor;
    }

    this.ctx.lineWidth = this.brushWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.stroke();
  }

  private stopDrawing(): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    if (this.ctx) {
      this.ctx.closePath();
    }
    this.saveState();
  }

  private handleMouseLeave(e: MouseEvent): void {
    e.preventDefault();
    if (!this.isDrawing || !this.ctx) return;
    this.ctx.closePath();
  }

  private handleMouseEnter(e: MouseEvent): void {
    if (!this.isDrawing || !this.ctx || !this.canvas) return;

    const { x, y } = this.getPointerPos(e.clientX, e.clientY);

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (!this.ctx || !this.canvas) return;

    this.isDrawing = true;
    this.ctx.beginPath();

    const touch = e.touches[0];
    const { x, y } = this.getPointerPos(touch.clientX, touch.clientY);

    this.ctx.moveTo(x, y);
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isDrawing || !this.ctx || !this.canvas) return;

    const touch = e.touches[0];
    const { x, y } = this.getPointerPos(touch.clientX, touch.clientY);

    this.ctx.strokeStyle =
      this.activeTool === "eraser" ? "white" : this.currentColor;
    this.ctx.lineWidth = this.brushWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  private saveState(): void {
    if (!this.ctx || !this.canvas) return;

    this.history = this.history.slice(0, this.historyStep + 1);

    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
    this.history.push({ imageData });
    this.historyStep++;

    if (this.history.length > 50) {
      this.history.shift();
      this.historyStep--;
    }
  }

  private undo(): void {
    const targetStep = this.historyStep - 1;

    if (targetStep < 0) {
      if (this.history.length > 0) {
        this.historyStep = 0;
        this.ctx?.putImageData(this.history[0].imageData, 0, 0);
      } else {
        this.clear();
      }
      return;
    }

    this.historyStep = targetStep;
    const state = this.history[this.historyStep];
    if (this.ctx && state) {
      this.ctx.putImageData(state.imageData, 0, 0);
    }
  }

  private redo(): void {
    if (this.historyStep >= this.history.length - 1 || !this.ctx) {
      return;
    }

    this.historyStep++;
    const state = this.history[this.historyStep];
    this.ctx.putImageData(state.imageData, 0, 0);
  }

  private clear(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.fillStyle = "white";
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.history = [];
    this.historyStep = -1;
    this.saveState();
  }

  private async submitDrawing(): Promise<void> {
    if (this.isSubmitting || !this.canvas) return;

    const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
    const statusEl = document.getElementById("upload-status");

    if (!submitBtn || !statusEl) return;

    this.isSubmitting = true;
    submitBtn.disabled = true;
    statusEl.textContent = "Uploading...";
    statusEl.className = "upload-status";

    try {
      const dataURL = this.canvas.toDataURL("image/png");
      const blob = await (await fetch(dataURL)).blob();

      const formData = new FormData();
      formData.append("image", blob);

      const workerUrl = import.meta.env.VITE_WORKER_URL;
      if (!workerUrl) throw new Error("Worker URL not configured");

      const workerResponse = await fetch(workerUrl, {
        method: "POST",
        body: formData,
      });

      if (!workerResponse.ok) {
        const errData = await workerResponse.json().catch(() => ({}));
        throw new Error(errData.error || "Worker upload failed");
      }

      const { imageUrl } = await workerResponse.json();
      if (!imageUrl) throw new Error("No image URL returned from worker");

      const googleFormData = new FormData();
      const entryId = import.meta.env.VITE_FORM_ENTRY_ID;
      const formUrl = import.meta.env.VITE_GOOGLE_FORM_URL;

      if (!entryId || !formUrl) throw new Error("Google Form config missing");

      googleFormData.append(entryId, imageUrl);

      await fetch(formUrl, {
        method: "POST",
        body: googleFormData,
        mode: "no-cors",
      });

      statusEl.textContent = "✓ Upload successful!";
      statusEl.className = "upload-status success";

      setTimeout(() => {
        this.loadGallery();
        this.clear();
        statusEl.textContent = "";
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      statusEl.textContent = `✗ ${error instanceof Error ? error.message : "Error uploading image"}`;
      statusEl.className = "upload-status error";
    } finally {
      this.isSubmitting = false;
      submitBtn.disabled = false;
    }
  }

  private async loadGallery(): Promise<void> {
    const gallery = document.getElementById("drawing-gallery");
    if (!gallery) return;

    const sheetURL = import.meta.env.VITE_GOOGLE_SHEET_URL;

    try {
      if (!sheetURL) throw new Error("Sheet URL missing");

      const response = await fetch(sheetURL);
      const csvText = await response.text();
      const rows = csvText.split("\n").slice(1);

      gallery.innerHTML = "";
      this.galleryImages = [];
      let approvedIndex = 0;

      rows.reverse().forEach((row) => {
        const columns = row.split(",");
        if (columns.length < 2) return;

        const timestamp = columns[0].trim();
        const imageUrl = columns[1].trim().replace(/"/g, "");
        const status = columns[2]?.trim().toLowerCase().replace(/"/g, "") || "pending";

        if (!imageUrl.startsWith("http")) return;

        const container = document.createElement("div");
        container.className = "gallery-item";

        if (status === "approved") {
          const currentIdx = approvedIndex++;
          this.galleryImages.push({ url: imageUrl, timestamp });

          container.innerHTML = `
            <img src="${imageUrl}" loading="lazy" decoding="async" data-index="${currentIdx}">
            <p class="timestamp">${timestamp}</p>
          `;

          const imgEl = container.querySelector("img");
          imgEl?.addEventListener("click", () => this.openLightbox(currentIdx));
        } else {
          container.innerHTML = `
            <div class="gallery-pending">
              <span class="pending-badge">Under Review</span>
            </div>
            <p class="timestamp">${timestamp}</p>
          `;
        }

        gallery.appendChild(container);
      });

      if (gallery.children.length === 0) {
        gallery.innerHTML = "<p>No drawings yet. Be the first!</p>";
      }
    } catch (error) {
      console.error("Error loading gallery:", error);
      gallery.innerHTML = "<p>Failed to load gallery.</p>";
    }
  }

  async beforeHide(): Promise<void> {
    if (this.boundStopDrawing) {
      window.removeEventListener("mouseup", this.boundStopDrawing);
    }
    if (this.boundHandleKeydown) {
      window.removeEventListener("keydown", this.boundHandleKeydown);
    }
    if (this.pickr) {
      this.pickr.hide();
    }
  }

  async afterHide(): Promise<void> {
    // placeholder
  }
}

export const page = new DrawbookPage();

import type { GalleryImage } from "./types";

const LIKE_FP_KEY = "drawbook-fingerprint";
const MY_LIKES_KEY = "drawbook-liked-images";

export class GalleryManager {
  private canvas: HTMLCanvasElement;
  private galleryImages: GalleryImage[] = [];
  private currentLightboxIndex = -1;
  private lightboxInitialized = false;
  private isSubmitting = false;
  private fingerprint: string;

  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.fingerprint = this.getFingerprint();
  }

  private getFingerprint(): string {
    let fp = localStorage.getItem(LIKE_FP_KEY);
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem(LIKE_FP_KEY, fp);
    }
    return fp;
  }

  initLightbox(): void {
    if (this.lightboxInitialized) return;
    this.lightboxInitialized = true;

    document.getElementById("lightbox-close")?.addEventListener("click", () =>
      this.closeLightbox(),
    );
    document.getElementById("lightbox-prev")?.addEventListener("click", (e) => {
      e.stopPropagation();
      void this.navigateLightbox(-1);
    });
    document.getElementById("lightbox-next")?.addEventListener("click", (e) => {
      e.stopPropagation();
      void this.navigateLightbox(1);
    });
    document.getElementById("lightbox")?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("lightbox")) this.closeLightbox();
    });
  }

  attachLightboxKeydown(): void {
    this.boundKeydown = (e: KeyboardEvent) => {
      const lb = document.getElementById("lightbox");
      if (!lb || lb.classList.contains("hidden")) return;
      if (e.key === "Escape") this.closeLightbox();
      if (e.key === "ArrowLeft") void this.navigateLightbox(-1);
      if (e.key === "ArrowRight") void this.navigateLightbox(1);
    };
    window.addEventListener("keydown", this.boundKeydown);
  }

  detachLightboxKeydown(): void {
    if (this.boundKeydown) {
      window.removeEventListener("keydown", this.boundKeydown);
      this.boundKeydown = null;
    }
  }

  private async openLightbox(index: number): Promise<void> {
    this.currentLightboxIndex = index;
    const img = this.galleryImages[index];
    if (!img) return;

    const el = new Image();
    el.src = img.url;
    await el.decode().catch(() => { });

    const imgEl = document.getElementById("lightbox-img") as HTMLImageElement | null;
    const timeEl = document.getElementById("lightbox-timestamp");
    if (imgEl) imgEl.src = img.url;
    if (timeEl) timeEl.textContent = img.timestamp;

    document.getElementById("lightbox")?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    this.preloadNearby();
  }

  private closeLightbox(): void {
    document.getElementById("lightbox")?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  private async navigateLightbox(dir: number): Promise<void> {
    if (!this.galleryImages.length) return;
    const next = (this.currentLightboxIndex + dir + this.galleryImages.length) % this.galleryImages.length;
    this.currentLightboxIndex = next;
    const img = this.galleryImages[next];
    if (!img) return;

    const el = new Image();
    el.src = img.url;
    await el.decode().catch(() => { });

    const imgEl = document.getElementById("lightbox-img") as HTMLImageElement | null;
    const timeEl = document.getElementById("lightbox-timestamp");
    if (imgEl) imgEl.src = img.url;
    if (timeEl) timeEl.textContent = img.timestamp;

    this.preloadNearby();
  }

  private preloadNearby(): void {
    const { galleryImages: imgs, currentLightboxIndex: i } = this;
    [imgs[i + 1], imgs[i - 1]].forEach((img) => {
      if (!img) return;
      new Image().src = img.url;
    });
  }

  private getMyLikes(): Set<string> {
    try {
      const raw = localStorage.getItem(MY_LIKES_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  private setMyLikes(set: Set<string>): void {
    localStorage.setItem(MY_LIKES_KEY, JSON.stringify([...set]));
  }

  private updateLikeButtonUI(idx: number, item: GalleryImage): void {
    const gallery = document.getElementById("drawing-gallery");
    const btn = gallery?.querySelectorAll(".like-btn")[idx] as HTMLElement | undefined;
    if (!btn) return;

    btn.classList.toggle("liked", item.likedByMe);
    const icon = btn.querySelector(".like-icon");
    const count = btn.querySelector(".like-count");
    if (icon) icon.textContent = item.likedByMe ? "♥" : "♡";
    if (count) count.textContent = String(item.likeCount);
  }

  private async toggleLike(imageUrl: string, idx: number): Promise<void> {
    const workerUrl = import.meta.env.VITE_WORKER_URL;
    if (!workerUrl) return;

    const item = this.galleryImages[idx];
    if (!item) return;

    const wasLiked = item.likedByMe;
    item.likedByMe = !wasLiked;
    item.likeCount += wasLiked ? -1 : 1;
    this.updateLikeButtonUI(idx, item);

    const myLikes = this.getMyLikes();
    wasLiked ? myLikes.delete(imageUrl) : myLikes.add(imageUrl);
    this.setMyLikes(myLikes);

    try {
      const resp = await fetch(`${workerUrl}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, fingerprint: this.fingerprint }),
      });
      if (!resp.ok) throw new Error("Like request failed");

      const { liked, count } = (await resp.json()) as { liked: boolean; count: number };

      item.likedByMe = liked;
      item.likeCount = count;
      this.updateLikeButtonUI(idx, item);

      const reconciled = this.getMyLikes();
      liked ? reconciled.add(imageUrl) : reconciled.delete(imageUrl);
      this.setMyLikes(reconciled);
    } catch (err) {
      console.error("Like toggle error:", err);

      item.likedByMe = wasLiked;
      item.likeCount += wasLiked ? 1 : -1;
      this.updateLikeButtonUI(idx, item);

      const rolledBack = this.getMyLikes();
      wasLiked ? rolledBack.add(imageUrl) : rolledBack.delete(imageUrl);
      this.setMyLikes(rolledBack);
    }
  }

  async loadGallery(): Promise<void> {
    const gallery = document.getElementById("drawing-gallery");
    if (!gallery) return;

    const sheetURL = import.meta.env.VITE_GOOGLE_SHEET_URL;
    const workerUrl = import.meta.env.VITE_WORKER_URL;

    try {
      if (!sheetURL) throw new Error("Sheet URL missing");

      const [sheetResp, likesResp] = await Promise.all([
        fetch(sheetURL),
        workerUrl ? fetch(`${workerUrl}/likes`).catch(() => null) : Promise.resolve(null),
      ]);

      const csvText = await sheetResp.text();
      const likeCounts: Record<string, number> = likesResp?.ok
        ? await likesResp.json()
        : {};

      const myLikes = this.getMyLikes();

      const rows = csvText.split("\n").slice(1);

      gallery.innerHTML = "";
      this.galleryImages = [];
      let approvedIndex = 0;

      rows.reverse().forEach((row) => {
        const cols = row.split(",");
        if (cols.length < 2) return;

        const timestamp = cols[0].trim();
        const imageUrl = cols[1].trim().replace(/"/g, "");
        const status =
          cols[2]?.trim().toLowerCase().replace(/"/g, "") || "pending";

        if (!imageUrl.startsWith("http")) return;

        const container = document.createElement("div");
        container.className = "gallery-item";

        if (status === "approved") {
          const idx = approvedIndex++;
          const likeCount = likeCounts[imageUrl] || 0;
          const likedByMe = myLikes.has(imageUrl);

          this.galleryImages.push({ url: imageUrl, timestamp, likeCount, likedByMe });

          container.className = "drawing-item gallery-item";
          container.innerHTML = `
            <img src="${imageUrl}" loading="lazy" decoding="async" data-index="${idx}" alt="Drawing from ${timestamp}">
            <div class="item-footer">
              <p class="drawing-date">${timestamp}</p>
              <button class="like-btn ${likedByMe ? "liked" : ""}" data-url="${imageUrl}">
                <span class="like-icon">${likedByMe ? "♥" : "♡"}</span>
                <span class="like-count">${likeCount}</span>
              </button>
            </div>
          `;
          container
            .querySelector("img")
            ?.addEventListener("click", () => void this.openLightbox(idx));
          container
            .querySelector(".like-btn")
            ?.addEventListener("click", (e) => {
              e.stopPropagation();
              void this.toggleLike(imageUrl, idx);
            });
        } else {
          container.className = "drawing-item gallery-item";
          container.innerHTML = `
            <div class="gallery-pending">
              <span class="pending-badge">Under Review</span>
            </div>
            <p class="drawing-date">${timestamp}</p>
          `;
        }

        gallery.appendChild(container);
      });

      if (!gallery.children.length) {
        gallery.innerHTML = "<p>No drawings yet. Be the first!</p>";
      }
    } catch (err) {
      console.error("Gallery load error:", err);
      gallery.innerHTML = "<p>Failed to load gallery.</p>";
    }
  }

  async submitDrawing(onSuccess: () => void): Promise<void> {
    if (this.isSubmitting) return;

    const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement | null;
    const statusEl = document.getElementById("upload-status");
    if (!submitBtn || !statusEl) return;

    this.isSubmitting = true;
    submitBtn.disabled = true;
    statusEl.textContent = "Uploading…";
    statusEl.className = "upload-status";

    try {
      const dataURL = this.canvas.toDataURL("image/png");
      const blob = await (await fetch(dataURL)).blob();

      const formData = new FormData();
      formData.append("image", blob);

      const workerUrl = import.meta.env.VITE_WORKER_URL;
      if (!workerUrl) throw new Error("Worker URL not configured");

      const workerResp = await fetch(workerUrl, { method: "POST", body: formData });
      if (!workerResp.ok) {
        const errData = await workerResp.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || "Worker upload failed");
      }

      const { imageUrl } = (await workerResp.json()) as { imageUrl?: string };
      if (!imageUrl) throw new Error("No image URL returned from worker");

      const entryId = import.meta.env.VITE_FORM_ENTRY_ID;
      const formUrl = import.meta.env.VITE_GOOGLE_FORM_URL;
      if (!entryId || !formUrl) throw new Error("Google Form config missing");

      const gfData = new FormData();
      gfData.append(entryId, imageUrl);
      await fetch(formUrl, { method: "POST", body: gfData, mode: "no-cors" });

      statusEl.textContent = "✓ Uploaded! See you in the gallery soon.";
      statusEl.className = "upload-status success";

      setTimeout(() => {
        void this.loadGallery();
        onSuccess();
        statusEl.textContent = "";
      }, 2500);
    } catch (err) {
      console.error("Upload error:", err);
      statusEl.textContent = `✗ ${err instanceof Error ? err.message : "Upload failed"}`;
      statusEl.className = "upload-status error";
    } finally {
      this.isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  }
}

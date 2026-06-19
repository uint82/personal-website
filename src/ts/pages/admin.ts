import Page from "./page";

const WORKER_URL = import.meta.env.VITE_GUESTBOOK_URL as string;
const TOKEN_KEY = "admin-token";

// TODO:
// CREATE DRAWBOOK APPROVAL USING THE GOOGLE SHEET
// IT READ AS CSV THEN RENDER IT .... NVM
// I LL JUST THINK THE SYSTEM LATER. I PROBABLY CHANGE ON HOW
// I APPROVE DRAWING FROM DRAWBOOK. IDK FOR NOW.
// that's for today. me tired.

interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  website: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  is_owner: number;
  created_at: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

function renderAdminEntry(entry: GuestbookEntry, isPending: boolean): string {
  const safeName = escapeHtml(entry.name);
  const safeMessage = escapeHtml(entry.message);
  const meta = [entry.os, entry.browser, entry.country].filter(Boolean).join(" · ");
  const ownerTag = entry.is_owner ? ' <span class="owner-badge">developer</span>' : "";

  const nameHtml = entry.website
    ? `<a href="${escapeHtml(entry.website)}" target="_blank" rel="noopener noreferrer" class="admin-entry-link">${safeName} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>${ownerTag}`
    : `${safeName}${ownerTag}`;

  const actions = isPending
    ? `
      <button class="admin-btn admin-btn--approve admin-btn--sm" data-id="${entry.id}" data-action="approve">
        <i class="fa-solid fa-check"></i> Approve
      </button>
      <button class="admin-btn admin-btn--danger admin-btn--sm" data-id="${entry.id}" data-action="delete">
        <i class="fa-solid fa-xmark"></i> Reject
      </button>
    `
    : `
      <button class="admin-btn admin-btn--danger admin-btn--sm" data-id="${entry.id}" data-action="delete">
        <i class="fa-solid fa-trash"></i> Delete
      </button>
    `;

  return `
    <div class="admin-entry" id="admin-entry-${entry.id}">
      <div class="admin-entry-header">
        <span class="admin-entry-name">${nameHtml}</span>
        <span class="admin-entry-date">${escapeHtml(entry.created_at)}</span>
      </div>
      <div class="admin-entry-message">${safeMessage}</div>
      <div class="admin-entry-footer">
        <span class="admin-entry-meta">${escapeHtml(meta)}</span>
        <div class="admin-entry-actions">${actions}</div>
      </div>
    </div>
  `;
}

class AdminPage extends Page {
  private initialized = false;
  private isPosting = false;

  constructor() {
    super({
      name: "admin",
      pathname: "/admin",
      element: document.querySelector('[data-page="admin"]') as HTMLElement,
    });
  }

  async afterShow(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    this.initAuth();
    this.initLogout();
    this.initRefreshButtons();
    this.initFeedActions();
    this.initOwnerPost();

    if (getToken()) {
      this.showPanel();
      await this.loadBoth();
    }
  }

  async beforeHide(): Promise<void> { }
  async afterHide(): Promise<void> { }

  private initAuth(): void {
    const btn = document.getElementById("admin-auth-btn");
    const input = document.getElementById("admin-token-input") as HTMLInputElement | null;

    btn?.addEventListener("click", () => void this.tryAuth());
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void this.tryAuth();
    });
  }

  private async tryAuth(): Promise<void> {
    const input = document.getElementById("admin-token-input") as HTMLInputElement | null;
    const errorEl = document.getElementById("admin-auth-error");
    const token = input?.value.trim() || "";

    if (!token) {
      if (errorEl) errorEl.textContent = "Token cannot be empty.";
      return;
    }

    const resp = await fetch(`${WORKER_URL}/guestbook/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.status === 401) {
      if (errorEl) errorEl.textContent = "Invalid token.";
      return;
    }

    setToken(token);
    if (errorEl) errorEl.textContent = "";
    this.showPanel();
    await this.loadBoth();
  }

  private initLogout(): void {
    document.getElementById("admin-logout")?.addEventListener("click", () => {
      clearToken();
      this.hidePanel();
    });
  }

  private showPanel(): void {
    document.getElementById("admin-auth")!.hidden = true;
    document.getElementById("admin-panel")!.hidden = false;
  }

  private hidePanel(): void {
    document.getElementById("admin-auth")!.hidden = false;
    document.getElementById("admin-panel")!.hidden = true;
    const input = document.getElementById("admin-token-input") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  private initOwnerPost(): void {
    const toggle = document.getElementById("admin-owner-toggle");
    const form = document.getElementById("admin-owner-form");

    toggle?.addEventListener("click", () => {
      const hidden = form?.hidden ?? true;
      if (form) form.hidden = !hidden;
      if (toggle) toggle.textContent = hidden ? "▲ Post as owner" : "▼ Post as owner";
    });

    const nameCounter = document.getElementById("admin-owner-name-counter");
    const msgCounter = document.getElementById("admin-owner-msg-counter");
    const nameInput = document.getElementById("admin-owner-name") as HTMLInputElement | null;
    const msgInput = document.getElementById("admin-owner-message") as HTMLTextAreaElement | null;

    nameInput?.addEventListener("input", () => {
      if (nameCounter) nameCounter.textContent = `${nameInput.value.length} / 30`;
    });
    msgInput?.addEventListener("input", () => {
      if (msgCounter) msgCounter.textContent = `${msgInput.value.length} / 300`;
    });

    document.getElementById("admin-owner-submit")?.addEventListener("click", () => {
      void this.postAsOwner();
    });
  }

  private async postAsOwner(): Promise<void> {
    if (this.isPosting) return;

    const nameInput = document.getElementById("admin-owner-name") as HTMLInputElement | null;
    const websiteInput = document.getElementById("admin-owner-website") as HTMLInputElement | null;
    const msgInput = document.getElementById("admin-owner-message") as HTMLTextAreaElement | null;
    const submitBtn = document.getElementById("admin-owner-submit") as HTMLButtonElement | null;
    const statusEl = document.getElementById("admin-owner-status");

    if (!nameInput || !msgInput || !submitBtn || !statusEl) return;

    this.isPosting = true;
    submitBtn.disabled = true;
    statusEl.textContent = "Submitting...";
    statusEl.className = "admin-owner-status";

    try {
      const resp = await fetch(`${WORKER_URL}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          message: msgInput.value,
          website: websiteInput?.value || undefined,
          secret: getToken(),
        }),
      });

      const data = await resp.json() as { success?: boolean; error?: string };

      if (!resp.ok) {
        statusEl.textContent = `✗ ${data.error ?? "Failed."}`;
        statusEl.className = "admin-owner-status admin-owner-status--error";
        return;
      }

      statusEl.textContent = "✓ Submitted! Approve it in the pending queue.";
      statusEl.className = "admin-owner-status admin-owner-status--success";

      nameInput.value = "";
      msgInput.value = "";
      if (websiteInput) websiteInput.value = "";

      const nameCounter = document.getElementById("admin-owner-name-counter");
      const msgCounter = document.getElementById("admin-owner-msg-counter");
      if (nameCounter) nameCounter.textContent = "0 / 30";
      if (msgCounter) msgCounter.textContent = "0 / 300";

      await this.loadPending();
      setTimeout(() => { statusEl.textContent = ""; }, 5000);
    } catch (err) {
      console.error(err);
      statusEl.textContent = "✗ Network error.";
      statusEl.className = "admin-owner-status admin-owner-status--error";
    } finally {
      this.isPosting = false;
      submitBtn.disabled = false;
    }
  }

  private async loadBoth(): Promise<void> {
    await Promise.all([this.loadPending(), this.loadApproved()]);
  }

  private async loadPending(): Promise<void> {
    const feed = document.getElementById("admin-pending-feed");
    const count = document.getElementById("admin-pending-count");
    if (!feed) return;

    feed.innerHTML = '<p class="admin-loading">Loading...</p>';

    try {
      const resp = await fetch(`${WORKER_URL}/guestbook/pending`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await resp.json() as { entries: GuestbookEntry[] };

      if (count) count.textContent = String(data.entries.length);

      if (data.entries.length === 0) {
        feed.innerHTML = '<p class="admin-empty">No pending entries.</p>';
        return;
      }

      feed.innerHTML = data.entries.map((e) => renderAdminEntry(e, true)).join("");
    } catch (err) {
      console.error(err);
      feed.innerHTML = '<p class="admin-error">Failed to load.</p>';
    }
  }

  private async loadApproved(): Promise<void> {
    const feed = document.getElementById("admin-approved-feed");
    const count = document.getElementById("admin-approved-count");
    if (!feed) return;

    feed.innerHTML = '<p class="admin-loading">Loading...</p>';

    try {
      const resp = await fetch(`${WORKER_URL}/guestbook?cursor=`, {
        headers: {},
      });
      const data = await resp.json() as { entries: GuestbookEntry[]; nextCursor: number | null };

      if (count) count.textContent = String(data.entries.length);

      if (data.entries.length === 0) {
        feed.innerHTML = '<p class="admin-empty">No approved entries.</p>';
        return;
      }

      feed.innerHTML = data.entries.map((e) => renderAdminEntry(e, false)).join("");
    } catch (err) {
      console.error(err);
      feed.innerHTML = '<p class="admin-error">Failed to load.</p>';
    }
  }

  private initRefreshButtons(): void {
    document.getElementById("admin-refresh-pending")?.addEventListener("click", () => {
      void this.loadPending();
    });
    document.getElementById("admin-refresh-approved")?.addEventListener("click", () => {
      void this.loadApproved();
    });
  }

  private initFeedActions(): void {
    document.querySelector('[data-page="admin"]')?.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
      if (!btn) return;

      const id = parseInt(btn.dataset.id ?? "", 10);
      const action = btn.dataset.action;

      if (!id || !action) return;

      if (action === "approve") void this.approve(id);
      if (action === "delete") void this.delete(id);
    });
  }

  private async approve(id: number): Promise<void> {
    const btn = document.querySelector(`[data-id="${id}"][data-action="approve"]`) as HTMLButtonElement | null;
    if (btn) btn.disabled = true;

    try {
      const resp = await fetch(`${WORKER_URL}/guestbook/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!resp.ok) throw new Error("Approve failed");

      document.getElementById(`admin-entry-${id}`)?.remove();
      const pendingCount = document.getElementById("admin-pending-count");
      if (pendingCount) pendingCount.textContent = String(
        parseInt(pendingCount.textContent || "0", 10) - 1
      );
      await this.loadApproved();
    } catch (err) {
      console.error(err);
      if (btn) btn.disabled = false;
    }
  }

  private async delete(id: number): Promise<void> {
    if (!confirm("Delete this entry? This cannot be undone.")) return;

    const btn = document.querySelector(`[data-id="${id}"][data-action="delete"]`) as HTMLButtonElement | null;
    if (btn) btn.disabled = true;

    try {
      const resp = await fetch(`${WORKER_URL}/guestbook/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!resp.ok) throw new Error("Delete failed");

      document.getElementById(`admin-entry-${id}`)?.remove();

      const wasInPending = btn?.closest("#admin-pending-feed");
      const countEl = document.getElementById(
        wasInPending ? "admin-pending-count" : "admin-approved-count"
      );
      if (countEl) countEl.textContent = String(
        parseInt(countEl.textContent || "0", 10) - 1
      );
    } catch (err) {
      console.error(err);
      if (btn) btn.disabled = false;
    }
  }
}

export const page = new AdminPage();

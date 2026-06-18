import Page from "./page";

const WORKER_URL = import.meta.env.VITE_GUESTBOOK_URL as string;

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

const BROWSER_ICON: Record<string, string> = {
  Chrome: "fa-brands fa-chrome",
  Edge: "fa-brands fa-edge",
  Opera: "fa-brands fa-opera",
  Brave: "fa-brands fa-brave",
  Firefox: "fa-brands fa-firefox-browser",
  Safari: "fa-brands fa-safari",
  curl: "fa-solid fa-terminal",
  Unknown: "fa-solid fa-globe",
};

const OS_ICON: Record<string, string> = {
  Windows: "fa-brands fa-windows",
  Android: "fa-brands fa-android",
  iOS: "fa-brands fa-apple",
  macOS: "fa-brands fa-apple",
  ChromeOS: "fa-brands fa-chrome",
  Linux: "fa-brands fa-linux",
  Unknown: "fa-solid fa-display",
};

const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AR: "Argentina",
  AU: "Australia", AT: "Austria", BD: "Bangladesh", BE: "Belgium",
  BR: "Brazil", BG: "Bulgaria", CA: "Canada", CL: "Chile",
  CN: "China", CO: "Colombia", HR: "Croatia", CZ: "Czechia",
  DK: "Denmark", EG: "Egypt", FI: "Finland", FR: "France",
  DE: "Germany", GH: "Ghana", GR: "Greece", HK: "Hong Kong",
  HU: "Hungary", IN: "India", ID: "Indonesia", IR: "Iran",
  IQ: "Iraq", IE: "Ireland", IL: "Israel", IT: "Italy",
  JP: "Japan", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya",
  KR: "South Korea", KW: "Kuwait", LB: "Lebanon", MY: "Malaysia",
  MX: "Mexico", MA: "Morocco", NL: "Netherlands", NZ: "New Zealand",
  NG: "Nigeria", NO: "Norway", PK: "Pakistan", PE: "Peru",
  PH: "Philippines", PL: "Poland", PT: "Portugal", QA: "Qatar",
  RO: "Romania", RU: "Russia", SA: "Saudi Arabia", SG: "Singapore",
  ZA: "South Africa", ES: "Spain", LK: "Sri Lanka", SE: "Sweden",
  CH: "Switzerland", TW: "Taiwan", TH: "Thailand", TN: "Tunisia",
  TR: "Turkey", UA: "Ukraine", AE: "United Arab Emirates",
  GB: "United Kingdom", US: "United States", VN: "Vietnam",
  YE: "Yemen", ZW: "Zimbabwe",
};

function countryLabel(code: string | null): string {
  if (!code || code === "Unknown") return "";
  const name = COUNTRY_NAMES[code] ?? code;
  return `<span class="gb-country" title="${name}">${code}</span>`;
}

function browserIcon(browser: string | null): string {
  if (!browser) return "";
  const name = browser.split(" ")[0];
  const cls = BROWSER_ICON[name] ?? BROWSER_ICON["Unknown"];
  return `<span class="gb-meta-item"><i class="${cls}"></i><span class="gb-meta-text">${browser}</span></span>`;
}

function osIcon(os: string | null): string {
  if (!os) return "";
  const name = os.split(" ")[0];
  const cls = OS_ICON[name] ?? OS_ICON["Unknown"];
  return `<span class="gb-meta-item"><i class="${cls}"></i><span class="gb-meta-text">${os}</span></span>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ownerBadge(): string {
  return `<span class="owner-badge" title="Site developer">developer</span>`;
}

function renderEntry(entry: GuestbookEntry): string {
  const safeName = escapeHtml(entry.name);
  const safeMessage = escapeHtml(entry.message);

  const country = countryLabel(entry.country);
  const separator = country ? ' <span class="gb-country-sep">·</span> ' : "";

  const badge = entry.is_owner ? ownerBadge() : "";

  const nameHtml = entry.website
    ? `<a href="${escapeHtml(entry.website)}" target="_blank" rel="noopener noreferrer" class="gb-name-link">${safeName} <i class="fa-solid fa-arrow-up-right-from-square gb-ext-icon"></i></a>${badge}`
    : `<span class="gb-name">${safeName}</span>${badge}`;

  const metaParts: string[] = [];
  if (entry.os && entry.os !== "Unknown") metaParts.push(osIcon(entry.os));
  if (entry.browser && entry.browser !== "Unknown") metaParts.push(browserIcon(entry.browser));

  return `
    <div class="gb-entry">
      <div class="gb-entry-header">
        <div class="gb-entry-name">${nameHtml}${separator}${country}</div>
        <div class="gb-entry-date">${escapeHtml(entry.created_at)}</div>
      </div>
      <div class="gb-entry-message">${safeMessage}</div>
      ${metaParts.length > 0 ? `<div class="gb-entry-meta">${metaParts.join(" ")}</div>` : ""}
    </div>
  `;
}

class Guestbook extends Page {
  private nextCursor: number | null = null;
  private isLoading = false;
  private isSubmitting = false;
  private initialized = false;

  constructor() {
    super({
      name: "guestbook",
      pathname: "/guestbook",
      element: document.querySelector('[data-page="guestbook"]') as HTMLElement,
    });
  }

  async afterShow(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    this.initCounters();
    this.initSubmit();
    await this.loadEntries(true);
    this.initLoadMore();
  }

  async beforeHide(): Promise<void> { }
  async afterHide(): Promise<void> { }

  private initCounters(): void {
    const nameInput = document.getElementById("gb-name") as HTMLInputElement | null;
    const nameCounter = document.getElementById("gb-name-counter");
    const messageInput = document.getElementById("gb-message") as HTMLTextAreaElement | null;
    const messageCounter = document.getElementById("gb-message-counter");

    nameInput?.addEventListener("input", () => {
      if (nameCounter) nameCounter.textContent = `${nameInput.value.length} / 30`;
    });

    messageInput?.addEventListener("input", () => {
      if (messageCounter) messageCounter.textContent = `${messageInput.value.length} / 300`;
    });
  }

  private initSubmit(): void {
    document.getElementById("gb-submit")?.addEventListener("click", () => {
      void this.submit();
    });
  }

  private async submit(): Promise<void> {
    if (this.isSubmitting) return;

    const nameInput = document.getElementById("gb-name") as HTMLInputElement | null;
    const websiteInput = document.getElementById("gb-website") as HTMLInputElement | null;
    const messageInput = document.getElementById("gb-message") as HTMLTextAreaElement | null;
    const submitBtn = document.getElementById("gb-submit") as HTMLButtonElement | null;
    const statusEl = document.getElementById("gb-status");

    if (!nameInput || !messageInput || !submitBtn || !statusEl) return;

    this.isSubmitting = true;
    submitBtn.disabled = true;
    statusEl.textContent = "Submitting...";
    statusEl.className = "gb-status";

    try {
      const resp = await fetch(`${WORKER_URL}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          message: messageInput.value,
          website: websiteInput?.value || undefined,
        }),
      });

      const data = await resp.json() as { success?: boolean; message?: string; error?: string };

      if (!resp.ok) {
        statusEl.textContent = `✗ ${data.error ?? "Submission failed."}`;
        statusEl.className = "gb-status gb-status--error";
        return;
      }

      statusEl.textContent = "✓ Submitted! It will appear after review.";
      statusEl.className = "gb-status gb-status--success";

      nameInput.value = "";
      messageInput.value = "";
      if (websiteInput) websiteInput.value = "";

      const nameCounter = document.getElementById("gb-name-counter");
      const messageCounter = document.getElementById("gb-message-counter");
      if (nameCounter) nameCounter.textContent = "0 / 30";
      if (messageCounter) messageCounter.textContent = "0 / 300";

      setTimeout(() => { statusEl.textContent = ""; }, 5000);
    } catch (err) {
      console.error("Guestbook submit error:", err);
      statusEl.textContent = "✗ Network error. Please try again.";
      statusEl.className = "gb-status gb-status--error";
    } finally {
      this.isSubmitting = false;
      submitBtn.disabled = false;
    }
  }

  private async loadEntries(reset: boolean): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    const feed = document.getElementById("gb-feed");
    const loadMoreWrapper = document.getElementById("gb-load-more-wrapper");
    if (!feed) return;

    if (reset) {
      feed.innerHTML = '<p class="gb-loading">Loading entries...</p>';
      this.nextCursor = null;
    }

    try {
      const url = new URL(`${WORKER_URL}/guestbook`);
      if (this.nextCursor) url.searchParams.set("cursor", String(this.nextCursor));

      const resp = await fetch(url.toString());
      const data = await resp.json() as { entries: GuestbookEntry[]; nextCursor: number | null };

      if (reset) feed.innerHTML = "";

      if (data.entries.length === 0 && reset) {
        feed.innerHTML = '<p class="gb-empty">No entries yet. Be the first to sign!</p>';
      } else {
        feed.insertAdjacentHTML("beforeend", data.entries.map(renderEntry).join(""));
      }

      this.nextCursor = data.nextCursor;

      if (loadMoreWrapper) {
        loadMoreWrapper.hidden = this.nextCursor === null;
      }
    } catch (err) {
      console.error("Guestbook load error:", err);
      if (reset) feed.innerHTML = '<p class="gb-error">Failed to load entries.</p>';
    } finally {
      this.isLoading = false;
    }
  }

  private initLoadMore(): void {
    document.getElementById("gb-load-more")?.addEventListener("click", () => {
      void this.loadEntries(false);
    });
  }
}

export const page = new Guestbook();

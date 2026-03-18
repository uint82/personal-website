const KONAMI = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

let sequence: string[] = [];

function detectOS(): string {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() ?? "";

  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
  if (ua.includes("linux") || platform.includes("linux")) return "linux";
  if (ua.includes("mac") || platform.includes("mac")) return "mac";
  if (ua.includes("win") || platform.includes("win")) return "windows";
  return "unknown";
}

type OSKey = "linux" | "mac" | "windows" | "android" | "ios" | "unknown";

const messages: Record<OSKey, { line1: string; line2: string }> = {
  linux: {
    line1: "Linux detected.",
    line2: "Arch, Ubuntu, or something weird? I can't tell.",
  },
  mac: {
    line1: "macOS detected.",
    line2: "nice hardware, questionable life choices. have you considered Arch?",
  },
  windows: {
    line1: "...Windows?",
    line2: "we need to talk. seriously.",
  },
  android: {
    line1: "Android detected.",
    line2: "respect. at least you're not on iOS.",
  },
  ios: {
    line1: "iOS detected.",
    line2: "you paid how much for that? have you considered Android?",
  },
  unknown: {
    line1: "unknown OS detected.",
    line2: "I don't even know what you're running. that's concerning.",
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeText(el: HTMLElement, text: string, speed = 35): Promise<void> {
  el.textContent = "";
  for (const char of text) {
    el.textContent += char;
    await sleep(speed + Math.random() * 15);
  }
}

async function showPopup(): Promise<void> {
  if (document.getElementById("konami-popup")) return;

  const os = detectOS() as OSKey;
  const msg = messages[os];

  const overlay = document.createElement("div");
  overlay.id = "konami-overlay";

  const popup = document.createElement("div");
  popup.id = "konami-popup";
  popup.innerHTML = `
    <div class="konami-scanlines"></div>
    <div class="konami-line">
      <span class="konami-prompt">❯</span>
      <span id="konami-line1"></span>
    </div>
    <div class="konami-line konami-line-hidden" id="konami-line2-wrap">
      <span class="konami-prompt">❯</span>
      <span id="konami-line2"></span>
    </div>
    <div class="konami-dismiss" id="konami-dismiss">— press any key to dismiss —</div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add("konami-visible"));

  const line1El = document.getElementById("konami-line1")!;
  const line2Wrap = document.getElementById("konami-line2-wrap")!;
  const line2El = document.getElementById("konami-line2")!;
  const dismissEl = document.getElementById("konami-dismiss")!;

  await sleep(200);
  await typeText(line1El, msg.line1, 40);
  await sleep(400);

  line2Wrap.classList.remove("konami-line-hidden");
  await typeText(line2El, msg.line2, 35);
  await sleep(300);

  dismissEl.classList.add("konami-dismiss-visible");

  function dismiss() {
    overlay.classList.remove("konami-visible");
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
    document.removeEventListener("keydown", dismiss);
    overlay.removeEventListener("click", dismiss);
  }

  document.addEventListener("keydown", dismiss, { once: true });
  overlay.addEventListener("click", dismiss);
}

function handleKey(e: KeyboardEvent): void {
  sequence.push(e.key);
  if (sequence.length > KONAMI.length) sequence.shift();
  if (sequence.join(",") === KONAMI.join(",")) {
    sequence = [];
    void showPopup();
  }
}

export function initKonami(): void {
  document.addEventListener("keydown", handleKey);
}

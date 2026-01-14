const ABACUS_URL =
  import.meta.env.VITE_ABACUS_URL || "https://abacus.jasoncameron.dev";
const ABACUS_NAMESPACE = import.meta.env.VITE_ABACUS_NAMESPACE;
const ABACUS_KEY = import.meta.env.VITE_ABACUS_KEY;

const isConfigured = ABACUS_NAMESPACE && ABACUS_KEY;
const ENDPOINT_GET = isConfigured
  ? `${ABACUS_URL}/get/${ABACUS_NAMESPACE}/${ABACUS_KEY}`
  : "";
const ENDPOINT_HIT = isConfigured
  ? `${ABACUS_URL}/hit/${ABACUS_NAMESPACE}/${ABACUS_KEY}`
  : "";
const ENDPOINT_STREAM = isConfigured
  ? `${ABACUS_URL}/stream/${ABACUS_NAMESPACE}/${ABACUS_KEY}`
  : "";

const PERSONAL_COUNT_KEY = "waste-clicks-personal";

let globalCount = 0;
let personalCount = 0;
let isLoading = true;
let eventSource: EventSource | null = null;
let lastAnimationTime = 0;
const ANIMATION_THROTTLE = 75;
const MAX_SPARKLES = 20;
let sparkleCount = 0;

let globalCountEl: HTMLElement;
let personalCountEl: HTMLElement;
let pluralEl: HTMLElement;
let clickButton: HTMLButtonElement;
let sparklesContainer: HTMLElement;
let infoToggle: HTMLButtonElement;
let infoTooltip: HTMLElement;
let loadingEl: HTMLElement;

function init() {
  globalCountEl = document.getElementById("global-count") as HTMLElement;
  personalCountEl = document.getElementById("personal-count") as HTMLElement;
  pluralEl = document.getElementById("plural") as HTMLElement;
  clickButton = document.getElementById("click-button") as HTMLButtonElement;
  sparklesContainer = document.getElementById("sparkles") as HTMLElement;
  infoToggle = document.getElementById("info-toggle") as HTMLButtonElement;
  infoTooltip = document.getElementById("info-tooltip") as HTMLElement;
  loadingEl = document.getElementById("loading") as HTMLElement;

  if (!globalCountEl || !clickButton) {
    console.error("Required elements not found");
    return;
  }

  // check for missing config
  if (!isConfigured) {
    console.warn("clicker configuration missing. Check your .env file.");
    loadingEl.style.display = "none";
    globalCountEl.textContent = "Offline";
    globalCountEl.style.display = "block";
    return;
  }

  const stored = localStorage.getItem(PERSONAL_COUNT_KEY);
  personalCount = stored ? parseInt(stored, 10) : 0;
  updatePersonalCount();

  fetchCurrentCount();

  setupStream();

  clickButton.addEventListener("click", handleClick);

  if (infoToggle && infoTooltip) {
    infoToggle.addEventListener("click", toggleInfo);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        infoTooltip.classList.remove("show");
      }
    });
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  window.addEventListener("beforeunload", () => {
    if (eventSource) {
      eventSource.close();
    }
  });
}

async function fetchCurrentCount() {
  if (!isConfigured) return;

  try {
    const response = await fetch(ENDPOINT_GET);
    if (response.ok) {
      const data = await response.json();
      globalCount = data.value || 0;
      updateGlobalCount();
    } else if (response.status === 404) {
      globalCount = 0;
      updateGlobalCount();
    }
  } catch (error) {
    console.error("Failed to fetch count:", error);
  } finally {
    isLoading = false;
    if (loadingEl) loadingEl.style.display = "none";
    if (globalCountEl) globalCountEl.style.display = "block";
    if (clickButton) clickButton.disabled = false;
  }
}

function setupStream() {
  if (!isConfigured) return;

  try {
    eventSource = new EventSource(ENDPOINT_STREAM);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.value > globalCount) {
          globalCount = data.value;
          updateGlobalCount();

          const now = Date.now();
          if (now - lastAnimationTime > ANIMATION_THROTTLE) {
            triggerStreamAnimation();
            lastAnimationTime = now;
          }
        }
      } catch (error) {
        console.error("Stream parse error:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("Stream error:", error);
    };
  } catch (error) {
    console.error("Failed to setup stream:", error);
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  } else {
    fetchCurrentCount();
    if (
      (!eventSource || eventSource.readyState === EventSource.CLOSED) &&
      isConfigured
    ) {
      setupStream();
    }
  }
}

async function handleClick() {
  if ("vibrate" in navigator) navigator.vibrate(20);

  playCoinSound();

  triggerButtonShake();

  triggerScreenShake();

  createParticleExplosion();

  personalCount++;
  localStorage.setItem(PERSONAL_COUNT_KEY, personalCount.toString());
  updatePersonalCount();

  globalCount++;
  updateGlobalCount();
  triggerStreamAnimation();

  if (isConfigured) {
    try {
      await fetch(ENDPOINT_HIT);
    } catch (error) {
      console.error("Failed to register click:", error);
      globalCount--;
      updateGlobalCount();
    }
  }
}

function triggerButtonShake() {
  clickButton.style.animation = "none";
  void clickButton.offsetWidth;
  clickButton.style.animation = "button-hit 0.2s ease-in-out";
}

function playCoinSound() {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 988;
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1319;
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(audioContext.destination);
    gain2.connect(audioContext.destination);

    osc1.start(now);
    osc2.start(now + 0.02);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.3);
  } catch (e) { }
}

function createParticleExplosion() {
  if (!clickButton) return;

  const buttonRect = clickButton.getBoundingClientRect();
  const centerX = buttonRect.left + buttonRect.width / 2;
  const centerY = buttonRect.top + buttonRect.height / 2;

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: var(--accent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      left: ${centerX}px;
      top: ${centerY}px;
    `;

    document.body.appendChild(particle);

    const angle = (Math.PI * 2 * i) / 12;
    const velocity = 100 + Math.random() * 100;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;

    particle.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 },
      ],
      {
        duration: 600,
        easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      },
    );

    setTimeout(() => particle.remove(), 600);
  }
}

function triggerScreenShake() {
  const widget = clickButton.closest(".widget") as HTMLElement;
  if (!widget) return;

  widget.classList.remove("impact");
  void widget.offsetWidth;
  widget.classList.add("impact");

  if (globalCountEl) {
    globalCountEl.style.transform = "scale(1.1) rotate(2deg)";
    setTimeout(() => {
      globalCountEl.style.transform = "scale(1) rotate(0deg)";
    }, 100);
  }
}

function updateGlobalCount() {
  if (globalCountEl) {
    globalCountEl.textContent = formatNumber(globalCount);
  }
}

function updatePersonalCount() {
  if (personalCountEl) {
    personalCountEl.textContent = personalCount.toString();
  }
  if (pluralEl) {
    pluralEl.textContent = personalCount === 1 ? "" : "s";
  }
}

function triggerStreamAnimation() {
  if (!globalCountEl) return;

  globalCountEl.classList.remove("glow");
  void globalCountEl.offsetWidth;
  globalCountEl.classList.add("glow");

  if (sparkleCount < MAX_SPARKLES && sparklesContainer) {
    createSparkle();
  }
}

function createSparkle() {
  if (!sparklesContainer) return;

  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.textContent = "+1";

  const x = Math.random() * 80 + 10;
  const y = Math.random() * 80 + 10;
  sparkle.style.left = `${x}%`;
  sparkle.style.top = `${y}%`;

  sparklesContainer.appendChild(sparkle);
  sparkleCount++;

  setTimeout(() => {
    sparkle.remove();
    sparkleCount--;
  }, 2000);
}

function toggleInfo() {
  if (infoTooltip) {
    infoTooltip.classList.toggle("show");
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

const WORKER_URL = import.meta.env.VITE_COUNTER_URL;
const WORKER_NAMESPACE = import.meta.env.VITE_COUNTER_NAMESPACE;
const WORKER_KEY = import.meta.env.VITE_COUNTER_KEY;

const isConfigured = !!(WORKER_URL && WORKER_NAMESPACE && WORKER_KEY);

const WS_BASE = isConfigured ? WORKER_URL.replace(/^http/, "ws") : "";

const ENDPOINT_GET = isConfigured
  ? `${WORKER_URL}/get/${WORKER_NAMESPACE}/${WORKER_KEY}`
  : "";
const ENDPOINT_HIT = isConfigured
  ? `${WORKER_URL}/hit/${WORKER_NAMESPACE}/${WORKER_KEY}`
  : "";
const ENDPOINT_WS = isConfigured
  ? `${WS_BASE}/ws/${WORKER_NAMESPACE}/${WORKER_KEY}`
  : "";

const PERSONAL_COUNT_KEY = "clicker-personal-count";
const OLD_PERSONAL_COUNT_KEY = "waste-clicks-personal";

const ANIMATION_THROTTLE = 75;
const MAX_SPARKLES = 20;
const HIT_TIMEOUT_MS = 10_000;
const BATCH_FLUSH_MS = 300;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

let globalCount = 0;
let personalCount = 0;
let pendingClicks = 0;
let flushInFlight = false;
let flushTimer: number | null = null;
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: number | null = null;
let lastAnimationTime = 0;
let sparkleCount = 0;
let audioContext: AudioContext | null = null;

let globalCountEl: HTMLElement;
let personalCountEl: HTMLElement;
let pluralEl: HTMLElement;
let clickButton: HTMLButtonElement;
let clickerWidget: HTMLElement | null = null;
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

  clickerWidget = clickButton.closest(".widget") as HTMLElement | null;
  migratePersonalCount();

  if (!isConfigured) {
    console.warn("Clicker configuration missing. Check your .env file.");
    if (loadingEl) loadingEl.style.display = "none";
    globalCountEl.textContent = "Offline";
    globalCountEl.style.display = "block";
    return;
  }

  const stored = localStorage.getItem(PERSONAL_COUNT_KEY);
  personalCount = stored ? parseInt(stored, 10) : 0;
  updatePersonalCount();

  fetchCurrentCount();
  setupWebSocket();

  clickButton.addEventListener("click", handleClick);

  if (infoToggle && infoTooltip) {
    infoToggle.addEventListener("click", toggleInfo);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") infoTooltip.classList.remove("show");
    });
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  window.addEventListener("beforeunload", () => {
    flushClicks();
    if (socket) socket.close();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  });
}

function migratePersonalCount() {
  const old = localStorage.getItem(OLD_PERSONAL_COUNT_KEY);
  if (old !== null) {
    localStorage.setItem(PERSONAL_COUNT_KEY, old);
    localStorage.removeItem(OLD_PERSONAL_COUNT_KEY);
  }
}

async function fetchCurrentCount() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HIT_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT_GET, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const serverValue: number = data.value ?? 0;
      if (serverValue > globalCount) {
        globalCount = serverValue;
        updateGlobalCount();
      }
    } else if (response.status === 404) {
      if (globalCount === 0) updateGlobalCount();
    }
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name !== "AbortError") {
      console.error("Failed to fetch count:", error);
    }
  } finally {
    if (loadingEl) loadingEl.style.display = "none";
    if (globalCountEl) globalCountEl.style.display = "block";
    if (clickButton) clickButton.disabled = false;
  }
}

function handleClick() {
  if ("vibrate" in navigator) navigator.vibrate(20);

  playCoinSound();
  triggerButtonShake();
  triggerScreenShake();
  createParticleExplosion();
  triggerStreamAnimation();

  personalCount++;
  globalCount++;
  pendingClicks++;
  localStorage.setItem(PERSONAL_COUNT_KEY, personalCount.toString());
  updatePersonalCount();
  updateGlobalCount();

  scheduleBatchFlush();
}

function scheduleBatchFlush() {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(flushClicks, BATCH_FLUSH_MS);
}

async function flushClicks() {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (pendingClicks === 0 || !isConfigured) return;

  // snapshot and reset so new clicks during flush start a fresh batch
  const batch = pendingClicks;
  pendingClicks = 0;
  flushInFlight = true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HIT_TIMEOUT_MS);

  try {
    // send ONE request with ?amount=N instead of N concurrent requests.
    // this triggers only a single broadcast on the server which mean no flicker.
    await fetch(`${ENDPOINT_HIT}?amount=${batch}`, { signal: controller.signal });
    clearTimeout(timeout);
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name !== "AbortError") {
      console.error(`Failed to flush ${batch} click(s):`, error);
      personalCount -= batch;
      globalCount -= batch;
      localStorage.setItem(PERSONAL_COUNT_KEY, personalCount.toString());
      updatePersonalCount();
      updateGlobalCount();
    }
  } finally {
    flushInFlight = false;
  }
}

function setupWebSocket() {
  if (!isConfigured) return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    socket = new WebSocket(ENDPOINT_WS);

    socket.onopen = () => {
      reconnectAttempts = 0;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const incoming: number = data.value ?? 0;

        // ignore server broadcasts while we have unconfirmed optimistic clicks
        // to prevent flickering between the optimistic and server values
        if (pendingClicks > 0 || flushInFlight) return;

        if (incoming !== globalCount) {
          globalCount = incoming;
          updateGlobalCount();

          const now = Date.now();
          if (now - lastAnimationTime > ANIMATION_THROTTLE) {
            triggerStreamAnimation();
            lastAnimationTime = now;
          }
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    socket.onerror = () => {
      socket?.close();
    };

    socket.onclose = () => {
      socket = null;
      scheduleReconnect();
    };
  } catch (error) {
    console.error("Failed to setup WebSocket:", error);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = Math.min(
    RECONNECT_BASE_MS * 2 ** reconnectAttempts,
    RECONNECT_MAX_MS
  );
  reconnectAttempts++;
  console.log(`WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    setupWebSocket();
  }, delay);
}

function handleVisibilityChange() {
  if (document.hidden) {
    flushClicks();
    if (socket) {
      socket.close();
      socket = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  } else {
    fetchCurrentCount();
    reconnectAttempts = 0;
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      setupWebSocket();
    }
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

function toggleInfo() {
  if (infoTooltip) {
    infoTooltip.classList.toggle("show");
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function triggerButtonShake() {
  clickButton.style.animation = "none";
  void clickButton.offsetWidth;
  clickButton.style.animation = "button-hit 0.2s ease-in-out";
}

function triggerScreenShake() {
  if (!clickerWidget) return;

  clickerWidget.classList.remove("impact");
  void clickerWidget.offsetWidth;
  clickerWidget.classList.add("impact");

  if (globalCountEl) {
    globalCountEl.style.transform = "scale(1.1) rotate(2deg)";
    setTimeout(() => {
      globalCountEl.style.transform = "scale(1) rotate(0deg)";
    }, 100);
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
      { duration: 600, easing: "cubic-bezier(0.4, 0.0, 0.2, 1)" }
    );

    setTimeout(() => particle.remove(), 600);
  }
}

function playCoinSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

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
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

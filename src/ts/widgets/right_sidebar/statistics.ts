const WORKER_URL = import.meta.env.VITE_COUNTER_URL;
const WORKER_NAMESPACE = import.meta.env.VITE_COUNTER_NAMESPACE_VISIT;
const WORKER_KEY = import.meta.env.VITE_COUNTER_KEY_VISIT;
const PRESENCE_WORKER_URL = import.meta.env.VITE_PRESENCE_URL || "";

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

const PRESENCE_PING_URL = PRESENCE_WORKER_URL
  ? `${PRESENCE_WORKER_URL}/api/presence/ping`
  : "";
const PRESENCE_LEAVE_URL = PRESENCE_WORKER_URL
  ? `${PRESENCE_WORKER_URL}/api/presence/leave`
  : "";

const PING_INTERVAL_MS = 30_000;
const HIT_TIMEOUT_MS = 10_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

const VISIT_TRACKED_KEY = "site-visit-tracked";
const TIME_SPENT_KEY = "site-time-spent";
const SESSION_ID_KEY = "site-session-id";

let visitorCount = 0;
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: number | null = null;
let timeSpentSeconds = 0;
let timerInterval: number | null = null;
let pingInterval: number | null = null;
let sessionId = "";

let visitorCountEl: HTMLElement;
let loadingEl: HTMLElement;
let createdDateEl: HTMLElement;
let updatedDateEl: HTMLElement;
let timeSpentEl: HTMLElement;
let onlineCountEl: HTMLElement;
let onlineDotEl: HTMLElement;

function init() {
  visitorCountEl = document.getElementById("visitor-count") as HTMLElement;
  loadingEl = document.getElementById("visitor-loading") as HTMLElement;
  createdDateEl = document.getElementById("created-date") as HTMLElement;
  updatedDateEl = document.getElementById("updated-date") as HTMLElement;
  timeSpentEl = document.getElementById("time-spent") as HTMLElement;
  onlineCountEl = document.getElementById("online-count") as HTMLElement;
  onlineDotEl = document.getElementById("online-dot") as HTMLElement;

  if (!visitorCountEl || !timeSpentEl) {
    console.error("Required elements not found");
    return;
  }

  if (!isConfigured) {
    console.warn("Visitor stats configuration missing. Check your .env file.");
    if (loadingEl) loadingEl.style.display = "none";
    visitorCountEl.textContent = "---";
    visitorCountEl.style.display = "block";
    initTimeTracking();
    setStaticDates();
    initPresence();
    return;
  }

  setStaticDates();
  initTimeTracking();
  fetchCurrentCount();
  setupWebSocket();
  trackVisit();
  initPresence();

  document.addEventListener("visibilitychange", handleVisibilityChange);

  window.addEventListener("beforeunload", () => {
    if (socket) socket.close();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    stopTimer();
    saveTimeSpent();
    stopPresence();
    leavePresence();
  });
}

async function fetchCurrentCount() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HIT_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT_GET, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      visitorCount = data.value || 0;
      updateVisitorCount();
    } else if (response.status === 404) {
      visitorCount = 0;
      updateVisitorCount();
    }
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name !== "AbortError") {
      console.error("Failed to fetch visitor count:", error);
    }
  } finally {
    if (loadingEl) loadingEl.style.display = "none";
    if (visitorCountEl) visitorCountEl.style.display = "block";
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

        if (incoming !== visitorCount) {
          visitorCount = incoming;
          updateVisitorCount(true);
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

async function trackVisit() {
  if (!isConfigured) return;

  const tracked = sessionStorage.getItem(VISIT_TRACKED_KEY);
  if (tracked) {
    console.log("Visit already tracked this session");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HIT_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT_HIT, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      sessionStorage.setItem(VISIT_TRACKED_KEY, "true");
      console.log("Visit tracked successfully");
    }
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name !== "AbortError") {
      console.error("Failed to track visit:", error);
    }
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopTimer();
    saveTimeSpent();
    stopPresence();
    leavePresence();
    if (socket) {
      socket.close();
      socket = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  } else {
    startTimer();
    initPresence();

    if (isConfigured) {
      fetchCurrentCount();
      reconnectAttempts = 0;
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        setupWebSocket();
      }
    }
  }
}

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

async function pingPresence() {
  if (!PRESENCE_PING_URL) return;
  try {
    const response = await fetch(PRESENCE_PING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (response.ok) {
      const data = await response.json();
      if (typeof data.count === "number") {
        updateOnlineCount(data.count);
      }
    }
  } catch (error) {
    console.warn("Presence ping failed:", error);
  }
}

function leavePresence() {
  if (!PRESENCE_LEAVE_URL || !sessionId) return;
  navigator.sendBeacon(PRESENCE_LEAVE_URL, JSON.stringify({ sessionId }));
}

function updateOnlineCount(count: number) {
  if (onlineCountEl) {
    onlineCountEl.textContent = count.toString();
  }
  if (onlineDotEl) {
    onlineDotEl.classList.remove("pulse");
    void onlineDotEl.offsetWidth;
    onlineDotEl.classList.add("pulse");
  }
}

function initPresence() {
  if (!PRESENCE_WORKER_URL) return;
  sessionId = getOrCreateSessionId();
  pingPresence();
  pingInterval = window.setInterval(pingPresence, PING_INTERVAL_MS);
}

function stopPresence() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

function setStaticDates() {
  if (createdDateEl) {
    createdDateEl.textContent = "2025/12/12";
  }
  if (updatedDateEl) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    updatedDateEl.textContent = `${year}/${month}/${day}`;
  }
}

function initTimeTracking() {
  const savedTime = localStorage.getItem(TIME_SPENT_KEY);
  timeSpentSeconds = savedTime ? parseInt(savedTime, 10) : 0;
  updateTimeDisplay();
  startTimer();
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = window.setInterval(() => {
    timeSpentSeconds++;
    updateTimeDisplay();
    if (timeSpentSeconds % 5 === 0) saveTimeSpent();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function saveTimeSpent() {
  localStorage.setItem(TIME_SPENT_KEY, timeSpentSeconds.toString());
}

function updateTimeDisplay() {
  if (timeSpentEl) {
    timeSpentEl.textContent = formatTime(timeSpentSeconds);
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateVisitorCount(animate = false) {
  if (visitorCountEl) {
    visitorCountEl.textContent = formatNumber(visitorCount);

    if (animate) {
      visitorCountEl.classList.remove("updated");
      void visitorCountEl.offsetWidth;
      visitorCountEl.classList.add("updated");

      setTimeout(() => {
        visitorCountEl.classList.remove("updated");
      }, 500);
    }
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

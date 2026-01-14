const ABACUS_URL =
  import.meta.env.VITE_ABACUS_URL || "https://abacus.jasoncameron.dev";
const ABACUS_NAMESPACE = import.meta.env.VITE_ABACUS_NAMESPACE_VISIT;
const ABACUS_KEY = import.meta.env.VITE_ABACUS_KEY_VISIT;

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

const VISIT_TRACKED_KEY = "site-visit-tracked";
const TIME_SPENT_KEY = "site-time-spent";

let visitorCount = 0;
let eventSource: EventSource | null = null;
let timeSpentSeconds = 0;
let timerInterval: number | null = null;

let visitorCountEl: HTMLElement;
let loadingEl: HTMLElement;
let createdDateEl: HTMLElement;
let updatedDateEl: HTMLElement;
let timeSpentEl: HTMLElement;

function init() {
  visitorCountEl = document.getElementById("visitor-count") as HTMLElement;
  loadingEl = document.getElementById("visitor-loading") as HTMLElement;
  createdDateEl = document.getElementById("created-date") as HTMLElement;
  updatedDateEl = document.getElementById("updated-date") as HTMLElement;
  timeSpentEl = document.getElementById("time-spent") as HTMLElement;

  if (!visitorCountEl || !timeSpentEl) {
    console.error("Required elements not found");
    return;
  }

  // fafety check
  if (!isConfigured) {
    console.warn("Visitor stats configuration missing. Check your .env file.");
    if (loadingEl) loadingEl.style.display = "none";
    visitorCountEl.textContent = "---";
    visitorCountEl.style.display = "block";
    initTimeTracking();
    setStaticDates();
    return;
  }

  setStaticDates();

  initTimeTracking();

  fetchCurrentCount();

  setupStream();

  trackVisit();

  document.addEventListener("visibilitychange", handleVisibilityChange);

  window.addEventListener("beforeunload", () => {
    if (eventSource) {
      eventSource.close();
    }
    stopTimer();
    saveTimeSpent();
  });
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

    if (timeSpentSeconds % 5 === 0) {
      saveTimeSpent();
    }
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

async function fetchCurrentCount() {
  if (!isConfigured) return;

  try {
    const response = await fetch(ENDPOINT_GET);
    if (response.ok) {
      const data = await response.json();
      visitorCount = data.value || 0;
      updateVisitorCount();
    } else if (response.status === 404) {
      visitorCount = 0;
      updateVisitorCount();
    }
  } catch (error) {
    console.error("Failed to fetch visitor count:", error);
  } finally {
    if (loadingEl) loadingEl.style.display = "none";
    if (visitorCountEl) visitorCountEl.style.display = "block";
  }
}

function setupStream() {
  if (!isConfigured) return;

  try {
    eventSource = new EventSource(ENDPOINT_STREAM);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.value > visitorCount) {
          visitorCount = data.value;
          updateVisitorCount(true);
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
    stopTimer();
    saveTimeSpent();
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  } else {
    startTimer();

    if (isConfigured) {
      fetchCurrentCount();
      if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        setupStream();
      }
    }
  }
}

async function trackVisit() {
  if (!isConfigured) return;

  const tracked = sessionStorage.getItem(VISIT_TRACKED_KEY);

  if (tracked) {
    console.log("Visit already tracked this session");
    return;
  }

  try {
    const response = await fetch(ENDPOINT_HIT);
    if (response.ok) {
      sessionStorage.setItem(VISIT_TRACKED_KEY, "true");
      console.log("Visit tracked successfully");
      visitorCount++;
      updateVisitorCount(true);
    }
  } catch (error) {
    console.error("Failed to track visit:", error);
  }
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

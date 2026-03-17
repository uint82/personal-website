const STATUS_URL = import.meta.env.VITE_STATUS_URL;

type Status = "online" | "offline";

let terminalEl: HTMLElement;
let line2El: HTMLElement;
let outputEl: HTMLElement;
let dotEl: HTMLElement;
let userEl: HTMLElement;
let hostEl: HTMLElement;
let cursorEl: HTMLElement;

function init() {
  terminalEl = document.getElementById("status-terminal") as HTMLElement;
  line2El = document.getElementById("status-line-2") as HTMLElement;
  outputEl = document.getElementById("status-output") as HTMLElement;
  dotEl = document.getElementById("status-dot") as HTMLElement;
  userEl = document.getElementById("status-cmd-user") as HTMLElement;
  hostEl = document.getElementById("status-cmd-host") as HTMLElement;
  cursorEl = document.getElementById("status-cursor") as HTMLElement;

  if (!terminalEl) return;

  userEl.textContent = "";
  hostEl.textContent = "";
  outputEl.textContent = "";
  outputEl.title = "";
  dotEl.className = "status-dot";
  line2El.classList.add("status-line-hidden");
  terminalEl.classList.remove("status-terminal-online", "status-terminal-offline");
  cursorEl.style.display = "inline";

  runAnimation();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeText(el: HTMLElement, text: string, speed = 45): Promise<void> {
  cursorEl.style.animationPlayState = "paused";
  cursorEl.style.opacity = "1";
  el.textContent = "";
  for (const char of text) {
    el.textContent += char;
    await sleep(speed + Math.random() * 20);
  }
  cursorEl.style.animationPlayState = "running";
}

async function runAnimation() {
  await typeText(userEl, "ping abroor", 55);
  await typeText(hostEl, "@arch", 55);
  await sleep(250);

  line2El.classList.remove("status-line-hidden");

  const fakePing = randomPing();
  const [status] = await Promise.all([
    fetchStatus(),
    typeText(outputEl, "pinging...", 40),
  ]);

  await sleep(300);

  if (status === "online") {
    await typeText(outputEl, `response: ${fakePing}ms — online `, 30);
    dotEl.className = "status-dot status-dot-online";
    outputEl.title = "Online — feel free to reach out!";
    terminalEl.classList.add("status-terminal-online");
  } else {
    await typeText(outputEl, "request timed out — offline ", 30);
    dotEl.className = "status-dot status-dot-offline";
    outputEl.title = "Offline — away from keyboard";
    terminalEl.classList.add("status-terminal-offline");
  }
}

async function fetchStatus(): Promise<Status> {
  try {
    const res = await fetch(STATUS_URL);
    if (!res.ok) return "offline";
    const data = await res.json();
    return data.status === "online" ? "online" : "offline";
  } catch {
    return "offline";
  }
}

function randomPing(): number {
  return Math.floor(Math.random() * 34) + 8;
}

export function initStatus() {
  init();
}

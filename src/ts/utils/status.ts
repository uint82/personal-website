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

  if (!terminalEl || !userEl || !hostEl) return;

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
  await typeText(userEl, "ping uint32", 55);
  await typeText(hostEl, "@archlinux", 55);
  await sleep(250);

  line2El.classList.remove("status-line-hidden");

  const [result] = await Promise.all([
    fetchStatus(),
    typeText(outputEl, "pinging...", 40),
  ]);

  await sleep(150);

  if (result.status === "online") {
    await typeText(outputEl, `response: ${result.ping}ms — ONLINE `, 30);
    dotEl.className = "status-dot status-dot-online";
    outputEl.title = "Live status — my laptop is on and connected";
    terminalEl.classList.add("status-terminal-online");
  } else {
    await typeText(outputEl, "host unreachable — offline ", 30);
    dotEl.className = "status-dot status-dot-offline";
    outputEl.title = "Live status — my laptop is off or disconnected";
    terminalEl.classList.add("status-terminal-offline");
  }
}

async function fetchStatus(): Promise<{ status: Status; ping: number }> {
  try {
    const start = performance.now();
    const res = await fetch(STATUS_URL);
    const ping = Math.round(performance.now() - start);
    if (!res.ok) return { status: "offline", ping };
    const data = await res.json();
    return {
      status: data.status === "online" ? "online" : "offline",
      ping,
    };
  } catch {
    return { status: "offline", ping: 0 };
  }
}

export function initStatus() {
  init();
}

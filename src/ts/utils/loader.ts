let bar: HTMLElement | null = null;
let fillTimer: ReturnType<typeof setTimeout> | null = null;
let doneTimer: ReturnType<typeof setTimeout> | null = null;

function getBar(): HTMLElement {
  if (bar) return bar;

  const pageContent = document.querySelector<HTMLElement>(".page-content");
  if (!pageContent) throw new Error("[progress] .page-content not found");

  bar = document.createElement("div");
  bar.className = "loader-bar";
  pageContent.prepend(bar);

  return bar;
}

function clearTimers() {
  if (fillTimer) { clearTimeout(fillTimer); fillTimer = null; }
  if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
}

export function start(): void {
  clearTimers();

  const b = getBar();
  b.classList.remove("loader-complete", "loader-fade");
  b.classList.add("loader-active");
  b.style.width = "0%";

  requestAnimationFrame(() => {
    b.style.width = "30%";

    fillTimer = setTimeout(() => { b.style.width = "60%"; }, 300);
    fillTimer = setTimeout(() => { b.style.width = "85%"; }, 800);
  });
}

export function done(): void {
  clearTimers();

  const b = getBar();
  b.classList.add("loader-complete");

  doneTimer = setTimeout(() => {
    b.classList.add("loader-fade");

    doneTimer = setTimeout(() => {
      b.classList.remove("loader-active", "loader-complete", "loader-fade");
      b.style.width = "0%";
    }, 400);
  }, 200);
}

export function init(): void {
  const yearEl = document.getElementById("footer-year");
  if (!yearEl) return;

  yearEl.textContent = new Date().getFullYear().toString();
}

import { themeController } from "../controllers/theme-controller";

let newsTickerInterval: number | null = null;

const handleClick = (e: Event) => {
  const target = e.target as HTMLElement;

  if (target.id === "theme-toggle" || target.closest("#theme-toggle")) {
    e.preventDefault();
    themeController.toggle();
    updateThemeToggleIcon();
  }
};

function updateThemeToggleIcon(): void {
  const toggleButton = document.getElementById("theme-toggle");
  const iconElement = toggleButton?.querySelector(".theme-toggle-icon");

  if (!iconElement) return;

  const currentTheme = themeController.getTheme();

  iconElement.classList.remove("fa-moon", "fa-sun");

  if (currentTheme === "dark") {
    iconElement.classList.add("fa-solid", "fa-sun");
    toggleButton?.setAttribute("aria-label", "Switch to light mode");
    toggleButton?.setAttribute("title", "Switch to light mode");
  } else {
    iconElement.classList.add("fa-solid", "fa-moon");
    toggleButton?.setAttribute("aria-label", "Switch to dark mode");
    toggleButton?.setAttribute("title", "Switch to dark mode");
  }
}

function initNewsTicker(): void {
  const items = document.querySelectorAll(".news-ticker-item");

  if (items.length === 0) return;

  let currentIndex = 0;

  const rotateNews = () => {
    const current = items[currentIndex];
    const nextIndex = (currentIndex + 1) % items.length;
    const next = items[nextIndex];

    current.classList.add("exiting");
    current.classList.remove("active");

    setTimeout(() => {
      current.classList.remove("exiting");
      next.classList.add("active");
      currentIndex = nextIndex;
    }, 500);
  };

  newsTickerInterval = window.setInterval(rotateNews, 8000);
}

function stopNewsTicker(): void {
  if (newsTickerInterval !== null) {
    clearInterval(newsTickerInterval);
    newsTickerInterval = null;
  }
}

export function init(): void {
  document.addEventListener("click", handleClick);

  updateThemeToggleIcon();

  window.addEventListener("themechange", () => {
    updateThemeToggleIcon();
  });

  const toggleButton = document.getElementById("theme-toggle");
  if (toggleButton) {
    toggleButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        themeController.toggle();
        updateThemeToggleIcon();
      }
    });
  }

  initNewsTicker();
}

export { stopNewsTicker };

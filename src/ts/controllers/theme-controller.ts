type Theme = string;

class ThemeController {
  private currentTheme: Theme;
  private readonly STORAGE_KEY = "portfolio-theme";
  private isLoading = false;

  constructor() {
    this.currentTheme =
      (window as any).__INITIAL_THEME__ || this.getInitialTheme();
  }

  private getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    if (savedTheme) return savedTheme;

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  }

  private applyTheme(theme: Theme): void {
    if (this.currentTheme === theme) return;

    if (this.isLoading) {
      console.warn("Theme is currently loading, please wait...");
      return;
    }

    this.isLoading = true;

    const previousTheme = this.currentTheme;
    this.currentTheme = theme;

    const head = document.head;
    const currentLink = document.getElementById(
      "theme-stylesheet",
    ) as HTMLLinkElement;

    const newLink = document.createElement("link");
    newLink.rel = "stylesheet";
    newLink.href = `/themes/${theme}.css`;
    newLink.id = "next-theme-stylesheet";

    const loadTimeout = setTimeout(() => {
      if (this.isLoading) {
        console.warn("Theme load timeout, forcing completion");
        if (currentLink) currentLink.remove();
        newLink.id = "theme-stylesheet";
        this.isLoading = false;
        this.updateMetaColor();
      }
    }, 3000); // 3 second timeout

    newLink.onload = () => {
      clearTimeout(loadTimeout);
      console.log(`Theme loaded: ${theme}`);

      if (currentLink) {
        currentLink.remove();
      }

      newLink.id = "theme-stylesheet";

      this.isLoading = false;

      this.updateMetaColor();
    };

    newLink.onerror = () => {
      clearTimeout(loadTimeout);
      console.error(`Failed to load theme: ${theme}`);
      newLink.remove();

      this.currentTheme = previousTheme;
      this.isLoading = false;

      window.dispatchEvent(
        new CustomEvent("themechange", { detail: { theme: previousTheme } }),
      );
    };

    head.appendChild(newLink);
  }

  private updateMetaColor() {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const bg = getComputedStyle(document.body)
        .getPropertyValue("--bg")
        .trim();
      if (bg) metaThemeColor.setAttribute("content", bg);
    }
  }

  public toggle(): void {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  public setTheme(theme: Theme): void {
    this.applyTheme(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }
}

export const themeController = new ThemeController();

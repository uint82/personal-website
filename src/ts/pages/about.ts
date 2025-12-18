import Page from "./page";

class AboutPage extends Page {
  constructor() {
    super({
      name: "about",
      pathname: "/about",
      element: document.querySelector('[data-page="about"]') as HTMLElement,
    });
  }

  async beforeShow(): Promise<void> {
    // add any logic before showing the about page
  }

  async afterShow(): Promise<void> {
    // add any logic after showing the about page
  }

  async beforeHide(): Promise<void> {
    // add any logic before hiding the about page
  }

  async afterHide(): Promise<void> {
    // add any logic after hiding the about page
  }
}

export const page = new AboutPage();

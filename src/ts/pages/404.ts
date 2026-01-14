import Page from "./page";

class NotFoundPage extends Page {
  constructor() {
    super({
      name: "404",
      pathname: "/404",
      element: document.querySelector('[data-page="404"]') as HTMLElement,
    });
  }

  async beforeShow(): Promise<void> { }
  async afterShow(): Promise<void> { }
  async beforeHide(): Promise<void> { }
}

export const page = new NotFoundPage();

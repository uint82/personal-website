import Page from "./page";

class Guestbook extends Page {
  constructor() {
    super({
      name: "guestbook",
      pathname: "/guestbook",
      element: document.querySelector('[data-page="guestbook"]') as HTMLElement,
    });
  }

  async beforeShow(): Promise<void> {
    // placeholder logic before showing the blog page
  }

  async afterShow(): Promise<void> {
    // placeholder logic after showing the blog page
  }

  async beforeHide(): Promise<void> {
    // placeholder logic before hiding the blog page
  }

  async afterHide(): Promise<void> {
    // placeholder logic after hiding the blog page
  }
}

export const page = new Guestbook();

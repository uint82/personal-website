import Page from "./page";
import { navigate } from "../controllers/route-controller";

class HomePage extends Page {
  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.id === "go-counter") {
      navigate("/counter");
    }
  };

  async beforeShow(): Promise<void> {
    document.removeEventListener("click", this.handleClick);
  }

  async afterShow(): Promise<void> {
    document.addEventListener("click", this.handleClick);
  }

  async beforeHide(): Promise<void> {
    document.removeEventListener("click", this.handleClick);
  }
}

const element = document.querySelector('[data-page="home"]') as HTMLElement;
export const page = new HomePage({
  name: "home",
  pathname: "/",
  element: element,
});

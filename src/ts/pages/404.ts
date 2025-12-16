import Page from "./page";
import { navigate } from "../controllers/route-controller";

class NotFoundPage extends Page {
  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.id === "go-home-404") {
      navigate("/");
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

const element = document.querySelector('[data-page="404"]') as HTMLElement;
export const page = new NotFoundPage({
  name: "404",
  pathname: "/404",
  element: element,
});

import Page from "./page";
import { navigate } from "../controllers/route-controller";

function setupCounter(element: HTMLButtonElement) {
  let counter = 0;
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };
  element.addEventListener("click", () => setCounter(counter + 1));
  setCounter(0);
}

class CounterPage extends Page {
  private counterSetup = false;

  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.id === "go-home") {
      navigate("/");
    }
  };

  async beforeShow(): Promise<void> {
    document.removeEventListener("click", this.handleClick);
  }

  async afterShow(): Promise<void> {
    if (!this.counterSetup) {
      const counterButton = document.getElementById(
        "counter",
      ) as HTMLButtonElement;
      if (counterButton) {
        setupCounter(counterButton);
        this.counterSetup = true;
      }
    }

    document.addEventListener("click", this.handleClick);
  }

  async beforeHide(): Promise<void> {
    document.removeEventListener("click", this.handleClick);
  }
}

const element = document.querySelector('[data-page="counter"]') as HTMLElement;
export const page = new CounterPage({
  name: "counter",
  pathname: "/counter",
  element: element,
});

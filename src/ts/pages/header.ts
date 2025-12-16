import { navigate } from "../controllers/route-controller";

const handleClick = (e: Event) => {
  const target = e.target as HTMLElement;

  if (target.id === "nav-home" || target.id === "nav-counter") {
    e.preventDefault();
    const href = target.getAttribute("href");
    if (href) {
      navigate(href);
    }
  }
};

export function init(): void {
  document.addEventListener("click", handleClick);
}

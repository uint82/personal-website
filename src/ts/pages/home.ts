import Page from "./page";
import {
  loadFeaturedProjects,
  renderFeaturedProjects,
} from "../utils/widgets/featured-projects";
import { navigate } from "../controllers/route-controller";

class HomePage extends Page {
  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const projectCard = target.closest("[data-slug]");

    if (projectCard) {
      const slug = projectCard.getAttribute("data-slug");
      if (slug) {
        navigate(`/projects/${slug}`);
      }
    }
  };

  async beforeShow(): Promise<void> {
    document.removeEventListener("click", this.handleClick);

    const featuredProjectsContainer = document.querySelector(
      '[data-page="home"] .widget:nth-child(2) .widget-content',
    ) as HTMLElement;

    if (featuredProjectsContainer) {
      featuredProjectsContainer.innerHTML =
        "<p>Loading featured projects...</p>";

      try {
        const featuredProjects = await loadFeaturedProjects(2);
        featuredProjectsContainer.innerHTML =
          renderFeaturedProjects(featuredProjects);
      } catch (error) {
        console.error("Error loading featured projects:", error);
        featuredProjectsContainer.innerHTML =
          "<p>Failed to load featured projects.</p>";
      }
    }
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

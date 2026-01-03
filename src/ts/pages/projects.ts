import Page from "./page";
import { navigate } from "../controllers/route-controller";
import { loadProjectMarkdown } from "../utils/frontmatter/projects";
import { projectsIndex } from "../content/projects-index";

class ProjectsPage extends Page {
  private projectsList: Array<{
    slug: string;
    title: string;
    description: string;
    date: string;
    tags: string[];
    featured: boolean;
    published: boolean;
    image: {
      url: string;
      alt: string;
    };
  }> = [];

  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const projectItem = target.closest("[data-slug]");

    if (projectItem) {
      const slug = projectItem.getAttribute("data-slug");
      if (slug) {
        navigate(`/projects/${slug}`);
      }
    }
  };

  constructor() {
    super({
      name: "projects",
      pathname: "/projects",
      element: document.querySelector('[data-page="projects"]') as HTMLElement,
    });
  }

  async beforeShow(): Promise<void> {
    document.removeEventListener("click", this.handleClick);

    // load project metadata if not already loaded
    if (this.projectsList.length === 0) {
      await this.loadProjectsList();
    }
  }

  async afterShow(): Promise<void> {
    this.renderProjectList();
    document.addEventListener("click", this.handleClick);
  }

  async beforeHide(): Promise<void> {
    document.removeEventListener("click", this.handleClick);
  }

  private async loadProjectsList(): Promise<void> {
    const promises = projectsIndex.map(async (project) => {
      const result = await loadProjectMarkdown(project.path);
      if (result) {
        return {
          slug: project.slug,
          title: result.frontmatter.title.text,
          description: result.frontmatter.description,
          date: result.frontmatter.date,
          tags: result.frontmatter.tags,
          featured: result.frontmatter.featured,
          published: result.frontmatter.published,
          image: result.frontmatter.image,
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    this.projectsList = results.filter(
      (project) => project !== null && project.published,
    ) as typeof this.projectsList;

    // sort by date (newest first), with featured projects on top
    this.projectsList.sort((a, b) => {
      // Featured projects come first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // then sort by date
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  private renderProjectList(): void {
    const listEl = document.getElementById("project-list");
    if (!listEl) return;

    if (this.projectsList.length === 0) {
      listEl.innerHTML = "<p>Loading projects...</p>";
      return;
    }

    listEl.innerHTML = this.projectsList
      .map(
        (project) => `
        <div class="project-item ${project.featured ? "featured" : ""}" data-slug="${project.slug}">
          ${project.image ? `<img src="${project.image.url}" alt="${project.image.alt}" class="project-image" />` : ""}
          <h2>${project.title}</h2>
          <p class="date">${project.date}</p>
          <p class="description">${project.description}</p>
          <div class="technologies">
            ${project.tags.map((tag) => `<span class="tech-tag">${tag}</span>`).join("")}
          </div>
          <button>View Project →</button>
        </div>
      `,
      )
      .join("");
  }
}

export const page = new ProjectsPage();

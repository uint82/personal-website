import Page, { type Options } from "./page";
import { navigate } from "../controllers/route-controller";
import { loadProjectMarkdown } from "../utils/frontmatter/projects";
import { projectsIndex } from "../content/projects-index";

class ProjectDetailPage extends Page {
  private currentSlug: string = "";

  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.id === "back-to-projects") {
      navigate("/projects");
    }
  };

  constructor() {
    super({
      name: "project-detail",
      pathname: "/projects/:slug",
      element: document.querySelector(
        '[data-page="project-detail"]',
      ) as HTMLElement,
    });
  }

  async beforeShow(options?: Options): Promise<void> {
    document.removeEventListener("click", this.handleClick);

    if (options?.params?.slug) {
      this.currentSlug = options.params.slug;
    }
  }

  async afterShow(): Promise<void> {
    await this.renderProject();
    document.addEventListener("click", this.handleClick);
  }

  async beforeHide(): Promise<void> {
    document.removeEventListener("click", this.handleClick);
  }

  private async renderProject(): Promise<void> {
    const contentEl = document.getElementById("project-content");
    if (!contentEl) return;

    const projectInfo = projectsIndex.find((p) => p.slug === this.currentSlug);

    if (!projectInfo) {
      contentEl.innerHTML = "<p>Project not found.</p>";
      return;
    }

    contentEl.innerHTML = "<p>Loading...</p>";

    const result = await loadProjectMarkdown(projectInfo.path);

    if (!result) {
      contentEl.innerHTML = "<p>Failed to load project.</p>";
      return;
    }

    const { frontmatter, html } = result;

    if (!frontmatter.published) {
      contentEl.innerHTML = "<p>This project is not yet published.</p>";
      return;
    }

    const linksHtml =
      frontmatter.links && frontmatter.links.length > 0
        ? `
        <div class="project-links">
          ${frontmatter.links
          .map(
            (link) => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="project-link">
              <span class="link-icon ${link.icon}">${link.icon === "github" ? "→" : "↗"}</span>
              ${link.text}
            </a>
          `,
          )
          .join("")}
        </div>
      `
        : "";

    contentEl.innerHTML = `
      <article class="project-post">
        <header class="project-header">
          ${frontmatter.image ? `<img src="${frontmatter.image.url}" alt="${frontmatter.image.alt}" class="project-hero-image" />` : ""}
          <h1>${frontmatter.title.text}</h1>
          <div class="project-meta">
            <span class="date">${frontmatter.date}</span>
            ${frontmatter.featured ? '<span class="badge">Featured</span>' : ""}
          </div>
          <p class="description">${frontmatter.description}</p>
          <div class="tags">
            ${frontmatter.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
          ${linksHtml}
        </header>
        <div class="markdown-content">
          ${html}
        </div>
      </article>
    `;
  }
}

export const page = new ProjectDetailPage();

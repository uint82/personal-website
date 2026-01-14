import Page, { type Options } from "./page";
import { loadProjectMarkdown } from "../utils/frontmatter/projects";
import { projectsIndex } from "../content/projects-index";
import { getTagStyle } from "../utils/widgets/tag-colors";

class ProjectDetailPage extends Page {
  private currentSlug: string = "";

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
    if (options?.params?.slug) {
      this.currentSlug = options.params.slug;
    }
  }

  async afterShow(): Promise<void> {
    await this.renderProject();
  }

  async beforeHide(): Promise<void> { }

  private async renderProject(): Promise<void> {
    const contentEl = document.getElementById("project-content");
    const widgetTitleEl = this.element.querySelector(".widget-title"); //

    if (!contentEl) return;

    const projectInfo = projectsIndex.find((p) => p.slug === this.currentSlug);

    if (!projectInfo) {
      contentEl.innerHTML = "<p>Project not found.</p>";
      if (widgetTitleEl) widgetTitleEl.textContent = "Project Not Found";
      return;
    }

    contentEl.innerHTML = "<p>Loading...</p>";

    const result = await loadProjectMarkdown(projectInfo.path);

    if (!result) {
      contentEl.innerHTML = "<p>Failed to load project.</p>";
      return;
    }

    const { frontmatter, html } = result;

    if (widgetTitleEl) {
      widgetTitleEl.textContent = frontmatter.title.text; //
    }

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
            <a
              href="${link.url}"
              target="_blank"
              rel="noopener noreferrer"
              class="project-link"
              title="${link.icon === "github" ? "GitHub" : "Live/Docs"}"
            >
              ${link.icon === "github"
                ? '<i class="fa-brands fa-github"></i>'
                : '<i class="fa-regular fa-file-lines"></i>'
              }
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
            ${frontmatter.featured ? '<span class="badge"><i class="fa-solid fa-star" style="color: #ffd43b"></i> featured</span>' : ""}
          ${linksHtml}
          </div>
          <div class="tags">
            <i class="fa-solid fa-tag"></i>${frontmatter.tags
        .map(
          (tag) =>
            `<span class="tag" style="${getTagStyle(tag)}">${tag}</span>`,
        )
        .join("")}
          </div>
        </header>
        <div class="markdown-content">
          ${html}
        </div>
      </article>
    `;
  }
}

export const page = new ProjectDetailPage();

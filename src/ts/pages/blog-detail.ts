import Page, { type Options } from "./page";
import { navigate } from "../controllers/route-controller";
import { loadBlogMarkdown } from "../utils/frontmatter/blogs";
import { blogsIndex } from "../content/blogs-index";

class BlogDetailPage extends Page {
  private currentSlug: string = "";

  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.id === "back-to-blogs") {
      navigate("/blogs");
    }
  };

  constructor() {
    super({
      name: "blog-detail",
      pathname: "/blogs/:slug",
      element: document.querySelector(
        '[data-page="blog-detail"]',
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
    await this.renderBlog();
    document.addEventListener("click", this.handleClick);
  }

  async beforeHide(): Promise<void> {
    document.removeEventListener("click", this.handleClick);
  }

  private async renderBlog(): Promise<void> {
    const contentEl = document.getElementById("blog-content");
    if (!contentEl) return;

    const blogInfo = blogsIndex.find((b) => b.slug === this.currentSlug);

    if (!blogInfo) {
      contentEl.innerHTML = "<p>Blog post not found.</p>";
      return;
    }

    contentEl.innerHTML = "<p>Loading...</p>";

    const result = await loadBlogMarkdown(blogInfo.path);

    if (!result) {
      contentEl.innerHTML = "<p>Failed to load blog post.</p>";
      return;
    }

    const { frontmatter, html } = result;

    if (frontmatter.draft) {
      contentEl.innerHTML = "<p>This post is not yet published.</p>";
      return;
    }

    contentEl.innerHTML = `
      <article class="blog-post">
        <header class="blog-header">
          <h1>${frontmatter.title.text}</h1>
          <div class="blog-meta">
            <span class="author">By ${frontmatter.author}</span>
            <span class="date">${frontmatter.published_at}</span>
            <span class="reading-time">${frontmatter.reading_time} min read</span>
          </div>
          <p class="description">${frontmatter.description}</p>
          <div class="tags">
            ${frontmatter.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
        </header>
        <div class="markdown-content">
          ${html}
        </div>
      </article>
    `;
  }
}

export const page = new BlogDetailPage();

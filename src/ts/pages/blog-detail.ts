import Page, { type Options } from "./page";
import { loadBlogMarkdown } from "../utils/frontmatter/blogs";
import { blogsIndex } from "../content/blogs-index";
import { generateSlabTitleHtml } from "../utils/widgets/slab-title";

class BlogDetailPage extends Page {
  private currentSlug: string = "";

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
    if (options?.params?.slug) {
      this.currentSlug = options.params.slug;
    }
  }

  async afterShow(): Promise<void> {
    await this.renderBlog();
  }

  async beforeHide(): Promise<void> { }

  private async renderBlog(): Promise<void> {
    const contentEl = document.getElementById("blog-content");
    const widgetTitleEl = this.element.querySelector(".widget-title");

    if (!contentEl) return;

    const blogInfo = blogsIndex.find((b) => b.slug === this.currentSlug);

    if (!blogInfo) {
      contentEl.innerHTML = "<p>Blog post not found.</p>";
      if (widgetTitleEl) widgetTitleEl.textContent = "Blog Not Found";
      return;
    }

    contentEl.innerHTML = "<p>Loading...</p>";

    const result = await loadBlogMarkdown(blogInfo.path);

    if (!result) {
      contentEl.innerHTML = "<p>Failed to load blog post.</p>";
      return;
    }

    const { frontmatter, html } = result;

    if (widgetTitleEl) {
      widgetTitleEl.textContent = frontmatter.title.text;
    }

    if (frontmatter.draft) {
      contentEl.innerHTML = "<p>This post is not yet published.</p>";
      return;
    }

    const slabTitleHtml = generateSlabTitleHtml(
      frontmatter.title.text,
      frontmatter.title.config || "",
      this.currentSlug,
    );

    contentEl.innerHTML = `
      <article class="blog-post">
        <header class="blog-header">
          ${slabTitleHtml}
          <div class="blog-meta">
            <span class="author">By ${frontmatter.author}</span>
            <span class="date">${frontmatter.published_at}</span>
            <span class="reading-time">${frontmatter.reading_time} min read</span>
          </div>
          <div class="tags">
            <i class="fa-solid fa-tag"></i>${frontmatter.tags
        .map((tag) => `<span class="tag">${tag}</span>`)
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

export const page = new BlogDetailPage();

import Page from "./page";
import { navigate } from "../controllers/route-controller";
import { loadBlogMarkdown } from "../utils/frontmatter/blogs";
import { blogsIndex } from "../content/blogs-index";

class BlogsPage extends Page {
  private blogsList: Array<{
    slug: string;
    title: string;
    description: string;
    published_at: string;
    tags: string[];
    reading_time: number;
    draft: boolean;
  }> = [];

  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const blogItem = target.closest("[data-slug]");

    if (blogItem) {
      const slug = blogItem.getAttribute("data-slug");
      if (slug) {
        navigate(`/blogs/${slug}`);
      }
    }
  };

  constructor() {
    super({
      name: "blogs",
      pathname: "/blogs",
      element: document.querySelector('[data-page="blogs"]') as HTMLElement,
    });
  }

  async beforeShow(): Promise<void> {
    document.removeEventListener("click", this.handleClick);

    // load blog metadata if not already loaded
    if (this.blogsList.length === 0) {
      await this.loadBlogsList();
    }
  }

  async afterShow(): Promise<void> {
    this.renderBlogList();
    document.addEventListener("click", this.handleClick);
  }

  async beforeHide(): Promise<void> {
    document.removeEventListener("click", this.handleClick);
  }

  private async loadBlogsList(): Promise<void> {
    const promises = blogsIndex.map(async (blog) => {
      const result = await loadBlogMarkdown(blog.path);
      if (result) {
        return {
          slug: blog.slug,
          title: result.frontmatter.title.text,
          description: result.frontmatter.description,
          published_at: result.frontmatter.published_at,
          tags: result.frontmatter.tags,
          reading_time: result.frontmatter.reading_time,
          draft: result.frontmatter.draft,
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    this.blogsList = results.filter(
      (blog) => blog !== null && !blog.draft,
    ) as typeof this.blogsList;

    // sort by date (newest first)
    this.blogsList.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
  }

  private renderBlogList(): void {
    const listEl = document.getElementById("blog-list");
    if (!listEl) return;

    if (this.blogsList.length === 0) {
      listEl.innerHTML = "<p>Loading blogs...</p>";
      return;
    }

    listEl.innerHTML = this.blogsList
      .map(
        (blog) => `
        <article class="blog-item" data-slug="${blog.slug}">
          <h2>${blog.title}</h2>
          <div class="blog-item-meta">
            <span class="date">${blog.published_at}</span>
            <span class="reading-time">${blog.reading_time} min read</span>
          </div>
          <p class="description">${blog.description}</p>
          <div class="tags">
            ${blog.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <button class="read-more">Read More →</button>
        </article>
      `,
      )
      .join("");
  }
}

export const page = new BlogsPage();

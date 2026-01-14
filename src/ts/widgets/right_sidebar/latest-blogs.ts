import { blogsIndex } from "../../content/blogs-index";
import {
  loadBlogMarkdown,
  type BlogFrontmatter,
} from "../../utils/frontmatter/blogs";
import { navigate } from "../../controllers/route-controller";

interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
}

let loadingEl: HTMLElement;
let errorEl: HTMLElement;
let contentEl: HTMLElement;
let blogsListEl: HTMLElement;

function init() {
  loadingEl = document.getElementById("widget-blogs-loading") as HTMLElement;
  errorEl = document.getElementById("widget-blogs-error") as HTMLElement;
  contentEl = document.getElementById("widget-blogs-content") as HTMLElement;
  blogsListEl = document.getElementById("widget-blogs-list") as HTMLElement;

  if (!loadingEl || !errorEl || !contentEl || !blogsListEl) {
    console.error("Required widget elements not found");
    return;
  }

  loadLatestBlogs();
}

async function loadLatestBlogs() {
  try {
    const blogPosts: BlogPost[] = [];

    for (const blog of blogsIndex) {
      const markdown = await loadBlogMarkdown(blog.path);
      if (markdown && !markdown.frontmatter.draft) {
        blogPosts.push({
          slug: blog.slug,
          frontmatter: markdown.frontmatter,
        });
      }
    }

    blogPosts.sort((a, b) => {
      const dateA = new Date(a.frontmatter.published_at).getTime();
      const dateB = new Date(b.frontmatter.published_at).getTime();
      return dateB - dateA;
    });

    const latestPosts = blogPosts.slice(0, 4);

    displayBlogs(latestPosts);

    loadingEl.style.display = "none";
    contentEl.style.display = "block";
  } catch (error) {
    console.error("Failed to load widget blogs:", error);
    showError();
  }
}

function displayBlogs(posts: BlogPost[]) {
  blogsListEl.innerHTML = "";

  posts.forEach((post) => {
    const blogEl = createBlogElement(post);
    blogsListEl.appendChild(blogEl);
  });
}

function createBlogElement(post: BlogPost): HTMLElement {
  const blogItem = document.createElement("div");
  blogItem.className = "widget-blog-item";

  const blogTitle = document.createElement("div");
  blogTitle.className = "widget-blog-title";
  blogTitle.textContent = post.frontmatter.title.text;

  const blogDate = document.createElement("div");
  blogDate.className = "widget-blog-date";
  blogDate.textContent = formatDate(post.frontmatter.published_at);

  blogItem.appendChild(blogTitle);
  blogItem.appendChild(blogDate);

  blogItem.style.cursor = "pointer";
  blogItem.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(`/blogs/${post.slug}`);
  });

  return blogItem;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

function showError() {
  loadingEl.style.display = "none";
  errorEl.style.display = "block";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

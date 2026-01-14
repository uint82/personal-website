import * as PageHome from "../pages/home";
import * as PageAbout from "../pages/about";
import * as PageBlogs from "../pages/blogs";
import * as PageBlogDetail from "../pages/blog-detail";
import * as PageProjects from "../pages/projects";
import * as PageProjectDetail from "../pages/project-detail";
import * as PageCounter from "../pages/counter";
import * as PageGuestbook from "../pages/guestbook";
import * as Page404 from "../pages/404";
import * as PageDrawbook from "../pages/drawbook";

type PageName =
  | "home"
  | "about"
  | "blogs"
  | "blog-detail"
  | "projects"
  | "project-detail"
  | "counter"
  | "guestbook"
  | "404"
  | "drawbook";

const pages = {
  home: PageHome.page,
  about: PageAbout.page,
  blogs: PageBlogs.page,
  "blog-detail": PageBlogDetail.page,
  projects: PageProjects.page,
  "project-detail": PageProjectDetail.page,
  counter: PageCounter.page,
  guestbook: PageGuestbook.page,
  "404": Page404.page,
  drawbook: PageDrawbook.page,
};

let currentPage: (typeof pages)[PageName] | null = null;

type ChangeOptions = {
  params?: Record<string, string>;
  data?: unknown;
};

export async function change(
  pageName: PageName,
  options?: ChangeOptions,
): Promise<void> {
  const page = pages[pageName];

  if (!page) {
    console.error(`Page not found: ${pageName}`);
    return;
  }

  if (currentPage) {
    await currentPage.beforeHide();
    currentPage.hide();
    await currentPage.afterHide();
  }

  await page.beforeShow(options);
  page.show();
  await page.afterShow();

  currentPage = page;
}

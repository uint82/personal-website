import * as PageHome from "../pages/home";
import * as PageCounter from "../pages/counter";
import * as Page404 from "../pages/404";

type PageName = "home" | "counter" | "404";

const pages = {
  home: PageHome.page,
  counter: PageCounter.page,
  "404": Page404.page,
};

let currentPage: (typeof pages)[PageName] | null = null;

export async function change(pageName: PageName): Promise<void> {
  const page = pages[pageName];

  if (!page) {
    console.error(`Page not found: ${pageName}`);
    return;
  }

  // Hide current page
  if (currentPage) {
    await currentPage.beforeHide();
    currentPage.hide();
    await currentPage.afterHide();
  }

  // Show new page
  await page.beforeShow();
  page.show();
  await page.afterShow();

  currentPage = page;

  console.log(`Page changed to: ${pageName}`);
}

import { getDynamicTitle } from "../utils/seo";

function updateActiveNavLink(path: string): void {
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === path) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function updateBreadcrumbs(
  path: string,
  params?: Record<string, string>,
): void {
  const breadcrumbContainer = document.querySelector(".breadcrumbs");
  if (!breadcrumbContainer) return;

  const pathParts = path.split("/").filter(Boolean);

  let breadcrumbHTML =
    '<a href="/" class="breadcrumb-tilde breadcrumb-link">~</a>';

  if (pathParts.length === 0) {
    breadcrumbHTML += "/";
  } else if (pathParts.length === 1) {
    breadcrumbHTML += `/${pathParts[0]}/`;
  } else if (pathParts.length === 2 && params?.slug) {
    const parentPath = `/${pathParts[0]}`;
    breadcrumbHTML += `/<a href="${parentPath}" class="breadcrumb-link">${pathParts[0]}</a>/${params.slug}/`;
  } else {
    breadcrumbHTML += "/";
    pathParts.forEach((part, index) => {
      if (index < pathParts.length - 1) {
        const partialPath = "/" + pathParts.slice(0, index + 1).join("/");
        breadcrumbHTML += `<a href="${partialPath}" class="breadcrumb-link">${part}</a>/`;
      } else {
        breadcrumbHTML += `${part}/`;
      }
    });
  }

  breadcrumbHTML += '<span class="blocked-caret"></span>';

  breadcrumbContainer.innerHTML = breadcrumbHTML;
}

export function init(): void {
  const currentPath = window.location.pathname;
  updateActiveNavLink(currentPath);
  updateBreadcrumbs(currentPath);

  document.title = getDynamicTitle(currentPath);

  window.addEventListener("popstate", () => {
    const path = window.location.pathname;
    updateActiveNavLink(path);
    updateBreadcrumbs(path);
    document.title = getDynamicTitle(path);
  });

  window.addEventListener("routechange", ((e: CustomEvent) => {
    const { path, params } = e.detail;
    updateBreadcrumbs(path, params);
    updateActiveNavLink(path);

    document.title = getDynamicTitle(path, params);
  }) as EventListener);
}

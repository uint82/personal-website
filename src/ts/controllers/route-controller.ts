import * as PageController from "./page-controller";

type Route = {
  path: string | RegExp;
  pattern?: RegExp;
  load: (params?: Record<string, string>) => Promise<void>;
};

const routes: Route[] = [
  {
    path: "/",
    load: async () => {
      await PageController.change("home");
    },
  },
  {
    path: "/about",
    load: async () => {
      await PageController.change("about");
    },
  },
  {
    path: "/blogs",
    load: async () => {
      await PageController.change("blogs");
    },
  },
  {
    path: /^\/blogs\/([a-z0-9-]+)$/,
    pattern: /^\/blogs\/([a-z0-9-]+)$/,
    load: async (params) => {
      await PageController.change("blog-detail", { params });
    },
  },
  {
    path: "/projects",
    load: async () => {
      await PageController.change("projects");
    },
  },
  {
    path: /^\/projects\/([a-z0-9-]+)$/,
    pattern: /^\/projects\/([a-z0-9-]+)$/,
    load: async (params) => {
      await PageController.change("project-detail", { params });
    },
  },
  {
    path: "/guestbook",
    load: async () => {
      await PageController.change("guestbook");
    },
  },
  {
    path: "/drawbook",
    load: async () => {
      await PageController.change("drawbook");
    },
  },
];

export async function navigate(url: string): Promise<void> {
  history.pushState(null, "", url);
  await router();
}

async function router(): Promise<void> {
  const path = window.location.pathname;

  let route = routes.find((r) => r.path === path);

  if (!route) {
    for (const r of routes) {
      if (r.pattern) {
        const match = path.match(r.pattern);
        if (match) {
          route = r;
          const slug = match[1];
          await r.load({ slug });

          window.dispatchEvent(
            new CustomEvent("routechange", {
              detail: { path, params: { slug } },
            }),
          );
          return;
        }
      }
    }
  }

  if (route) {
    await route.load();

    window.dispatchEvent(
      new CustomEvent("routechange", {
        detail: { path, params: {} },
      }),
    );
  } else {
    // 404 page
    await PageController.change("404");

    window.dispatchEvent(
      new CustomEvent("routechange", {
        detail: { path, params: {} },
      }),
    );
  }
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const anchor = target.closest("a");

  if (!anchor || !anchor.href) return;

  if (
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    e.metaKey ||
    e.button !== 0 ||
    anchor.getAttribute("target") === "_blank" ||
    anchor.hasAttribute("download")
  ) {
    return;
  }

  const isInternal = anchor.href.startsWith(window.location.origin);
  if (!isInternal) return;

  e.preventDefault();
  const href = anchor.getAttribute("href");
  if (href) {
    navigate(href);
  }
});

window.addEventListener("popstate", () => {
  void router();
});

window.addEventListener("DOMContentLoaded", () => {
  void router();
});

import * as PageController from "./page-controller";

type Route = {
  path: string;
  load: () => Promise<void>;
};

const routes: Route[] = [
  {
    path: "/",
    load: async () => {
      await PageController.change("home");
    },
  },
  {
    path: "/counter",
    load: async () => {
      await PageController.change("counter");
    },
  },
];

export async function navigate(url: string): Promise<void> {
  history.pushState(null, "", url);
  await router();
}

async function router(): Promise<void> {
  const path = window.location.pathname;
  const route = routes.find((r) => r.path === path);

  if (route) {
    await route.load();
  } else {
    // 404 page
    await PageController.change("404");
  }
}

window.addEventListener("popstate", () => {
  void router();
});

window.addEventListener("DOMContentLoaded", () => {
  void router();
});

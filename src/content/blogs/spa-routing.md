---
title:
  text: "Building SPA Routing from Scratch"
  config: "2.5c 3ci 2 3.5c 2.5"
description: "Learn how to build a custom routing system for single-page applications without frameworks. A deep dive into History API, route matching, and page controllers."
published_at: "December 30, 2025"
tags: ["spa", "routing", "typescript", "javaScript", "tutorial", "devlog"]
author: "Abror"
reading_time: 12
draft: false
---

Most developers reach for React Router, Vue Router, or similar libraries when building single-page applications. But for my portfolio, I wanted full control—no black boxes, no unnecessary abstractions. This is how I built a TypeScript-based routing system with page lifecycle management from scratch.

## Why Build Your Own Router?

Framework routers are powerful, but they come with baggage. For a portfolio site, I wanted:

- Complete control over page transitions
- Zero runtime dependencies
- Type-safe routing with TypeScript
- A clean separation between routing logic and page rendering
- Proper lifecycle hooks for data loading and cleanup

Building it myself meant understanding every moving part. No magic, no surprises.

## The Architecture

My routing system has three core layers:

### 1. Route Controller

The route controller manages URL matching and navigation. Routes are defined with either static paths or regex patterns for dynamic segments:

```typescript
const routes: Route[] = [
  { path: "/", load: async () => PageController.change("home") },
  { path: "/blogs", load: async () => PageController.change("blogs") },
  {
    path: /^\/blogs\/([a-z0-9-]+)$/,
    pattern: /^\/blogs\/([a-z0-9-]+)$/,
    load: async (params) => PageController.change("blog-detail", { params }),
  },
];
```

The router matches paths in order. For dynamic routes, it extracts parameters from the regex capture groups and passes them to the page controller.

### 2. Page Controller

This layer manages page transitions and lifecycle. Each page goes through four stages:

1. **beforeShow** - Data loading, cleanup of previous listeners
2. **show** - Add `.active` class to display the page
3. **afterShow** - Attach event listeners, finalize rendering
4. **beforeHide/afterHide** - Cleanup before switching pages

```typescript
export async function change(pageName: PageName, options?: ChangeOptions) {
  const page = pages[pageName];

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
```

This ensures smooth transitions and proper cleanup. No memory leaks, no orphaned listeners.

### 3. Page Classes

Each page extends a base `Page` class and implements its own lifecycle methods:

```typescript
class BlogsPage extends Page {
  private blogsList = [];

  async beforeShow() {
    if (this.blogsList.length === 0) {
      await this.loadBlogsList();
    }
  }

  async afterShow() {
    this.renderBlogList();
    document.addEventListener("click", this.handleClick);
  }

  async beforeHide() {
    document.removeEventListener("click", this.handleClick);
  }
}
```

Pages are self-contained. They manage their own data, rendering, and events.

## Key Implementation Details

### Dynamic Route Matching

For routes like `/blogs/my-slug`, the router uses regex patterns:

```typescript
async function router() {
  const path = window.location.pathname;
  let route = routes.find((r) => r.path === path);

  if (!route) {
    for (const r of routes) {
      if (r.pattern) {
        const match = path.match(r.pattern);
        if (match) {
          const slug = match[1];
          await r.load({ slug });
          // Dispatch custom event for breadcrumbs
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

  if (route) await route.load();
  else await PageController.change("404");
}
```

The extracted parameters flow through to the page's `beforeShow` method.

### Navigation and Breadcrumbs

Navigation is centralized through a single function that updates history and triggers the router:

```typescript
export async function navigate(url: string) {
  history.pushState(null, "", url);
  await router();
}
```

A custom `routechange` event keeps the breadcrumb navigation in sync with the current route, including dynamic parameters.

### Type Safety

TypeScript ensures page names and parameters are validated at compile time:

```typescript
type PageName = "home" | "blogs" | "blog-detail" | "projects" | "404";

const pages: Record<PageName, Page> = {
  home: PageHome.page,
  blogs: PageBlogs.page,
  "blog-detail": PageBlogDetail.page,
  // ...
};
```

No more typos breaking routes at runtime.

## What I Learned

The biggest lesson: **lifecycle management is everything**. Without proper cleanup between page transitions, you get memory leaks and buggy behavior. The four-phase lifecycle (beforeShow → show → afterShow → beforeHide) makes it explicit when data loads, when events attach, and when cleanup happens.

The second lesson: **custom events are underrated**. Using `routechange` events to communicate between the router and navigation components keeps everything decoupled. The breadcrumb system doesn't need to import routing logic—it just listens for events.

Framework routers handle all this behind the scenes. Building it yourself means understanding _why_ these patterns exist.

## Is It Worth It?

For a portfolio? Absolutely. The entire routing system is ~200 lines of TypeScript. It's maintainable, type-safe, and does exactly what I need—nothing more, nothing less.

For a production app at scale? Maybe not. But that's the point: building it teaches you what frameworks actually do. The next time you use React Router, you'll understand why it works the way it does.

Sometimes the best way to learn is to build it yourself.

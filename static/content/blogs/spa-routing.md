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

When I started on my portfolio site I had React Router in my head as the default option, just because that's what I always reach for. But this time I decided to just write the routing myself. Partly out of curiosity, partly because I didn't want to pull in a dependency for something that's, like, conceptually not that complicated. Turned out to be more involved than I expected, but here's how it ended up.

## Why Build Your Own Router?

I wanted to understand what these libraries are actually doing under the hood, and a portfolio site felt like a low-stakes place to find out. Along the way I figured I'd also get:

- no dependency to update every few months
- routes that are actually type-checked instead of stringly-typed everywhere
- some separation between "what URL matched" and "what gets rendered," instead of those being tangled together

Mostly though it was just an excuse to mess around with the History API, which I'd never actually touched directly before.

## The Architecture

I ended up with roughly three layers, though calling it "architecture" feels a little generous for ~200 lines of code.

### 1. Route Controller

This part just matches the URL against a list of routes. Some are plain strings, some are regex for stuff like blog slugs:

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

It checks routes top to bottom and the first match wins, which is the same way basically every router works once you look under the hood. For the regex ones it pulls whatever's in the capture group and hands it off to the page.

### 2. Page Controller

This is the part I rewrote the most times. Every page goes through four steps when it's switched to or away from:

1. **beforeShow** - load data, clean up whatever the last page left behind
2. **show** - slap an `.active` class on it so it's visible
3. **afterShow** - attach event listeners, finish rendering
4. **beforeHide/afterHide** - cleanup before the next page takes over

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

I didn't get this right on the first try, by the way. My first version had listeners stacking up every time you navigated back to a page, which I only noticed because clicking something started firing the handler like four times. That's basically what pushed me toward the explicit four-phase thing instead of just winging it.

### 3. Page Classes

Each page is a class extending a base `Page` thing, and handles its own data and DOM stuff:

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

Nothing too clever here, it's basically each page minding its own business and cleaning up after itself when it leaves.

## Some Implementation Stuff Worth Mentioning

### Dynamic Route Matching

For something like `/blogs/my-slug`, the router falls back to checking regex patterns if no exact string match is found:

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

Whatever gets matched out of the regex flows into the page's `beforeShow`, which is honestly the part I'm least sure I'd defend if someone picked it apart, but it works for now.

### Navigation and Breadcrumbs

All navigation funnels through one function so I don't end up with `history.pushState` calls scattered everywhere:

```typescript
export async function navigate(url: string) {
  history.pushState(null, "", url);
  await router();
}
```

I also fire a `routechange` custom event whenever the route changes, mainly so the breadcrumb component can update itself without needing to know anything about how routing actually works internally. Felt like a clean way to avoid importing routing logic into a component that has nothing to do with routing.

### Type Safety

This is the part TypeScript actually earns its keep on, since page names are a union type instead of just strings everywhere:

```typescript
type PageName = "home" | "blogs" | "blog-detail" | "projects" | "404";

const pages: Record<PageName, Page> = {
  home: PageHome.page,
  blogs: PageBlogs.page,
  "blog-detail": PageBlogDetail.page,
  // ...
};
```

I typo'd a page name early on and TS caught it immediately instead of me finding out by clicking a broken link in prod.

## What I Learned

The biggest thing was just how much lifecycle management matters and how easy it is to get wrong. Without the cleanup steps I kept getting weird bugs, duplicate listeners, stuff firing twice, data from the previous page bleeding into the next one. None of that is obvious until you hit it.

The other thing, custom events turned out way more useful than I expected. Using `routechange` to let the breadcrumb thing know what happened, without it needing to import any router code directly, kept things a lot less tangled than I thought it'd be going in.

The whole thing ended up around 200 lines. Next time I reach for React Router on an actual production thing, I'll at least have a rough idea what it's doing instead of just trusting it blindly.

---
title:
  text: "Building My Own Frontmatter Parser"
  config: "2.5c 2.5c 3.5c 2.5"
description: "Why I ditched gray-matter and wrote a custom YAML parser for my blog. Spoiler: it's smaller, faster, and I actually understand how it works."
published_at: "January 1, 2026"
tags: ["typeScript", "javascript", "parsing", "markdown", "devlog"]
author: "abror"
reading_time: 6
draft: false
---

So when I was setting up this blog, the obvious move was to just npm install `gray-matter` like every tutorial tells you to. I almost did. Then I got curious how it actually works under the hood and ended up writing my own version in about 200 lines of TypeScript instead.

## The Problem

Frontmatter is basically just YAML sitting at the top of a markdown file between two `---` lines:

```yaml
---
title:
  text: "My Post"
  config: "2c 3c"
tags: ["web", "typescript"]
published: true
---
# Content starts here...
```

What I actually needed to do was:

1. Pull that frontmatter block out from the rest of the markdown
2. Parse the YAML-ish syntax (strings, numbers, booleans, arrays, objects)
3. Deal with nested stuff
4. Handle both `[a, b, c]` inline arrays and the multi-line kind

## How It Works

It ended up being three-ish pieces stitched together.

### 1. Pulling Out the Frontmatter

First step is just a regex split between the frontmatter block and everything after it:

```typescript
export function extractFrontmatter(markdown: string): ParseResult {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: markdown };
  }

  const frontmatterText = match[1];
  const content = match[2];

  return { data: parseFrontmatterText(frontmatterText), content };
}
```

If there's no frontmatter at all, it just gives back an empty object and treats the whole file as content. Nothing fancy.

### 2. Going Line by Line

Since YAML cares about indentation, I just walk through it line by line and track how indented each line is:

```typescript
function parseFrontmatterText(frontmatterText: string): any {
  const data: any = {};
  const lines = frontmatterText.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.length - line.trimLeft().length;

    // Only process top-level keys (indent 0)
    if (indent === 0 && trimmed.includes(":")) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (value === "") {
        // Check if next line is an array or object
        // ...
      } else {
        data[key] = parseValue(value);
        i++;
      }
    }
  }

  return data;
}
```

The annoying part is when a key has nothing after the colon, you have to peek at the next line to figure out if it's about to be a nested object or an array. I spent way longer than I'd like to admit getting this part right.

### 3. Recursion for Nested Stuff

For anything nested I just recurse and track indentation as the "are we still inside this block" signal:

```typescript
export function parseObject(
  lines: string[],
  startIndex: number,
): { result: any; lastIndex: number } {
  const obj: any = {};
  const baseIndent =
    lines[startIndex].length - lines[startIndex].trimLeft().length;

  let i = startIndex;
  while (i < lines.length) {
    const indent = lines[i].length - lines[i].trimLeft().length;

    // If we're back to a lower indent level, we're done
    if (indent < baseIndent) {
      break;
    }

    // Parse key-value pairs at this indent level
    // ...
  }

  return { result: obj, lastIndex: i };
}
```

Arrays work pretty much the same way, just stop once the indentation drops back below where you started.

### 4. Figuring Out Value Types

Last bit is converting the raw string value into whatever type it's actually supposed to be:

```typescript
export function parseValue(value: string): any {
  value = value.replace(/^['"]|['"]$/g, ""); // Remove quotes

  // Inline arrays: [a, b, c]
  if (value.startsWith("[") && value.endsWith("]")) {
    const arrayContent = value.substring(1, value.length - 1);
    return arrayContent.split(",").map((item) => item.trim());
  }
  // Booleans
  else if (value === "true") return true;
  else if (value === "false") return false;
  // Numbers
  else if (!isNaN(Number(value)) && value !== "") {
    return Number(value);
  }
  // Strings
  else {
    return value;
  }
}
```

No real type inference magic, it's just "looks like a number → number, says true/false → boolean, otherwise → string." Does the job for what I need.

## Hooking It Up

After parsing, it all flows into the blog pages like this:

```typescript
export async function loadBlogMarkdown(path: string) {
  const response = await fetch(path);
  const markdown = await response.text();
  const { data, content } = extractFrontmatter(markdown);

  // Parse markdown content with marked.js
  const html = await marked.parse(content);

  return {
    frontmatter: data as BlogFrontmatter,
    content,
    html,
  };
}
```

And I've got a typed interface for it so I'm not just blindly accessing fields and hoping they exist:

```typescript
export interface BlogFrontmatter extends BaseFrontmatter {
  published_at: string;
  author: string;
  reading_time: number;
}
```

If a field's missing or typo'd, TypeScript yells at me before it ever becomes a runtime problem, which honestly saved me a couple times already.

## What I Learned

Parsing YAML-ish stuff is way less scary than I expected going in. Because it's indent-based you can basically just walk it line by line — the tricky part isn't really the logic, it's the edge cases, and since I control every file going into this I just don't have to handle most of them.

When something does break, I just go fix it instead of digging through someone else's GitHub issues trying to figure out if it's a known bug. That part's been nice.

## What It Doesn't Do

To be clear, this isn't a real YAML parser. It doesn't handle:

- comments
- multi-line strings
- anchors/aliases
- basically anything outside the small subset I needed

But for frontmatter on a personal blog, simple key-value pairs plus some nesting covers everything I throw at it.

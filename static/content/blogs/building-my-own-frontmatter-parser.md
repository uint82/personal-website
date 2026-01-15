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

When I started building this blog, everyone told me to use `gray-matter` for parsing frontmatter. It's the standard, it works, it's tested—why reinvent the wheel?

Well, because I wanted to know how the wheel works.

Plus, `gray-matter` pulls in a bunch of dependencies I don't need. For a simple blog with a handful of markdown files, that felt like overkill. So I built my own YAML frontmatter parser in about 200 lines of TypeScript.

Was it worth it? Absolutely.

## The Problem

Frontmatter is just YAML (or JSON) at the top of a markdown file, wrapped in `---` delimiters:

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

I needed to:

1. Extract the frontmatter block from markdown
2. Parse YAML-like syntax (objects, arrays, strings, numbers, booleans)
3. Handle nested structures
4. Support both inline arrays `[a, b, c]` and multi-line arrays

Libraries like `gray-matter` do this and more. But they also handle edge cases I don't care about, support multiple formats I won't use, and add weight I don't want.

## The Architecture

My parser has three main components:

### 1. Frontmatter Extraction

First, I use a regex to split the markdown into frontmatter and content:

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

Simple. If there's no frontmatter, return an empty object and the whole file as content.

### 2. Line-by-Line Parsing

YAML is indent-based, so I parse it line by line, tracking indentation to understand structure:

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

The trick is looking ahead. If a key has no inline value, check the next line to determine if it's an object or array.

### 3. Recursive Parsing

For nested objects and arrays, I use recursive functions that track indentation levels:

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

The same pattern works for arrays. Start at a base indentation, parse everything at that level or deeper, and stop when you encounter a line with less indentation.

### 4. Value Type Detection

Finally, I need to convert string values to their proper types:

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

No fancy type inference, just the basics. If it looks like a number, it's a number. If it says "true", it's a boolean. Everything else is a string.

## Integration

Once parsed, the frontmatter flows into my blog and project pages:

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

Type-safe frontmatter interfaces ensure I'm accessing the right fields:

```typescript
export interface BlogFrontmatter extends BaseFrontmatter {
  published_at: string;
  author: string;
  reading_time: number;
}
```

No runtime surprises. If a field is missing, TypeScript tells me at compile time.

## What I Learned

**Parsing is easier than you think.** YAML's indent-based structure is actually straightforward to parse line-by-line. The hardest part is handling all the edge cases—but if you control the input format, you don't need to handle every edge case.

**Dependencies have a cost.** `gray-matter` works great, but it's 20KB minified with several dependencies. My parser is 6KB with zero dependencies. For a static site, that matters.

**Understanding your tools makes debugging trivial.** When something breaks, I don't need to dig through library source code or search GitHub issues. I know exactly how my parser works because I wrote it.

## Trade-offs

This isn't a silver bullet. My parser doesn't handle:

- Comments in YAML
- Multi-line strings
- Anchors and aliases
- YAML's full spec

But I don't need those features. For blog frontmatter, simple key-value pairs, objects, and arrays are enough.

If I needed a full YAML parser, I'd use a library. But for this specific use case, a custom solution is smaller, faster, and easier to maintain.

## The Takeaway

Not everything needs a library. Sometimes the "reinventing the wheel" approach teaches you more than using the standard solution.

Next time you reach for a package, ask yourself: "Do I need all of this?" If the answer is no, try building it yourself. You might learn something.

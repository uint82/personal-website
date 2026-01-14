import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { extractFrontmatter, type BaseFrontmatter } from "./base";

export interface BlogFrontmatter extends BaseFrontmatter {
  published_at: string;
  author: string;
  reading_time: number;
}

export interface BlogMarkdownContent {
  frontmatter: BlogFrontmatter;
  content: string;
  html: string;
}

const marked = new Marked(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

export async function loadBlogMarkdown(
  path: string,
): Promise<BlogMarkdownContent | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load blog markdown: ${response.statusText}`);
    }

    const markdown = await response.text();
    const { data, content } = extractFrontmatter(markdown);

    const html = await marked.parse(content);

    return {
      frontmatter: data as BlogFrontmatter,
      content,
      html,
    };
  } catch (error) {
    console.error("Error loading blog markdown:", error);
    return null;
  }
}

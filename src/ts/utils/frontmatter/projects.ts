import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { extractFrontmatter, type BaseFrontmatter } from "./base";

export interface ProjectFrontmatter extends BaseFrontmatter {
  date: string;
  published: boolean;
  featured: boolean;
  image: {
    url: string;
    alt: string;
  };
  links: Array<{
    text: string;
    url: string;
    icon: string;
  }>;
}

export interface ProjectMarkdownContent {
  frontmatter: ProjectFrontmatter;
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

export async function loadProjectMarkdown(
  path: string,
): Promise<ProjectMarkdownContent | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(
        `Failed to load project markdown: ${response.statusText}`,
      );
    }

    const markdown = await response.text();
    const { data, content } = extractFrontmatter(markdown);

    const html = await marked.parse(content);

    return {
      frontmatter: data as ProjectFrontmatter,
      content,
      html,
    };
  } catch (error) {
    console.error("Error loading project markdown:", error);
    return null;
  }
}

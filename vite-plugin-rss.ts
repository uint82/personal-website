import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
import { marked } from "marked";
import { extractFrontmatter } from "./src/ts/utils/frontmatter/base";

const SITE_URL = "https://abroor.vercel.app";
const SITE_TITLE = "Abroor's blog";
const SITE_DESCRIPTION = "Log files containing a lot of nonsense will be generated here intermittently.";
const AUTHOR_NAME = "Hilmi Abroor";
const AUTHOR_EMAIL = "abroorhilmi@gmail.com";

const blogsIndex = [
  { slug: "building-my-own-frontmatter-parser", path: "static/content/blogs/building-my-own-frontmatter-parser.md" },
  { slug: "my-first-post", path: "static/content/blogs/my-first-post.md" },
  { slug: "data-driven-mistakes", path: "static/content/blogs/data-driven-mistakes.md" },
  { slug: "building-spa-routing-from-scratch", path: "static/content/blogs/spa-routing.md" },
  { slug: "building-drawbook-without-backend", path: "static/content/blogs/building-drawbook-without-backend.md" },
  { slug: "embracing-simplicity-a-journey-in-software-customization", path: "static/content/blogs/embracing-simplicity-a-journey-in-software-customization.md" },
  { slug: "declutter-your-html-svg-icons-paths", path: "static/content/blogs/declutter-your-html-svg-icons-paths.md" },
  { slug: "my-journey-to-daily-drive-linux", path: "static/content/blogs/my-journey-to-daily-driving-linux.md" },
  { slug: "moving-the-windows-users-directory-to-another-partition", path: "static/content/blogs/moving-the-windows-users-directory-to-another-partition.md" },
  { slug: "managing-android-permissions-via-adb", path: "static/content/blogs/managing-android-permissions-via-adb.md" },
  { slug: "why-i-use-neovim", path: "static/content/blogs/why-i-use-neovim.md"},
  { slug: "what-is-cloudflare-durable-object", path: "static/content/blogs/what-is-cloudflare-durable-object.md"}
];

function toRFC822(dateStr: string): string {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function makeAbsoluteUrls(html: string): string {
  return html
    .replace(/href="(?!http|mailto|#)([^"]+)"/g, `href="${SITE_URL}/$1"`)
    .replace(/src="(?!http)([^"]+)"/g, `src="${SITE_URL}/$1"`);
}

interface BlogEntry {
  slug: string;
  title: string;
  description: string;
  published_at: string;
  tags: string[];
  html: string;
}

function generateRSS(blogs: BlogEntry[]): string {
  const items = blogs
    .map(
      (blog) => `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${SITE_URL}/blogs/${blog.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blogs/${blog.slug}</guid>
      <description>${escapeXml(blog.description)}</description>
      <author>${AUTHOR_EMAIL} (${AUTHOR_NAME})</author>
      <pubDate>${toRFC822(blog.published_at)}</pubDate>
      ${blog.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n      ")}
      <content:encoded><![CDATA[${makeAbsoluteUrls(blog.html)}]]></content:encoded>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <managingEditor>${AUTHOR_EMAIL} (${AUTHOR_NAME})</managingEditor>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

export default function rssPlugin(): Plugin {
  return {
    name: "vite-plugin-rss",
    apply: "build",

    async buildStart() {
      const blogs: BlogEntry[] = [];

      for (const blog of blogsIndex) {
        const filePath = path.resolve(process.cwd(), blog.path);

        if (!fs.existsSync(filePath)) {
          console.warn(`[rss] File not found: ${filePath}`);
          continue;
        }

        const markdown = fs.readFileSync(filePath, "utf-8");
        const { data, content } = extractFrontmatter(markdown);

        if (data.draft) continue;

        const html = await marked.parse(content);

        blogs.push({
          slug: blog.slug,
          title: data.title?.text ?? blog.slug,
          description: data.description ?? "",
          published_at: data.published_at ?? "",
          tags: data.tags ?? [],
          html,
        });
      }

      blogs.sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime(),
      );

      const rss = generateRSS(blogs);
      const outPath = path.resolve(process.cwd(), "static/rss.xml");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, rss, "utf-8");

      console.log(`[rss] Generated static/rss.xml with ${blogs.length} posts`);
    },
  };
}

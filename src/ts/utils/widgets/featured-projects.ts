import { loadProjectMarkdown } from "../frontmatter/projects";
import { projectsIndex } from "../../content/projects-index";
import { getTagStyle } from "./tag-colors";

export interface FeaturedProject {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
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

export async function loadFeaturedProjects(
  limit: number = 2,
): Promise<FeaturedProject[]> {
  const featuredProjects: FeaturedProject[] = [];

  for (const project of projectsIndex) {
    const result = await loadProjectMarkdown(project.path);

    if (result && result.frontmatter.featured && result.frontmatter.published) {
      featuredProjects.push({
        slug: project.slug,
        title: result.frontmatter.title.text,
        description: result.frontmatter.description,
        date: result.frontmatter.date,
        tags: result.frontmatter.tags,
        image: result.frontmatter.image,
        links: result.frontmatter.links,
      });

      if (featuredProjects.length >= limit) {
        break;
      }
    }
  }

  return featuredProjects;
}

export function renderFeaturedProjects(projects: FeaturedProject[]): string {
  if (projects.length === 0) {
    return '<p class="text-gray-500">No featured projects available.</p>';
  }

  return projects
    .map(
      (project) => `
    <div class="featured-project-card" data-slug="${project.slug}">
      <img
        src="${project.image.url}"
        alt="${project.image.alt}"
        class="project-image"
        style="view-transition-name: project-img-${project.slug}"
      />

      <div class="project-info">
        <h3
          class="project-name"
          style="view-transition-name: project-title-${project.slug}"
        >
          ${project.title}
        </h3>

        <p class="project-description">${project.description}</p>
        <div class="project-tags">
          <i class="fa-solid fa-tag"></i>${project.tags
          .map(
            (tag) =>
              `<span class="tag" style="${getTagStyle(tag)}">${tag}</span>`,
          )
          .join("")}
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

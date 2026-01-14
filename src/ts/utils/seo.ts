const SITE_NAME = "Hilmi Abroor";
const TAGLINE = "Full stack developer";

const capitalize = (str: string) =>
  str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const titleMap: Record<string, string> = {
  "/": `${SITE_NAME} | ${TAGLINE}`,
  "/about": "About",
  "/blogs": "Blogs",
  "/projects": "Projects",
  "/guestbook": "Guestbook",
  "/drawbook": "Drawbook",
};

export function getDynamicTitle(
  path: string,
  params?: Record<string, string>,
): string {
  if (path === "/") {
    return titleMap["/"];
  }

  if (params?.slug) {
    const readableSlug = params.slug.replace(/-/g, " ");
    return `${capitalize(readableSlug)} | ${SITE_NAME}`;
  }

  const pageName = titleMap[path];
  if (pageName) {
    return `${pageName} | ${SITE_NAME}`;
  }

  return `404 | ${SITE_NAME}`;
}

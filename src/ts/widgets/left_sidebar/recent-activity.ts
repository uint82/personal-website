const GITHUB_USERNAME = import.meta.env.VITE_GITHUB_USERNAME || "uint82";
const WORKER_URL = import.meta.env.VITE_RECENT_ACTIVITY_URL || "";

const COMMITS_ENDPOINT = `${WORKER_URL}/api/github/v2/commits/latest?username=${GITHUB_USERNAME}&limit=4`;

interface Language {
  size: number;
  name: string;
  color: string;
}

interface Commit {
  repo: string;
  additions: number;
  deletions: number;
  commitUrl: string;
  committedDate: string;
  oid: string;
  messageHeadline: string;
  messageBody: string;
}

interface ApiResponse {
  commits: Commit[];
  languages: Language[];
  stats: {
    totalAdditions: number;
    totalDeletions: number;
    totalCommits: number;
  };
}

let loadingEl: HTMLElement;
let errorEl: HTMLElement;
let contentEl: HTMLElement;
let commitsListEl: HTMLElement;

function init() {
  loadingEl = document.getElementById("activity-loading") as HTMLElement;
  errorEl = document.getElementById("activity-error") as HTMLElement;
  contentEl = document.getElementById("activity-content") as HTMLElement;
  commitsListEl = document.getElementById("commits-list") as HTMLElement;

  if (!loadingEl || !errorEl || !contentEl || !commitsListEl) {
    console.error("Required elements not found");
    return;
  }

  fetchCommits();
}

async function fetchCommits() {
  try {
    const response = await fetch(COMMITS_ENDPOINT);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(`GitHub user '${GITHUB_USERNAME}' not found`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    displayCommits(data.commits.slice(0, 4), data.languages);

    loadingEl.style.display = "none";
    contentEl.style.display = "block";
  } catch (error) {
    console.error("Failed to fetch commits:", error);
    showError();
  }
}

function displayCommits(commits: Commit[], languages: Language[]) {
  commitsListEl.innerHTML = "";

  commits.forEach((commit) => {
    const commitEl = createCommitElement(commit);
    commitsListEl.appendChild(commitEl);
  });

  const languageBar = createLanguageBreakdown(languages);
  const footer = document.querySelector(".activity-footer") as HTMLElement;
  if (footer) {
    const existing = footer.querySelector(".language-breakdown");
    if (existing) existing.remove();
    footer.appendChild(languageBar);
  }
}

function createCommitElement(commit: Commit): HTMLElement {
  const commitItem = document.createElement("div");
  commitItem.className = "commit-item";

  const commitHeader = document.createElement("div");
  commitHeader.className = "commit-header";

  const commitSha = document.createElement("span");
  commitSha.className = "commit-sha";
  commitSha.textContent = commit.oid;

  const commitDate = document.createElement("span");
  commitDate.className = "commit-date";
  commitDate.textContent = formatDate(commit.committedDate);

  commitHeader.appendChild(commitSha);
  commitHeader.appendChild(commitDate);

  const commitMessage = document.createElement("div");
  commitMessage.className = "commit-message";

  const messageText = document.createElement("span");
  messageText.textContent = commit.messageHeadline;

  const changesEl = document.createElement("span");
  changesEl.className = "commit-changes";

  const additions = document.createElement("span");
  additions.className = "additions";
  additions.textContent = `+${commit.additions}`;

  const separator = document.createElement("span");
  separator.className = "separator";
  separator.textContent = "/";

  const deletions = document.createElement("span");
  deletions.className = "deletions";
  deletions.textContent = `-${commit.deletions}`;

  changesEl.appendChild(additions);
  changesEl.appendChild(separator);
  changesEl.appendChild(deletions);

  commitMessage.appendChild(messageText);
  commitMessage.appendChild(document.createTextNode(" "));
  commitMessage.appendChild(changesEl);

  commitItem.appendChild(commitHeader);
  commitItem.appendChild(commitMessage);

  commitItem.style.cursor = "pointer";
  commitItem.addEventListener("click", () => {
    window.open(commit.commitUrl, "_blank", "noopener,noreferrer");
  });

  return commitItem;
}

function createLanguageBreakdown(languages: Language[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "language-breakdown";

  const totalSize = languages.reduce((sum, lang) => sum + lang.size, 0);

  languages.forEach((lang) => {
    const percentage = (lang.size / totalSize) * 100;

    const segment = document.createElement("div");
    segment.className = "language-segment";
    segment.style.width = `${percentage}%`;
    segment.style.backgroundColor = lang.color;

    segment.title = `${lang.name}: ${percentage.toFixed(1)}%`;

    container.appendChild(segment);
  });

  return container;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  }
}

function showError() {
  loadingEl.style.display = "none";
  errorEl.style.display = "block";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

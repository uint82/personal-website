import changelog from "../../../../static/content/changelog/changelog.json";

function renderText(text: string): string {
  return text.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function render() {
  const container = document.getElementById("changelog-content");
  if (!container) {
    console.error("changelog-content element not found");
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const entry of changelog) {
    const entryEl = document.createElement("div");
    entryEl.className = "changelog-entry";

    const header = document.createElement("div");
    header.className = "changelog-header";
    header.innerHTML = `
      <span class="changelog-version">${entry.version}</span>
      <span class="changelog-date">${entry.date}</span>
    `;

    const list = document.createElement("ul");
    list.className = "changelog-list";

    for (const change of entry.changes) {
      const item = document.createElement("li");
      item.className = `changelog-${change.type}`;
      item.innerHTML = renderText(change.text);
      list.appendChild(item);
    }

    entryEl.appendChild(header);
    entryEl.appendChild(list);
    fragment.appendChild(entryEl);
  }

  container.appendChild(fragment);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render);
} else {
  render();
}

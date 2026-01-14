interface WordConfig {
  size: number;
  colored: boolean;
  italic: boolean;
  color?: string;
}

const ACCENT_COLORS = [
  "var(--slab-rosewater)",
  "var(--slab-flamingo)",
  "var(--slab-pink)",
  "var(--slab-mauve)",
  "var(--slab-red)",
  "var(--slab-maroon)",
  "var(--slab-peach)",
  "var(--slab-yellow)",
  "var(--slab-green)",
  "var(--slab-teal)",
  "var(--slab-sky)",
  "var(--slab-sapphire)",
  "var(--slab-blue)",
  "var(--slab-lavender)",
];

const GRAYSCALE_COLORS = [
  "var(--slab-text)",
  "var(--slab-subtext1)",
  "var(--slab-subtext0)",
  "var(--slab-overlay2)",
];

// simple hash function
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// track word counts for view transition uniqueness
const wordCounts = new Map<string, number>();

function getViewTransitionName(word: string, slug: string): string {
  const safePath = slug.split("/").pop() || slug;
  const normalized = word.toLowerCase().replace(/[^a-z0-9\s-_]/g, "");
  const count = wordCounts.get(normalized) || 0;
  wordCounts.set(normalized, count + 1);
  return `_${safePath}__${normalized}${count > 0 ? "___" + count : ""}`;
}

function getColor(index: number, colored: boolean, seed: string): string {
  const h = hashCode(seed + index);
  if (colored) {
    return ACCENT_COLORS[h % ACCENT_COLORS.length];
  } else {
    return GRAYSCALE_COLORS[h % GRAYSCALE_COLORS.length];
  }
}

export function generateSlabTitleHtml(
  title: string,
  configStr: string = "",
  slug: string,
): string {
  // reset counts for new render
  wordCounts.clear();

  const words = title.split(" ");
  const colorHash = slug; // using slug as the hash seed

  // parse Config
  const configsRaw = configStr.split(/\s+/).filter(Boolean);

  const wordConfigs: WordConfig[] = configsRaw.length
    ? configsRaw.map((cfg) => {
      const colorMatch = cfg.match(/\[(#(?:[0-9a-fA-F]{3,8}))\]/);
      const cleanedCfg = colorMatch ? cfg.replace(colorMatch[0], "") : cfg;
      const sizeMatch = cleanedCfg.match(/^([\d.]+)/);
      const size = sizeMatch ? parseFloat(sizeMatch[1]) : 3;
      const colored = cleanedCfg.includes("c") || Boolean(colorMatch);
      const italic = cleanedCfg.includes("i");

      return {
        size,
        colored,
        italic,
        color: colorMatch?.[1],
      };
    })
    : words.map(() => ({
      size: 3,
      colored: false,
      italic: false,
    }));

  // generate HTML for each word
  const wordsHtml = words
    .map((word, i) => {
      const config = wordConfigs[i] ?? {
        size: 3,
        colored: false,
        italic: false,
      };

      const vtName = getViewTransitionName(word, slug);
      const h = hashCode(colorHash + i);

      // determine styles
      const fontWeight = config.italic ? [300, 400, 500][h % 3] : 900;
      const fontStyle = config.italic ? "italic" : "normal";

      const color = config.color
        ? config.color
        : getColor(i, config.colored, colorHash);

      const style = `
        view-transition-name: ${vtName};
        font-size: ${config.size}rem;
        font-weight: ${fontWeight};
        color: ${color};
        font-style: ${fontStyle};
      `;

      const classes = `slab-word ${config.italic ? "slab-serif" : "slab-mono"}`;

      return `<span class="${classes}" style="${style}">${word}</span>`;
    })
    .join("");

  return `
    <div class="slab-title-container">
      ${wordsHtml}
    </div>
  `;
}

/**
 * self made tag Color generator
 * generates consistent colors for tags based on their word length
 */

export interface TagColor {
  background: string;
  text: string;
  border: string;
}

/**
 * generate a color dynamically based on tag length using HSL.
 */
export function getTagColor(tag: string): TagColor {
  const length = tag.length;

  // use a prime number (37) to distribute hues widely across the spectrum
  const hue = (length * 37) % 360;
  const saturation = 60 + (length % 3) * 5;
  const lightness = 45 + (length % 4) * 2;

  return {
    background: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: `hsl(${hue}, ${saturation}%, 98%)`,
    border: `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`,
  };
}

/**
 * generate CSS custom properties for a tag
 */
export function getTagStyle(tag: string): string {
  const colors = getTagColorFromPalette(tag);
  return `--tag-bg: ${colors.background}; --tag-text: ${colors.text}; --tag-border: ${colors.border};`;
}

/**
 * get color from a predefined palette based on length buckets.
 */
export function getTagColorFromPalette(tag: string): TagColor {
  const length = tag.length;

  const colorPalette = [
    { bg: "#FF6B6B", text: "#FF6B6B", border: "#CC5555" }, // Red
    { bg: "#4ECDC4", text: "#4ECDC4", border: "#3DA39C" }, // Teal
    { bg: "#45B7D1", text: "#45B7D1", border: "#3692A7" }, // Blue
    { bg: "#FFA07A", text: "#FFA07A", border: "#CC8062" }, // Salmon
    { bg: "#98D8C8", text: "#FFA07A", border: "#7AADA0" }, // Mint
    { bg: "#F7B731", text: "#F7B731", border: "#C69227" }, // Gold
    { bg: "#6C5CE7", text: "#6C5CE7", border: "#564AB9" }, // Purple
    { bg: "#A29BFE", text: "#A29BFE", border: "#827CCB" }, // Lavender
  ];

  // map length to palette index
  const index = Math.min(Math.floor((length - 1) / 2), colorPalette.length - 1);
  const color = colorPalette[index];

  return {
    background: color.bg,
    text: color.text,
    border: color.border,
  };
}

export function getTagLengthClass(tag: string): string {
  return `tag-length-${tag.length}`;
}

export function applyTagColor(
  element: HTMLElement,
  tag: string,
  usePalette: boolean = false,
): void {
  const colors = usePalette ? getTagColorFromPalette(tag) : getTagColor(tag);

  element.style.backgroundColor = colors.background;
  element.style.color = colors.text;
  element.style.borderColor = colors.border;
}

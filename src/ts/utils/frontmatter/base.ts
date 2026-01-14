/**
 * my homemade base YAML frontmatter parser
 * provides shared parsing utilities for both blogs and projects
 */

export interface BaseFrontmatter {
  title: {
    text: string;
    config?: string;
  };
  description: string;
  tags: string[];
  draft: boolean;
}

export interface ParseResult {
  data: any;
  content: string;
}

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

function parseFrontmatterText(frontmatterText: string): any {
  const data: any = {};
  const lines = frontmatterText.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const indent = line.length - line.trimLeft().length;

    // only process top-level keys (indent 0)
    if (indent === 0 && trimmed.includes(":")) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (value === "") {
        // this is either an object or array, check next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextTrimmed = nextLine.trim();

          if (nextTrimmed.startsWith("-")) {
            // it's an array
            const { result, lastIndex } = parseArray(lines, i + 1);
            data[key] = result;
            i = lastIndex;
          } else if (nextTrimmed.includes(":")) {
            // it's an object
            const { result, lastIndex } = parseObject(lines, i + 1);
            data[key] = result;
            i = lastIndex;
          } else {
            i++;
          }
        } else {
          i++;
        }
      } else {
        // inline value
        data[key] = parseValue(value);
        i++;
      }
    } else {
      i++;
    }
  }

  return data;
}

export function parseObject(
  lines: string[],
  startIndex: number,
): { result: any; lastIndex: number } {
  const obj: any = {};
  const baseIndent =
    lines[startIndex].length - lines[startIndex].trimLeft().length;

  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.length - line.trimLeft().length;

    if (!trimmed) {
      i++;
      continue;
    }

    // if we're back to a lower indent level, we're done with this object
    if (indent < baseIndent) {
      break;
    }

    // only process lines at our indent level
    if (indent === baseIndent && trimmed.includes(":")) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (value === "") {
        // nested object or array
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextTrimmed = nextLine.trim();

          if (nextTrimmed.startsWith("-")) {
            const { result, lastIndex } = parseArray(lines, i + 1);
            obj[key] = result;
            i = lastIndex;
          } else if (nextTrimmed.includes(":")) {
            const { result, lastIndex } = parseObject(lines, i + 1);
            obj[key] = result;
            i = lastIndex;
          } else {
            i++;
          }
        } else {
          i++;
        }
      } else {
        obj[key] = parseValue(value);
        i++;
      }
    } else {
      i++;
    }
  }

  return { result: obj, lastIndex: i };
}

export function parseArray(
  lines: string[],
  startIndex: number,
): { result: any[]; lastIndex: number } {
  const arr: any[] = [];
  const baseIndent =
    lines[startIndex].length - lines[startIndex].trimLeft().length;

  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.length - line.trimLeft().length;

    if (!trimmed) {
      i++;
      continue;
    }

    // if we're back to a lower indent level, we're done with this array
    if (indent < baseIndent) {
      break;
    }

    // process array items (lines starting with -)
    if (indent === baseIndent && trimmed.startsWith("-")) {
      const itemValue = trimmed.substring(1).trim();

      // Check if the next line is more indented (indicating this is an object)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextTrimmed = nextLine.trim();
        const nextIndent = nextLine.length - nextLine.trimLeft().length;

        // If next line is indented more AND contains a colon, this is an object
        if (nextIndent > indent && nextTrimmed.includes(":")) {
          const obj: any = {};

          // If there's a value on the same line as the dash, parse it as the first property
          if (itemValue !== "" && itemValue.includes(":")) {
            const colonIndex = itemValue.indexOf(":");
            const key = itemValue.substring(0, colonIndex).trim();
            const value = itemValue.substring(colonIndex + 1).trim();
            obj[key] = parseValue(value);
          }

          // parse the rest of the object properties
          const { result, lastIndex } = parseObject(lines, i + 1);
          Object.assign(obj, result);
          arr.push(obj);
          i = lastIndex;
        } else if (itemValue === "" && nextIndent > indent) {
          // empty dash, object on next line
          const { result, lastIndex } = parseObject(lines, i + 1);
          arr.push(result);
          i = lastIndex;
        } else {
          // simple inline value
          arr.push(parseValue(itemValue));
          i++;
        }
      } else {
        // last item, treat as inline value
        arr.push(parseValue(itemValue));
        i++;
      }
    } else {
      i++;
    }
  }

  return { result: arr, lastIndex: i };
}

export function parseValue(value: string): any {
  // remove quotes
  value = value.replace(/^['"]|['"]$/g, "");

  // handle inline arrays [...]
  if (value.startsWith("[") && value.endsWith("]")) {
    const arrayContent = value.substring(1, value.length - 1);
    return arrayContent
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""));
  }
  // handle booleans
  else if (value === "true") {
    return true;
  } else if (value === "false") {
    return false;
  }
  // handle numbers
  else if (!isNaN(Number(value)) && value !== "") {
    return Number(value);
  }
  // handle strings
  else {
    return value;
  }
}

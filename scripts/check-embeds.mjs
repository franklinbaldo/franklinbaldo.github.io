import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_ROOT = fileURLToPath(new URL("../src/content/blog/", import.meta.url));
const CONTENT_EXTENSIONS = new Set([".md", ".mdx"]);

async function* contentFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* contentFiles(fullPath);
      continue;
    }
    if (CONTENT_EXTENSIONS.has(path.extname(entry.name))) yield fullPath;
  }
}

function attribute(tag, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag);
  return match?.[1]?.trim() ?? "";
}

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function isYouTubeUrl(src) {
  try {
    const url = new URL(src);
    return ["youtube.com", "www.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(
      url.hostname.toLowerCase(),
    );
  } catch {
    return false;
  }
}

function isEmbedUrl(src) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && /^\/embed\/[^/]+/.test(url.pathname);
  } catch {
    return false;
  }
}

const failures = [];
let checked = 0;

for await (const file of contentFiles(CONTENT_ROOT)) {
  const source = await readFile(file, "utf8");
  const iframePattern = /<iframe\b[\s\S]*?>/gi;
  let match;

  while ((match = iframePattern.exec(source)) !== null) {
    const tag = match[0];
    const src = attribute(tag, "src");
    if (!isYouTubeUrl(src)) continue;

    checked += 1;
    const relative = path.relative(process.cwd(), file);
    const location = `${relative}:${lineNumber(source, match.index)}`;
    const title = attribute(tag, "title");
    const ariaLabel = attribute(tag, "aria-label");
    const loading = attribute(tag, "loading").toLowerCase();

    if (!isEmbedUrl(src)) {
      failures.push(`${location}: YouTube iframe must use an HTTPS /embed/ URL (${src || "missing src"})`);
    }
    if (!title && !ariaLabel) {
      failures.push(`${location}: YouTube iframe needs a non-empty title or aria-label`);
    }
    if (loading !== "lazy") {
      failures.push(`${location}: YouTube iframe must declare loading=\"lazy\"`);
    }
  }
}

if (failures.length) {
  console.error("YouTube embed guard failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`YouTube embed guard OK (${checked} raw embed${checked === 1 ? "" : "s"} checked).`);
}

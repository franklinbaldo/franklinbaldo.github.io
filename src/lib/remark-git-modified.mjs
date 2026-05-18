import { execFileSync } from "node:child_process";
import { relative, resolve } from "node:path";

const ROOT = process.cwd();

function lastModified(filePath) {
  try {
    const rel = relative(ROOT, resolve(filePath));
    // execFileSync (array form) skips the shell entirely — no
    // interpolation, no injection risk on funky filenames.
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", rel], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/**
 * Sets `lastModified` (ISO string) on each post's frontmatter, derived
 * from `git log`. Falls back silently when git isn't available.
 */
export function remarkGitModified() {
  return (_tree, file) => {
    const path = file.history?.[0] ?? file.path;
    if (!path) return;
    const iso = lastModified(path);
    if (iso) file.data.astro.frontmatter.lastModified = iso;
  };
}

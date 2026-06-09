import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { OUT_DIR, RATES_DIR } from "./posts.js";

export function listMatchFiles() {
  const out = [];
  const seen = new Set();
  for (const dir of [OUT_DIR, RATES_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/_x_.*\.md$/.test(f)) continue;
      if (seen.has(f)) continue;
      seen.add(f);
      out.push(path.join(dir, f));
    }
  }
  return out;
}

export function readMatch(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return { ...parsed, filePath };
}

export function writeMatch(filePath, frontmatter, body) {
  const out = matter.stringify(body, frontmatter);
  fs.writeFileSync(filePath, out);
}

export function postKey(side) {
  if (!side) return null;
  return side.key || side.slug || null;
}

// Returns the git commit timestamp (ms) of the last change to filePath,
// or 0 if the file is untracked or git is unavailable.
export function gitMtime(filePath) {
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%ct", "--", filePath],
      { stdio: ["ignore", "pipe", "ignore"] }
    )
      .toString()
      .trim();
    return out ? Number(out) * 1000 : 0;
  } catch {
    return 0;
  }
}

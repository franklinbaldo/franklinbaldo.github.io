import { execFileSync } from "node:child_process";
import { relative, resolve } from "node:path";

const ROOT = process.cwd();

function lastModified(filePath) {
  try {
    const rel = relative(ROOT, resolve(filePath));
    // execFileSync (array form) skips the shell entirely — no
    // interpolation, no injection risk on funky filenames.
    // --follow tracks the file across renames (RFC 0010 migrated every
    // index.* to v-*); pure-rename commits (status R100) are skipped so a
    // rename alone never counts as a content modification.
    const out = execFileSync(
      "git",
      [
        "log",
        "--follow",
        "--name-status",
        "-M",
        "--format=%x00%cI",
        "-n",
        "10",
        "--",
        rel,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 5_000,
      }
    );
    for (const block of out.split("\u0000")) {
      const lines = block.trim().split("\n").filter(Boolean);
      if (lines.length === 0) continue;
      const [iso, ...statuses] = lines;
      // Skip commits where every changed entry is either:
      // - R100: identical content (pure rename, no edits), or
      // - RFC 0010 migration pattern: index.* → v-* rename that also stamped
      //   draftCreatedAt (reducing similarity to ~R080–R099). Detected by the
      //   specific old→new path shapes, so future renames with small edits are
      //   still captured as content modifications.
      const pureRename =
        statuses.length > 0 &&
        statuses.every((l) => {
          if (!l.startsWith("R")) return false;
          if (l.startsWith("R100")) return true;
          const parts = l.split("\t");
          return (
            parts.length >= 3 &&
            /\/index\.mdx?$/.test(parts[1]) &&
            /\/v-[^/]+\.mdx?$/.test(parts[2])
          );
        });
      if (!pureRename) return iso.trim() || null;
    }
    return null;
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

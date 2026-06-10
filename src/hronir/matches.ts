import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { OUT_DIR, RATES_DIR } from "./posts.js";

export function listMatchFiles(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
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

export function readMatch(filePath: string): {
  data: Record<string, unknown>;
  content: string;
  filePath: string;
} {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  // Rate files written on Windows carry backslash separators in
  // post_a/b.path; normalize to POSIX so existsSync and key lookups work
  // on Linux CI. decide() re-persists via writeMatch, so files self-heal.
  for (const sideName of ["post_a", "post_b"]) {
    const side = (parsed.data as Record<string, unknown>)[sideName] as
      | { path?: unknown }
      | undefined;
    if (side && typeof side.path === "string") {
      side.path = side.path.replace(/\\/g, "/");
    }
  }
  return { ...parsed, filePath };
}

export function writeMatch(
  filePath: string,
  frontmatter: Record<string, unknown>,
  body: string
): void {
  const out = matter.stringify(body, frontmatter);
  fs.writeFileSync(filePath, out);
}

export function postKey(
  side: { key?: string; slug?: string } | null | undefined
): string | null {
  if (!side) return null;
  return side.key || side.slug || null;
}

export function gitMtime(filePath: string): number {
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

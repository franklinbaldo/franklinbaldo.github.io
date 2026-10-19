// An independent SSG input projection run AFTER canonical posts are prepared.
// It does not modify the original Markdown, Zola source, or production deploy.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { markdownDocument } from "./prepare.mjs";
import { planRedirects } from "./redirects.mjs";

export const ROOT = resolve(".");
export const INPUT = resolve(ROOT, ".cache/ssg-native");
const CONTENT = resolve(INPUT, "content");

function safeWrite(relative, data) {
  const out = resolve(CONTENT, relative);
  if (!out.startsWith(CONTENT + sep)) throw new Error("Unsafe redirect input destination");
  if (existsSync(out)) throw new Error("Historical redirect would overwrite authored SSG content: " + relative);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, data);
}

export function prepareRedirects() {
  const original = JSON.parse(readFileSync(resolve(INPUT, "manifest.json"), "utf8"));
  const legacy = JSON.parse(readFileSync(resolve(ROOT, "src/generated/blog-redirects.json"), "utf8"));
  const knownTargets = [
    "/", "/pt/",
    ...(original.projects?.routes ?? []),
    ...(original.archive?.pages ?? []),
  ];
  const planned = planRedirects({
    entries: original.entries,
    legacy,
    knownTargets,
  });
  for (const page of planned.pages) {
    safeWrite(page.target, markdownDocument(page.metadata, "This address has moved.\n"));
  }
  const report = {
    schema: "ssg-redirect-manifest-v1",
    published_post_routes: planned.published_post_routes,
    legacy_alias_count: planned.legacy_routes,
    total_candidates: planned.total_candidates,
    generated_count: planned.pages.length,
    skipped_count: planned.excluded.length,
    skipped_by_reason: Object.fromEntries(
      [...new Set(planned.excluded.map((r) => r.reason))].map((reason) =>
        [reason, planned.excluded.filter((r) => r.reason === reason).length])
    ),
    redirects: planned.pages.map(({ from, to }) => ({ from, to })),
    excluded: planned.excluded,
  };
  writeFileSync(resolve(INPUT, "redirects.json"), JSON.stringify(report, null, 2) + "\n");
  console.log("SSG redirect projection: " + report.generated_count +
    " published aliases, " + report.skipped_count + " excluded (no private or unavailable targets)");
  if (!report.generated_count) throw new Error("SSG historical redirect projection unexpectedly empty");
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { prepareRedirects(); } catch (error) { console.error(error); process.exitCode = 1; }
}

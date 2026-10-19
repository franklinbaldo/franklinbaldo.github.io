// Translate SSG's raw native quality gate into a compact, actionable
// per-pillar report. Do not silently equate its site-specific checks with WCAG.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function summarize(report, maxExamples = 5) {
  if (!report || !Number.isInteger(report.pages_scanned) ||
      !Number.isInteger(report.total_issues) || !report.pillars ||
      typeof report.pillars !== "object")
    throw new Error("Invalid native SSG quality-gate report");

  const pillarStats = Object.entries(report.pillars).map(([name, result]) => {
    if (!Array.isArray(result.issues) || typeof result.pass !== "boolean")
      throw new Error("Invalid native quality pillar: " + name);
    return {
      name,
      passed: result.pass,
      issue_count: result.issues.length,
      examples: result.issues.slice(0, maxExamples),
    };
  }).sort((a, b) => b.issue_count - a.issue_count ||
    a.name.localeCompare(b.name));

  const actual = pillarStats.reduce((sum, pillar) => sum + pillar.issue_count, 0);
  if (actual !== report.total_issues)
    throw new Error("Native quality-gate totals disagree: report=" +
      report.total_issues + " counted=" + actual);
  return {
    schema: "ssg-quality-summary-v1",
    pages_scanned: report.pages_scanned,
    passed_pillars: report.passed_pillars,
    total_pillars: report.total_pillars,
    total_issues: report.total_issues,
    failed_pillars: pillarStats.filter((p) => !p.passed).map((p) => p.name),
    issues_by_pillar: pillarStats,
    note: "These are native SSG quality checks; their applicability to the blog must be examined before making them strict. WCAG browser audits remain separate.",
  };
}

function main() {
  const file = resolve("dist-ssg/quality-gate-report.json");
  if (!existsSync(file)) throw new Error("No SSG quality report at " + file);
  const report = summarize(JSON.parse(readFileSync(file, "utf8")));
  const out = resolve(".cache/ssg-native/quality-summary.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({
    pages_scanned: report.pages_scanned,
    passed_pillars: report.passed_pillars,
    total_pillars: report.total_pillars,
    total_issues: report.total_issues,
    worst_pillars: report.issues_by_pillar.slice(0, 4).map(({name, issue_count})=>({name, issue_count})),
  }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
}

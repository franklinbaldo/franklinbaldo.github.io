import test from "node:test";
import assert from "node:assert/strict";
import { verifyProjectsHtml } from "./verify-projects.mjs";

const sample = {
  schemaVersion: "repo-factory-v1", owner: "franklinbaldo",
  privacy: "public repositories only",
  generatedAt: "2026-10-01T00:00:00Z",
  totals: { repositories: 1 },
  repositories: [{ name: "alpha", fullName: "franklinbaldo/alpha",
    url: "https://github.com/franklinbaldo/alpha" }],
};
const html = '<!doctype html><html lang="en"><head><title>Projects</title></head><body><main><h1>Projects</h1><p>2026-10-01</p><ul><li><a href="https://github.com/franklinbaldo/alpha">alpha</a></li></ul></main></body></html>';

test("native SSG project HTML must contain exact links and snapshot provenance", () => {
  assert.equal(verifyProjectsHtml(html, sample).repository_links, 1);
  assert.throws(() => verifyProjectsHtml(html.replace("/alpha", "/zeta"), sample), /links differ/);
  assert.throws(() => verifyProjectsHtml(html.replace("2026-10-01", "2026-10-02"), sample), /provenance date/);
  assert.throws(() => verifyProjectsHtml(html, sample, "pt"), /wrong HTML language/);
});

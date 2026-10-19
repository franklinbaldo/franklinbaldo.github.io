import test from "node:test";
import assert from "node:assert/strict";
import { projectSnapshot, renderProjects, escapeMarkdown } from "./projects.mjs";

const fixture = () => ({
  schemaVersion: "repo-factory-v1",
  owner: "franklinbaldo",
  privacy: "public repositories only",
  generatedAt: "2026-10-01T00:00:00Z",
  totals: { repositories: 2 },
  repositories: [
    { name: "zeta", fullName: "franklinbaldo/zeta",
      url: "https://github.com/franklinbaldo/zeta",
      description: "A [test]* repo", language: "Rust" },
    { name: "alpha", fullName: "franklinbaldo/alpha",
      url: "https://github.com/franklinbaldo/alpha",
      description: "A second one", language: "TypeScript" },
  ],
});

test("canonical public snapshot renders bilingual SSG markdown, not HTML", () => {
  const result = renderProjects(fixture());
  assert.equal(result.count, 2);
  assert.equal(result.pages.length, 2);
  assert.equal(result.pages[0].route, "/projects/");
  assert.equal(result.pages[1].route, "/pt/projects/");
  assert.equal(result.pages[0].metadata.translation_key, "projects-index");
  assert.equal(result.pages[1].metadata.translation_key, "projects-index");
  assert.ok(result.pages[0].body.indexOf("alpha") < result.pages[0].body.indexOf("zeta"));
  assert.match(result.pages[0].body, /Snapshot from \*\*2026-10-01\*\*/);
  assert.ok(result.pages[0].body.includes("A \\[test\\]\\* repo"));
  assert.match(result.pages[1].body, /Repositórios públicos/);
  assert.doesNotMatch(result.pages[0].body, /<html/);
});
test("markdown escaping prevents injected headings and links", () => {
  assert.equal(escapeMarkdown("X [evil]*"), "X \\[evil\\]\\*");
});
test("snapshot must explicitly be public, complete and internally consistent", () => {
  const invalid = fixture();
  invalid.privacy = "unknown";
  assert.throws(() => projectSnapshot(invalid), /nonpublic/);
  const mismatch = fixture();
  mismatch.totals.repositories = 15;
  assert.throws(() => projectSnapshot(mismatch), /mismatched/);
});
test("URL, visibility and identity must be canonical", () => {
  for (const change of [
    { url: "https://evil.example/franklinbaldo/zeta" },
    { url: "http://github.com/franklinbaldo/zeta" },
    { url: "https://github.com/franklinbaldo/zeta?token=secret" },
    { visibility: "private" },
    { private: true },
    { fullName: "another-owner/zeta" },
  ]) {
    const value = fixture();
    Object.assign(value.repositories[0], change);
    assert.throws(() => projectSnapshot(value), /Invalid|nonpublic|Unsafe/);
  }
});

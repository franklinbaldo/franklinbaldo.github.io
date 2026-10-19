import test from "node:test";
import assert from "node:assert/strict";
import { summarize } from "./quality-summary.mjs";

test("native quality report summarises most common failures first", () => {
  const source = {
    pages_scanned: 5, total_issues: 4, passed_pillars: 1,
    total_pillars: 2,
    pillars: {
      "A11y": { pass: false, issues: ["p1", "p2", "p3"] },
      "SEO": { pass: false, issues: ["p4"] },
    },
  };
  const result = summarize(source, 2);
  assert.equal(result.total_issues, 4);
  assert.equal(result.issues_by_pillar[0].name, "A11y");
  assert.deepEqual(result.issues_by_pillar[0].examples, ["p1", "p2"]);
  assert.equal(result.issues_by_pillar[0].issue_count, 3);
});

test("native quality report rejects misleading totals and malformed data", () => {
  assert.throws(() => summarize({}), /Invalid/);
  assert.throws(() => summarize({
    pages_scanned: 2, total_issues: 3,
    pillars: { A11y: { pass: false, issues: ["one"] } },
  }), /disagree/);
});

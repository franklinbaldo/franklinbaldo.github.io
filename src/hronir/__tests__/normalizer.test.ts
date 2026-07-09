import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  normalizeMatch,
  classifyKind,
  matchId,
  type LoadedMatch,
} from "../matches.js";

// RFC 0012 Fase 1 — the single normalizer. These exercise the real
// normalizeMatch (no module mock; this file runs in its own test process) so
// the work/version classification, slug@uuid refs, language fallback and the
// validity filters are pinned in one place.

const FIXdir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "rate-files"
);
const load = (name: string): LoadedMatch => {
  const { data, content } = matter(
    fs.readFileSync(path.join(FIXdir, name), "utf8")
  );
  const lm = normalizeMatch(data, content, name);
  assert.ok(lm, `normalizeMatch returned null for fixture ${name}`);
  return lm;
};

describe("classifyKind", () => {
  it("same key → version, different keys → work", () => {
    assert.equal(classifyKind("a", "a"), "version");
    assert.equal(classifyKind("a", "b"), "work");
  });
});

describe("normalizeMatch — fixtures", () => {
  it("stars-v1 work duel: legacy, no review_lang", () => {
    const lm = load("work-stars-v1.md");
    assert.equal(lm.norm.kind, "work");
    assert.equal(lm.norm.winnerSide, "a");
    assert.equal(lm.norm.postA.key, "alpha-essay");
    assert.equal(lm.norm.postB.key, "beta-essay");
    assert.equal(lm.norm.reviewLang, null);
    assert.equal(lm.norm.rateA, 4.5);
    assert.ok(lm.norm.runAt instanceof Date);
  });

  it("stars-v2 work duel: review_lang falls back to eval_lang", () => {
    const lm = load("work-stars-v2.md");
    assert.equal(lm.norm.kind, "work");
    assert.equal(lm.norm.winnerSide, "b");
    assert.equal(lm.norm.reviewLang, "en");
    assert.equal(lm.norm.perspectiveId, "o-cetico");
    assert.equal(lm.norm.evaluatorMood, "Comecei curioso, meio cansado.");
  });

  it("stars-v3 work duel: review_lang + per-side content_lang", () => {
    const lm = load("work-stars-v3.md");
    assert.equal(lm.norm.kind, "work");
    assert.equal(lm.norm.reviewLang, "pt");
    assert.equal(lm.norm.postA.contentLang, "en");
    assert.equal(lm.norm.postB.contentLang, "pt");
  });

  it("stars-v3 version duel: kind version + slug@uuid refs", () => {
    const lm = load("version-stars-v3.md");
    assert.equal(lm.norm.kind, "version");
    assert.equal(lm.norm.winnerSide, "b");
    assert.equal(lm.norm.postA.key, "alpha-essay");
    assert.equal(lm.norm.postB.key, "alpha-essay");
    assert.equal(lm.norm.postA.ref, "alpha-essay@v-2026-06-09T20-24-29");
    assert.equal(lm.norm.postB.ref, "alpha-essay@v-2026-06-11T08-25-46");
  });

  it("id is matchId(aKey, bKey, runAtRaw)", () => {
    const lm = load("work-stars-v3.md");
    assert.equal(
      lm.norm.id,
      matchId(lm.norm.postA.key, lm.norm.postB.key, lm.runAtRaw)
    );
  });
});

describe("normalizeMatch — validity filters", () => {
  const base = {
    post_a: { key: "a", path: "a.md" },
    post_b: { key: "b", path: "b.md" },
    run_at: "2024-01-01T00:00:00Z",
    winner: "a",
  };

  it("returns null for TODO / missing winner", () => {
    assert.equal(normalizeMatch({ ...base, winner: "TODO" }, "", "x"), null);
    assert.equal(normalizeMatch({ ...base, winner: undefined }, "", "x"), null);
  });

  it("override flips the resolved winner", () => {
    const lm = normalizeMatch({ ...base, override: "b" }, "", "x");
    assert.ok(lm, "expected a normalized match");
    assert.equal(lm.norm.winnerSide, "b");
  });

  it("returns null when a key is missing", () => {
    assert.equal(
      normalizeMatch({ ...base, post_b: { path: "b.md" } }, "", "x"),
      null
    );
  });

  it("keeps run_id-only timestamps as runAtRaw, runAt null when unparseable", () => {
    const lm = normalizeMatch(
      { ...base, run_at: undefined, run_id: "2024-01-01T00-00-00-000" },
      "",
      "x"
    );
    assert.ok(lm, "expected a normalized match");
    assert.equal(lm.runAtRaw, "2024-01-01T00-00-00-000");
    assert.equal(lm.norm.runAt, null);
  });
});

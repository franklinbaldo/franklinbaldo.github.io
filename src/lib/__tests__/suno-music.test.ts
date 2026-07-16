import { test } from "node:test";
import assert from "node:assert/strict";
import { slugFor, parseTags } from "../suno-music.js";

test("slugFor: always suffixes with the clip id, even with no title collision", () => {
  assert.equal(slugFor({ id: "abcdef12-3456-7890", title: "Xadrez" }), "xadrez-abcdef12");
});

test("slugFor: two clips with the same title get different slugs", () => {
  const a = slugFor({ id: "11111111-aaaa", title: "Beatriz" });
  const b = slugFor({ id: "22222222-bbbb", title: "Beatriz" });
  assert.notEqual(a, b);
});

test("slugFor: empty title falls back to sem-titulo", () => {
  assert.equal(slugFor({ id: "abcdef12-0000", title: "" }), "sem-titulo-abcdef12");
});

test("parseTags: splits on commas, semicolons, and newlines", () => {
  assert.deepEqual(parseTags("rock, folk;\nfast tempo"), ["rock", "folk", "fast tempo"]);
});

test("parseTags: drops entries longer than 40 chars (RFC 0011)", () => {
  const long = "a".repeat(41);
  assert.deepEqual(parseTags(`short, ${long}`), ["short"]);
});

test("parseTags: caps at 5 entries (RFC 0011)", () => {
  const raw = Array.from({ length: 8 }, (_, i) => `tag${i}`).join(",");
  assert.deepEqual(parseTags(raw), ["tag0", "tag1", "tag2", "tag3", "tag4"]);
});

test("parseTags: empty/nullish input returns an empty array", () => {
  assert.deepEqual(parseTags(""), []);
  assert.deepEqual(parseTags(null), []);
  assert.deepEqual(parseTags(undefined), []);
});

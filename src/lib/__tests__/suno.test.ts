import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDuration, isoDuration } from "../suno.js";

test("formatDuration: formats whole minutes and seconds as M:SS", () => {
  assert.equal(formatDuration(125), "2:05");
  assert.equal(formatDuration(59), "0:59");
  assert.equal(formatDuration(60), "1:00");
});

test("formatDuration: rounds before splitting into minutes/seconds (regression: 119.6 -> 2:00, not 1:60)", () => {
  assert.equal(formatDuration(119.6), "2:00");
});

test("formatDuration: falsy, zero, negative, and nullish durations all return undefined", () => {
  assert.equal(formatDuration(0), undefined);
  assert.equal(formatDuration(-5), undefined);
  assert.equal(formatDuration(null), undefined);
  assert.equal(formatDuration(undefined), undefined);
});

test("isoDuration: matches formatDuration's minute-boundary rounding for the same input", () => {
  assert.equal(isoDuration(119.6), "PT2M0S");
});

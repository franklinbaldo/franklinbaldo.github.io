import test from "node:test";
import assert from "node:assert/strict";

test("archive index and detail routes keep canonical slash URLs", () => {
  assert.equal(new URL("/archive/", "https://example.test").pathname, "/archive/");
  assert.equal(new URL("/pt/archive/", "https://example.test").pathname, "/pt/archive/");
});

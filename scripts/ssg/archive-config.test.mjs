import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("archive listing isolates English", () => {
  const config = readFileSync("ssg/ssg.toml", "utf8");
  assert.ok(config.includes('language = "en"'));
});

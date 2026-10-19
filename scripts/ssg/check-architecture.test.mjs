import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { violations, checkArchitecture } from "./check-architecture.mjs";

test("native adapter cannot import legacy generator or Astro modules", () => {
  for (const name of ["../zola/content.mjs", "astro:content", "@astrojs/rss", "../../src/pages/post.astro", "../../src/components/Card.astro"]) {
    assert.equal(violations("test.mjs", "import thing from '" + name + "';").length, 1);
  }
});
test("pure library and ordinary node imports remain allowed", () => {
  assert.deepEqual(violations("test.mjs",
    "import {x} from '../lib/publication.mjs'; import {readFileSync} from 'node:fs';"), []);
});
test("all actual native production files respect generator boundaries", () => {
  assert.deepEqual(checkArchitecture(), []);
});
test("route ownership declares each special root exactly once", () => {
  const registry = JSON.parse(readFileSync("ssg/route-ownership.json", "utf8"));
  assert.equal(registry.version, 1);
  const keys = registry.routes.map((r) => r.path);
  assert.equal(keys.length, new Set(keys).size);
  for (const path of ["/archive/", "/projects/", "/music/", "/books/", "/ranking/", "/papers/"])
    assert.ok(keys.includes(path), "Route without owner: " + path);
  assert.equal(registry.routes.find((r) => r.path === "/archive/").strategy, "native-listings");
});

import test from "node:test";
import assert from "node:assert/strict";
import { planRedirects, validRoute } from "./redirects.mjs";

const entries = [
  { lang: "en", route: "/blog/hello/" },
  { lang: "pt", route: "/pt/blog/ola/" },
];

test("legacy and cross-language aliases redirect only to published targets", () => {
  const result = planRedirects({
    entries,
    legacy: {
      "/blog/older/": "/blog/hello/",
      "/blog/gone/": "/blog/private/",
    },
    knownTargets: ["/", "/pt/"],
  });
  assert.deepEqual(result.pages.map((p) => [p.from, p.to]), [
    ["/blog/ola/", "/pt/blog/ola/"],
    ["/blog/older/", "/blog/hello/"],
    ["/pt/blog/hello/", "/blog/hello/"],
  ]);
  assert.ok(result.excluded.some((r) => r.from === "/blog/gone/" &&
    r.reason === "target-not-yet-published-by-ssg"));
  assert.ok(result.pages.every((p) => p.metadata.schema === "page" &&
    p.metadata.layout === "redirect" && p.metadata.redirect_target === p.to));
});

test("unsafe URL, traversal, encoded separators and non-local destinations fail closed", () => {
  for (const path of [
    "/../", "/blog//x/", "/blog/%2f/", "/blog/%2E%2E/",
    "/blog/%5c/", "/blog/%qq/", "/blog/?secret=x", "/blog/#fragment",
    "https://other.example/x/", '/blog/"onmouseover/',
  ]) assert.equal(validRoute(path), false, path);
  for (const url of ["/blog/%2F/", "/blog/%2E%2E/"]) {
    assert.throws(() => planRedirects({ entries, legacy: { [url]: "/blog/hello/" } }),
      /Unsafe/);
  }
});

test("a redirect never shadows an existing public page or creates a loop", () => {
  const result = planRedirects({
    entries,
    legacy: {
      "/blog/hello/": "/pt/blog/ola/",
      "/blog/cycle/": "/blog/cycle/",
    },
  });
  assert.equal(result.pages.some((p) => p.from === "/blog/hello/"), false);
  assert.equal(result.pages.some((p) => p.from === "/blog/cycle/"), false);
});

test("published language variant at an opposite-language route is never replaced", () => {
  const result = planRedirects({
    entries: [
      { lang: "en", route: "/blog/shared/" },
      { lang: "pt", route: "/pt/blog/shared/" },
    ],
    legacy: {},
  });
  assert.equal(result.pages.length, 0);
});

test("redirects cannot be created without validated canonical published posts", () => {
  assert.throws(() => planRedirects({ entries: [], legacy: {} }), /Missing/);
  assert.throws(() => planRedirects({
    entries: [{ lang: "pt", route: "/blog/mislabeled/" }], legacy: {},
  }), /Invalid published/);
});

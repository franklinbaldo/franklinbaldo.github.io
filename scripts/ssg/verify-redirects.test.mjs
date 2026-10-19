import test from "node:test";
import assert from "node:assert/strict";
import { verifyRedirectHtml } from "./verify-redirects.mjs";

const redirect = { from: "/blog/old/", to: "/blog/current/" };
const sample = [
  '<!doctype html><html lang="en"><head>',
  '<meta name="robots" content="noindex,follow">',
  '<meta http-equiv="refresh" content="0;url=/blog/current/">',
  '<link rel="canonical" href="https://franklinbaldo.github.io/blog/current/">',
  '</head><body><main><h1>Page moved</h1>',
  '<a href="/blog/current/">Continue</a></main></body></html>',
].join("");

test("compiled aliases expose correct canonical, refresh, robots and fallback", () => {
  assert.deepEqual(verifyRedirectHtml(sample, redirect), { ...redirect, lang: "en" });
});

test("redirects without noindex or with wrong target/locale are rejected", () => {
  assert.throws(() => verifyRedirectHtml(sample.replace("noindex", "index"), redirect), /not be indexed/);
  assert.throws(() => verifyRedirectHtml(sample.replace("0;url=/blog/current/", "0;url=/blog/fake/"), redirect), /refresh/);
  assert.throws(() => verifyRedirectHtml(sample.replaceAll("/blog/current/", "/blog/fake/"), redirect), /refresh/);
  assert.throws(() => verifyRedirectHtml(sample.replace('lang="en"', 'lang="pt"'), redirect), /language/);
  assert.throws(() => verifyRedirectHtml(sample.replace("https://franklinbaldo.github.io/blog/current/", "https://evil.example/blog/current/"), redirect), /canonical/);
});

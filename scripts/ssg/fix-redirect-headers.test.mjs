import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "parse5";
import { correctRedirectHeaders } from "./fix-redirect-headers.mjs";
import { verifyRedirectHtml } from "./verify-redirects.mjs";

const pair = { from: "/blog/old/", to: "/blog/current/" };
const source = [
  '<!doctype html><html lang="en"><head>',
  '<meta name="robots" content="noindex,follow">',
  '<meta name="robots" content="max-snippet:-1">',
  '<meta http-equiv="refresh" content="0;url=/blog/current/">',
  '<link rel="canonical" href="https://franklinbaldo.github.io/blog/old/">',
  '<link rel="canonical" href="https://franklinbaldo.github.io/blog/old/">',
  '<script type="application/ld+json">{"url":"https://franklinbaldo.github.io/blog/old/"}</script>',
  '</head><body><main><h1>Page moved</h1>',
  '<a href="/blog/current/">Continue</a></main></body></html>',
].join("");

test("only historical redirects get a destination canonical and sole noindex", () => {
  const html = correctRedirectHeaders(source, pair.to);
  assert.deepEqual(verifyRedirectHtml(html, pair), { ...pair, lang: "en" });
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.equal((html.match(/name="robots"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /application\/ld\+json/);
  assert.ok(parse(html));
});

test("missing noindex or canonical fails rather than being silently fixed", () => {
  assert.throws(() => correctRedirectHeaders(source.replace("noindex,follow", "index"), pair.to), /noindex/);
  assert.throws(() => correctRedirectHeaders(source.replaceAll('rel="canonical"', 'rel="preconnect"'), pair.to), /canonical/);
  assert.throws(() => correctRedirectHeaders(source, "//evil.example/"), /Invalid/);
});

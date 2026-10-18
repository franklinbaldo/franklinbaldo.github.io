import test from "node:test";
import assert from "node:assert/strict";
import { convertBody, frontmatter, postPath, published } from "./content.mjs";
test("publication boundary excludes drafts and scheduled posts", () => {
  const now = new Date("2026-10-18T12:00:00Z");
  assert.equal(published({ draft: true }, now), false);
  assert.equal(published({ publishDate: "2026-10-19" }, now), false);
  assert.equal(published({ publishDate: "2026-10-18" }, now), true);
  assert.throws(() => published({ publishDate: "invalid" }, now));
});
test("canonical slugs and languages preserve URLs", () => {
  assert.equal(
    postPath("original", { slug: "localized", lang: "pt" }),
    "/pt/blog/localized/"
  );
  assert.equal(postPath("original", {}), "/blog/original/");
  assert.throws(() => postPath("../secret", {}));
});
test("literal JSX styles become ordinary HTML without executing code", () => {
  assert.equal(
    convertBody(
      "<iframe style={{ width: '100%', borderRadius: '12px' }}></iframe>"
    ),
    '<iframe style="width:100%;border-radius:12px"></iframe>'
  );
  assert.throws(() => convertBody("<div style={{ width: process.exit() }} />"));
  assert.throws(() => convertBody('import X from "secret";'));
});
test("math rendering does not rewrite code examples", () => {
  const source = '`$x$`\n\n```js\nconst price = "$x$";\n```\n\n$x^2$';
  const converted = convertBody(source);
  assert.ok(converted.includes("`$x$`"));
  assert.ok(converted.includes('const price = "$x$";'));
  assert.ok(converted.includes('class="katex"'));
});
test("TOML values escape quotes and translations keys", () => {
  const result = frontmatter(
    { title: '"example"', draft: false },
    { lang: "pt", translations: { en: "/blog/a/", pt: "/pt/blog/a/" } }
  );
  assert.ok(result.includes('title = "\\"example\\""'));
  assert.ok(result.includes("draft = false"));
  assert.ok(
    result.includes(
      'translations = { "en" = "/blog/a/", "pt" = "/pt/blog/a/" }'
    )
  );
});

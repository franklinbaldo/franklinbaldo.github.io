import assert from "node:assert/strict";
import test from "node:test";
import { preserveHeadingAnchors } from "./anchors.mjs";

const heading = (id, text) =>
  `<h2 id="${id}"><a class="zola-anchor" href="#${id}">${text}</a></h2>`;

test("restores accented GitHub heading URLs and retains Zola aliases", () => {
  const result = preserveHeadingAnchors(heading("e-plagio", "E plágio?"));
  assert.equal(result.restored, 1);
  assert.match(result.html, /<h2 id="e-plágio">/);
  assert.match(result.html, /href="#e-plágio"/);
  assert.match(result.html, /<span id="e-plagio"/);
  assert.equal(preserveHeadingAnchors(result.html).html, result.html);
});

test("original URL wins when a new ASCII alias would collide", () => {
  const result = preserveHeadingAnchors(
    heading("cafe", "Café") + heading("cafe-1", "Cafe")
  );
  assert.match(result.html, /<h2 id="café">/);
  assert.match(result.html, /<h2 id="cafe">/);
  assert.equal((result.html.match(/id="cafe"/g) ?? []).length, 1);
});

test("matches rehype-slug text semantics and duplicate counters", () => {
  const result = preserveHeadingAnchors(
    heading("deja-vu", "Déjà <em>vu</em> &amp; <code>x</code>") +
      heading("deja-vu-1", "Déjà <em>vu</em> &amp; <code>x</code>")
  );
  assert.match(result.html, /id="déjà-vu--x"/);
  assert.match(result.html, /id="déjà-vu--x-1"/);
});

test("does not change hand-authored headings or code examples", () => {
  const html =
    '<h2 id="explicit">Título</h2><pre>&lt;h2 id="example"&gt;No&lt;/h2&gt;</pre>';
  assert.equal(preserveHeadingAnchors(html).html, html);
});

test("retains old footnote targets and repeated-reference names", () => {
  const html =
    '<sup class="footnote-reference" id="fr-note-1">1</sup><sup class="footnote-reference" id="fr-note-2">1</sup><section class="footnotes"><ol><li id="fn-note">Note</li></ol></section>';
  const result = preserveHeadingAnchors(html);
  for (const id of [
    "footnote-label",
    "user-content-fn-note",
    "user-content-fnref-note",
    "user-content-fnref-note-2",
  ])
    assert.ok(result.html.includes(`id="${id}"`));
  assert.equal(preserveHeadingAnchors(result.html).html, result.html);
});

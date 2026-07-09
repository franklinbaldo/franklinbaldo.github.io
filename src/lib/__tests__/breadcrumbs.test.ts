import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toBreadcrumbLd } from "../breadcrumbs.ts";

// toBreadcrumbLd feeds both the visible <Breadcrumbs> UI and the
// BreadcrumbList JSON-LD structured data from the same trail -- a bug here
// either breaks the visible crumbs or emits invalid/misleading structured
// data that search engines index.

describe("toBreadcrumbLd", () => {
  it("passes hrefs through unchanged when no site URL is given", () => {
    const result = toBreadcrumbLd([
      { name: "Home", href: "/" },
      { name: "Blog", href: "/blog/" },
    ]);
    assert.deepEqual(result, [
      { name: "Home", item: "/" },
      { name: "Blog", item: "/blog/" },
    ]);
  });

  it("resolves relative hrefs into absolute URLs against the site base", () => {
    const site = new URL("https://franklinbaldo.github.io/");
    const result = toBreadcrumbLd(
      [
        { name: "Home", href: "/" },
        { name: "Post", href: "/blog/hello/" },
      ],
      site
    );
    assert.deepEqual(result, [
      { name: "Home", item: "https://franklinbaldo.github.io/" },
      { name: "Post", item: "https://franklinbaldo.github.io/blog/hello/" },
    ]);
  });

  it("preserves item order and count for a longer trail", () => {
    const items = [
      { name: "Home", href: "/" },
      { name: "Blog", href: "/blog/" },
      { name: "2026", href: "/blog/2026/" },
      { name: "Post title", href: "/blog/hello/" },
    ];
    const result = toBreadcrumbLd(items);
    assert.equal(result.length, 4);
    assert.deepEqual(
      result.map((r) => r.name),
      ["Home", "Blog", "2026", "Post title"]
    );
  });

  it("returns an empty array for an empty trail", () => {
    assert.deepEqual(toBreadcrumbLd([]), []);
  });

  it("leaves an already-absolute href untouched by the site base", () => {
    const site = new URL("https://franklinbaldo.github.io/");
    const result = toBreadcrumbLd(
      [{ name: "External", href: "https://example.com/other/" }],
      site
    );
    assert.equal(result[0].item, "https://example.com/other/");
  });
});

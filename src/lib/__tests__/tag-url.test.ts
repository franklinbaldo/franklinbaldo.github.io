import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tagUrl } from "../tag-url.ts";

const LEGACY_COLLISION_URLS = [
  ["AI", "/tags/AI/", "/pt/tags/AI/"],
  ["ai", "/tags/ai/", "/pt/tags/ai/"],
  ["amazonia", "/tags/amazonia/", "/pt/tags/amazonia/"],
  ["amazônia", "/tags/amaz%C3%B4nia/", "/pt/tags/amaz%C3%B4nia/"],
  [
    "engenharia de software",
    "/tags/engenharia%20de%20software/",
    "/pt/tags/engenharia%20de%20software/",
  ],
  [
    "engenharia-de-software",
    "/tags/engenharia-de-software/",
    "/pt/tags/engenharia-de-software/",
  ],
  ["IA", "/tags/IA/", "/pt/tags/IA/"],
  ["ia", "/tags/ia/", "/pt/tags/ia/"],
  ["memoria", "/tags/memoria/", "/pt/tags/memoria/"],
  ["memória", "/tags/mem%C3%B3ria/", "/pt/tags/mem%C3%B3ria/"],
  [
    "software engineering",
    "/tags/software%20engineering/",
    "/pt/tags/software%20engineering/",
  ],
  [
    "software-engineering",
    "/tags/software-engineering/",
    "/pt/tags/software-engineering/",
  ],
] as const;

describe("tagUrl", () => {
  it("encodes spaces in English tag URLs", () => {
    assert.equal(
      tagUrl("software engineering", "en"),
      "/tags/software%20engineering/",
    );
  });

  it("encodes accented Portuguese labels without normalizing them", () => {
    assert.equal(tagUrl("memória", "pt"), "/pt/tags/mem%C3%B3ria/");
  });

  it("encodes reserved URL characters while preserving the exact label", () => {
    assert.equal(tagUrl("C++", "en"), "/tags/C%2B%2B/");
  });

  it("freezes legacy URLs for all variants in the six pre-migration collision groups", () => {
    for (const [tag, englishUrl, portugueseUrl] of LEGACY_COLLISION_URLS) {
      assert.equal(tagUrl(tag, "en"), englishUrl, `English URL changed for ${tag}`);
      assert.equal(
        tagUrl(tag, "pt"),
        portugueseUrl,
        `Portuguese URL changed for ${tag}`,
      );
    }
  });
});

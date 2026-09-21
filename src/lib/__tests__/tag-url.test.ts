import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tagUrl } from "../tag-url.ts";

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
});

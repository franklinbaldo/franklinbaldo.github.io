import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isNormalEditorialPost,
  isNormalEditorialTierKey,
} from "../tier-scope.js";

describe("normal editorial tier scope", () => {
  it("accepts a normal editorial post", () => {
    assert.equal(isNormalEditorialTierKey("pierre-menard"), true);
    assert.equal(isNormalEditorialPost({}, "pierre-menard"), true);
  });

  it("rejects music-prefixed translation keys even without postType", () => {
    assert.equal(isNormalEditorialTierKey("music-beatriz"), false);
    assert.equal(isNormalEditorialPost({}, "music-beatriz"), false);
  });

  it("rejects postType music even when the translation key lacks the prefix", () => {
    assert.equal(
      isNormalEditorialPost({ postType: "music" }, "legacy-unprefixed-song"),
      false,
    );
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LANG,
  LANGUAGES,
  t,
  targetCopy,
  pick,
  locale,
  urlPrefix,
  supportedLangs,
  detectLang,
} from "../i18n.ts";

// Pure key-lookup / fallback logic — no fs, no Astro runtime. A regression
// here silently renders blank or wrong-language UI strings across the whole
// site, so the fallback chains (unsupported lang -> DEFAULT_LANG, missing
// key -> DEFAULT_LANG's copy) are worth pinning down explicitly, not just
// the happy path.

describe("DEFAULT_LANG", () => {
  it("is en", () => {
    assert.equal(DEFAULT_LANG, "en");
  });
});

describe("t (UI string lookup)", () => {
  it("returns the English string for a key", () => {
    assert.equal(t("en", "nav.home"), "Home");
  });

  it("returns the Portuguese string for the same key", () => {
    assert.equal(t("pt", "nav.home"), "Início");
  });

  it("treats an undefined lang the same as DEFAULT_LANG", () => {
    assert.equal(t(undefined, "nav.archive"), t(DEFAULT_LANG, "nav.archive"));
  });

  it("falls back to DEFAULT_LANG's config for an unsupported lang code", () => {
    assert.equal(t("fr", "nav.home"), t("en", "nav.home"));
    assert.equal(t("xx", "nav.archive"), t("en", "nav.archive"));
  });

  it("falls back to DEFAULT_LANG's copy when the key is missing from the resolved language", () => {
    // Every UIKey is statically required in both en.ui and pt.ui
    // (Record<UIKey, string>), so there is no real missing key today.
    // Exercise the runtime fallback branch directly by temporarily
    // removing a key from pt's dictionary: this proves t() degrades to
    // the English copy instead of returning undefined, which is exactly
    // what would happen if UI_KEYS ever grew a key that one language's
    // dict forgot to translate (a blank string on the live site).
    const key = "nav.home";
    const ptUi = LANGUAGES.pt.ui as Record<string, string>;
    const original = ptUi[key];
    delete ptUi[key];
    try {
      assert.equal(t("pt", key), LANGUAGES.en.ui[key]);
    } finally {
      ptUi[key] = original;
    }
  });
});

describe("targetCopy", () => {
  it("returns the configured target copy for a supported target lang", () => {
    const copy = targetCopy("en", "pt");
    assert.equal(copy.shortLabel, "PT");
    assert.equal(copy.invitation, "Ler em Português");
    assert.equal(copy.noTranslation, "Sem versão em português");
  });

  it("returns the reverse direction copy too", () => {
    const copy = targetCopy("pt", "en");
    assert.equal(copy.shortLabel, "EN");
    assert.equal(copy.invitation, "Read in English");
  });

  it("synthesizes a fallback copy for an unsupported target lang", () => {
    const copy = targetCopy("en", "xx");
    assert.equal(copy.shortLabel, "XX");
    assert.equal(copy.invitation, "XX");
    assert.equal(copy.noTranslation, "No XX version");
  });

  it("uses DEFAULT_LANG's targets when currentLang is undefined", () => {
    assert.deepEqual(targetCopy(undefined, "pt"), targetCopy("en", "pt"));
  });
});

describe("pick", () => {
  it("returns the entry for the requested lang", () => {
    assert.equal(pick("pt", { en: "Hello", pt: "Olá" }), "Olá");
  });

  it("falls back to DEFAULT_LANG's entry when the requested lang is absent from the dict", () => {
    assert.equal(pick("xx", { en: "Hello", pt: "Olá" }), "Hello");
  });

  it("falls back to the first value in the dict when neither the requested lang nor DEFAULT_LANG is present", () => {
    assert.equal(pick("xx", { fr: "Bonjour" }), "Bonjour");
  });

  it("treats an undefined lang the same as DEFAULT_LANG", () => {
    assert.equal(pick(undefined, { en: "E", pt: "P" }), "E");
  });
});

describe("locale / urlPrefix", () => {
  it("locale() returns the BCP-47 tag per language", () => {
    assert.equal(locale("en"), "en-US");
    assert.equal(locale("pt"), "pt-BR");
  });

  it("locale() falls back to DEFAULT_LANG's locale for an unknown lang", () => {
    assert.equal(locale("xx"), "en-US");
    assert.equal(locale(undefined), "en-US");
  });

  it("urlPrefix() is empty for the default language and /pt for Portuguese", () => {
    assert.equal(urlPrefix("en"), "");
    assert.equal(urlPrefix("pt"), "/pt");
  });

  it("urlPrefix() falls back to the default (empty) prefix for an unknown lang", () => {
    assert.equal(urlPrefix("xx"), "");
  });
});

describe("supportedLangs", () => {
  it("includes exactly en and pt", () => {
    assert.deepEqual([...supportedLangs()].sort(), ["en", "pt"]);
  });
});

describe("detectLang", () => {
  it("returns DEFAULT_LANG outside a browser environment (no `window`)", () => {
    // node --test has no DOM; this pins the SSR/build-time-safe fallback —
    // if detectLang() were ever called at build time it must not throw.
    assert.equal(typeof window, "undefined");
    assert.equal(detectLang(), DEFAULT_LANG);
  });
});

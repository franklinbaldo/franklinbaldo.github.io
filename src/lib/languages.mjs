/**
 * Language registry — plain ES module so both i18n.ts (via import) and
 * Node scripts (generate-translation-pairs.mjs, astro.config.mjs) can
 * import without a TypeScript compiler step.
 *
 * UI strings live in i18n.ts only; this file carries only the structural
 * metadata that scripts need: locale tag, URL prefix, and navMatch prefixes.
 */

/** @type {string} */
export const DEFAULT_LANG = 'en';

/**
 * @typedef {{ locale: string; urlPrefix: string; navMatch: string[] }} LangMeta
 * @type {Record<string, LangMeta>}
 */
export const LANG_META = {
  en: { locale: 'en-US', urlPrefix: '',    navMatch: ['en'] },
  pt: { locale: 'pt-BR', urlPrefix: '/pt', navMatch: ['pt'] },
};

/** @returns {string[]} */
export function supportedLangs() {
  return Object.keys(LANG_META);
}

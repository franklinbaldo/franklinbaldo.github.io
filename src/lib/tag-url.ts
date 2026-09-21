import { urlPrefix } from "./i18n";

export type TagLanguage = "en" | "pt";

/** Build the public URL for an exact tag label without changing its semantics. */
export function tagUrl(tag: string, lang: TagLanguage = "en"): string {
  return `${urlPrefix(lang)}/tags/${encodeURIComponent(tag)}/`;
}

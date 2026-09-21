import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const CACHE_DIR = resolve(process.cwd(), ".cache/qr");

interface QrInput {
  /** Stable slug used as the cache filename. */
  slug: string;
  /** Language-specific home slug to fall back to when this post has no
   *  cached QR. The garden has a cobogó at the back; if a leaf is
   *  missing, you fall back to the wall behind it. */
  fallbackSlug: string;
}

/**
 * Look up the artistic QR PNG for a page in `.cache/qr/`. Generation
 * happens out-of-band in `.github/workflows/generate-qrs.yml`.
 *
 * Fallback chain:
 *   1. .cache/qr/<slug>.png            (post's own artistic QR)
 *   2. .cache/qr/<fallbackSlug>.png    (e.g. home QR for the language)
 *   3. null                            (renderer falls back to URL text)
 */
export function getQrPng({ slug, fallbackSlug }: QrInput): Buffer | null {
  for (const candidate of [slug, fallbackSlug]) {
    const path = resolve(CACHE_DIR, `${candidate}.png`);
    if (existsSync(path)) return readFileSync(path);
  }
  return null;
}

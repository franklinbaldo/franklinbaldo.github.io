import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

const CACHE_DIR = resolve(process.cwd(), ".cache/qr");

const DARK = "#1c1814";
const LIGHT = "#FAF7F2";

interface QrInput {
  /** Stable slug used as the cache filename. */
  slug: string;
  /** URL the QR code should encode. */
  url: string;
  /** Optional emoji rendered in the QR center on the fallback path. */
  emoji?: string;
}

/**
 * Return a PNG buffer for the post's QR code.
 *
 * Lookup order:
 *   1. .cache/qr/<slug>.png — produced by the
 *      `generate-qrs.yml` GitHub Actions workflow (AI-styled QR).
 *   2. Built on the fly here with `qrcode` + sharp as a plain QR with
 *      the emoji (if any) composited at the center.
 *
 * The build never depends on a network call.
 */
export async function getQrPng({ slug, url, emoji }: QrInput): Promise<Buffer> {
  const cached = resolve(CACHE_DIR, `${slug}.png`);
  if (existsSync(cached)) return readFileSync(cached);
  return renderFallbackQr(url, emoji);
}

async function renderFallbackQr(url: string, emoji?: string): Promise<Buffer> {
  const size = 440;
  // Error-correction H lets us cover up to 30% of the modules with the
  // center logo without breaking decoding.
  const qrPng = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: size,
    color: { dark: DARK, light: LIGHT },
  });
  if (!emoji) return qrPng;

  // Center the emoji in a small cream disc covering ~22% of the QR
  // (still inside the 30% error-correction budget).
  const discSize = Math.round(size * 0.26);
  const fontSize = Math.round(discSize * 0.72);
  const discCx = size / 2;
  const discR = discSize / 2;
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${discCx}" cy="${discCx}" r="${discR}" fill="${LIGHT}" stroke="${DARK}" stroke-width="2"/>
    <text x="${discCx}" y="${discCx}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central"
          font-family="Noto Color Emoji, Apple Color Emoji, Segoe UI Emoji, sans-serif">${escapeXml(emoji)}</text>
  </svg>`;

  return sharp(qrPng)
    .composite([{ input: Buffer.from(overlay) }])
    .png()
    .toBuffer();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

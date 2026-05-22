#!/usr/bin/env node
// Generate artistic QR codes for each blog post and the home pages.
//
// Reads frontmatter from src/content/blog/**.md and writes (or refreshes)
// PNGs into .cache/qr/. Each QR encodes the canonical URL of the post.
// A manifest at .cache/qr/index.json records the cache key per slug so
// posts only regenerate when their URL or emoji changes.
//
// The actual image generation happens through HuggingFace Inference
// providers (model: QR Code Monster v2). The HF_TOKEN env var must be
// set; without it the script exits 0 and the regular Astro build falls
// back to a plain qrcode-with-emoji-overlay tile (see src/lib/og-qr.ts).

import { createHash } from "node:crypto";
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { resolve, basename } from "node:path";
import { load as parseYaml } from "js-yaml";
import { BrowserMultiFormatReader } from "@zxing/library";

const ROOT = resolve(import.meta.dirname, "..");
const CACHE_DIR = resolve(ROOT, ".cache/qr");
const MANIFEST = resolve(CACHE_DIR, "index.json");
const TEMPLATE_VERSION = "v1";
const SITE = "https://franklinbaldo.github.io";
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "monster-labs/control_v1p_sd15_qrcode_monster";

const SLUG_FILTER = process.argv
  .slice(2)
  .find((a) => a.startsWith("--slug="))
  ?.slice(7);

mkdirSync(CACHE_DIR, { recursive: true });
const manifest = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, "utf8"))
  : {};

const EMOJI_NOUN = {
  "🤖": "robot, circuit-board geometry",
  "⚖️": "balance scales, marble columns",
  "🧠": "neural pathways, soft synapses",
  "🌱": "growing vine, fresh leaves",
  "🏛️": "marble portico, classical columns",
  "📜": "parchment scroll, sealed wax",
  "🐍": "coiled serpent, latticework",
  "🪞": "facing mirrors, optical reflections",
  "🗝️": "antique key, ornate keyhole",
  "🧩": "interlocking puzzle pieces",
};

function emojiPrompt(emoji) {
  const noun = emoji
    ? EMOJI_NOUN[emoji] || "abstract emblem"
    : "abstract geometric emblem";
  return `${noun}, cobogó architectural pattern, terracotta brick and cream paper, hand-drawn ink illustration, isometric, minimal, warm earth tones, no text, no letters`;
}

function listPosts() {
  const dir = resolve(ROOT, "src/content/blog");
  const now = new Date();
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = basename(f, ".md");
      const raw = readFileSync(resolve(dir, f), "utf8");
      const m = raw.match(/^---\n([\s\S]+?)\n---/);
      const fm = m ? parseYaml(m[1]) : {};
      return {
        slug,
        emoji: fm.emoji,
        lang: fm.lang || "en",
        url: `${SITE}/blog/${slug}/`,
        draft: fm.draft === true,
        publishDate: fm.publishDate ? new Date(fm.publishDate) : null,
      };
    })
    .filter((p) => !p.draft)
    .filter((p) => !p.publishDate || p.publishDate <= now);
}

function listHomes() {
  return [
    { slug: "home", emoji: "🌱", lang: "en", url: `${SITE}/` },
    { slug: "home-pt", emoji: "🌱", lang: "pt", url: `${SITE}/pt/` },
  ];
}

function cacheKey({ url, emoji }) {
  return createHash("sha1")
    .update(`${url}|${emoji || ""}|${TEMPLATE_VERSION}`)
    .digest("hex")
    .slice(0, 12);
}

async function callHfQrModel({ url, prompt }) {
  if (!HF_TOKEN) return null;
  const body = {
    inputs: prompt,
    parameters: {
      controlnet_conditioning_image: url,
      controlnet_conditioning_scale: 1.5,
      guidance_scale: 7.5,
      num_inference_steps: 30,
    },
  };
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    console.warn(
      `[generate-qrs] HF ${res.status} for ${url}: ${await res.text()}`
    );
    return null;
  }
  return Buffer.from(await res.arrayBuffer());
}

async function verifyScans(png, expectedUrl) {
  // Decode the PNG and confirm it scans back to the post URL.
  // @zxing operates on ImageData; we feed it via canvas-like wrapper.
  // For server-side decode we use the sharp raw pipeline.
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const reader = new BrowserMultiFormatReader();
    const luminanceSource = {
      getRow: (y, row) => {
        const out = row || new Uint8ClampedArray(info.width);
        for (let x = 0; x < info.width; x++) {
          const i = (y * info.width + x) * 4;
          out[x] = (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        return out;
      },
      getMatrix: () => {
        const out = new Uint8ClampedArray(info.width * info.height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          out[j] = (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        return out;
      },
      getWidth: () => info.width,
      getHeight: () => info.height,
      isCropSupported: () => false,
      isRotateSupported: () => false,
      invert: () => luminanceSource,
    };
    const result = await reader.decodeFromLuminanceSource(luminanceSource);
    return result.getText() === expectedUrl;
  } catch {
    return false;
  }
}

async function generateOne(post) {
  const key = cacheKey(post);
  if (manifest[post.slug] === key) {
    console.log(`[generate-qrs] ${post.slug}: up to date`);
    return false;
  }
  const prompt = emojiPrompt(post.emoji);
  console.log(`[generate-qrs] ${post.slug}: generating (${post.emoji || "—"})`);
  let png = null;
  for (let attempt = 0; attempt < 3 && !png; attempt++) {
    png = await callHfQrModel({ url: post.url, prompt });
    if (png && !(await verifyScans(png, post.url))) {
      console.warn(
        `[generate-qrs] ${post.slug}: attempt ${attempt + 1} did not scan, retrying`
      );
      png = null;
    }
  }
  if (!png) {
    console.warn(
      `[generate-qrs] ${post.slug}: no usable QR — Astro build will fall back to plain QR`
    );
    return false;
  }
  writeFileSync(resolve(CACHE_DIR, `${post.slug}.png`), png);
  manifest[post.slug] = key;
  return true;
}

async function main() {
  const targets = [...listPosts(), ...listHomes()].filter(
    (p) => !SLUG_FILTER || p.slug === SLUG_FILTER
  );
  if (!HF_TOKEN) {
    console.warn(
      "[generate-qrs] HF_TOKEN not set — nothing to generate. The build will use the plain-QR fallback."
    );
    return;
  }
  let changed = false;
  for (const p of targets) {
    if (await generateOne(p)) changed = true;
  }
  if (changed)
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`[generate-qrs] done (${Object.keys(manifest).length} cached)`);
}

await main();

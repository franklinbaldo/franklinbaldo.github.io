import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import sharp from "sharp";
import { resolve } from "node:path";
import OGCard from "../../components/OGCard.astro";

const SKIP = process.env.SKIP_OG === "1";

const W = 1200;
const H = 630;
const FONT_SEMIBOLD = resolve(process.cwd(), "public/fonts/fraunces-semibold.ttf");
const FONT_REGULAR = resolve(process.cwd(), "public/fonts/fraunces-regular.ttf");

// Avatar occupies the left ~28% — text lives on the right.
const TEXT_LEFT = 460;
const TEXT_RIGHT_PAD = 64;
const TEXT_WIDTH = W - TEXT_LEFT - TEXT_RIGHT_PAD;

const TITLE_TOP = 120;
const TITLE_MAX_HEIGHT = 260;
const DESC_MAX_HEIGHT = 96;
const URL_TOP = H - 72;

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

type CardData = {
  title: string;
  description?: string;
  tags?: string[];
  lang?: "en" | "pt";
};

const buildEntries = async () => {
  const posts = SKIP ? [] : await getCollection("blog");
  const entries: Array<{ slug: string; data: CardData }> = posts.map((p) => ({
    slug: p.id,
    data: {
      title: p.data.title,
      description: p.data.description,
      tags: p.data.tags,
      lang: p.data.lang ?? "en",
    },
  }));
  entries.push({
    slug: "_site",
    data: {
      title: "Franklin Baldo",
      description:
        "Lawyer and State Attorney. Essays on AI agency, process metaphysics, and legal design.",
      tags: ["digital-garden"],
      lang: "en",
    },
  });
  entries.push({
    slug: "_site-pt",
    data: {
      title: "Franklin Baldo",
      description:
        "Advogado e Procurador do Estado. Ensaios sobre agentes de IA, metafísica do processo e design jurídico.",
      tags: ["jardim-digital"],
      lang: "pt",
    },
  });
  return entries;
};

export async function getStaticPaths() {
  const entries = await buildEntries();
  return entries.map((e) => ({ params: { slug: e.slug }, props: { data: e.data } }));
}

async function renderTitle(title: string) {
  for (const size of [88, 80, 72, 64, 56, 48]) {
    const buffer = await sharp({
      text: {
        text: `<span foreground="#ede4d3" font_family="Fraunces SemiBold" size="${size * 1024}">${escape(title)}</span>`,
        fontfile: FONT_SEMIBOLD,
        width: TEXT_WIDTH,
        height: TITLE_MAX_HEIGHT,
        rgba: true,
        wrap: "word",
        spacing: Math.round(size * 0.1),
      },
    })
      .png()
      .toBuffer();
    const meta = await sharp(buffer).metadata();
    if ((meta.height ?? 0) <= TITLE_MAX_HEIGHT) return { buffer, height: meta.height ?? 0 };
  }
  const buffer = await sharp({
    text: {
      text: `<span foreground="#ede4d3" font_family="Fraunces SemiBold" size="${44 * 1024}">${escape(title)}</span>`,
      fontfile: FONT_SEMIBOLD,
      width: TEXT_WIDTH,
      height: TITLE_MAX_HEIGHT,
      rgba: true,
      wrap: "word",
    },
  })
    .png()
    .toBuffer();
  const meta = await sharp(buffer).metadata();
  return { buffer, height: meta.height ?? 0 };
}

async function renderDescription(description: string, tag: string | undefined) {
  const tagSuffix = tag ? `  ·  <span foreground="#f56b3d">#${escape(tag)}</span>` : "";
  const text = `<span foreground="#9d917e" font_family="Fraunces" size="${30 * 1024}">${escape(description)}</span>${tagSuffix}`;
  return await sharp({
    text: {
      text,
      fontfile: FONT_REGULAR,
      width: TEXT_WIDTH,
      height: DESC_MAX_HEIGHT,
      rgba: true,
      wrap: "word",
      spacing: 6,
    },
  })
    .png()
    .toBuffer();
}

async function renderUrl(lang: "en" | "pt") {
  const url = lang === "pt" ? "franklinbaldo.github.io/pt" : "franklinbaldo.github.io";
  return await sharp({
    text: {
      text: `<span foreground="#9d917e" font_family="Fraunces SemiBold" size="${26 * 1024}">${url}</span>`,
      fontfile: FONT_SEMIBOLD,
      width: TEXT_WIDTH,
      height: 40,
      rgba: true,
    },
  })
    .png()
    .toBuffer();
}

export const GET: APIRoute = async ({ props }) => {
  const data = props.data as CardData;
  const title = trunc(data.title, 100);
  const description = trunc(data.description ?? "", 90);
  const tag = data.tags?.[0];
  const lang = data.lang ?? "en";

  const container = await AstroContainer.create();
  const svg = await container.renderToString(OGCard);
  const bg = await sharp(Buffer.from(svg)).png().toBuffer();

  const titleLayer = await renderTitle(title);
  const descLayer = await renderDescription(description, tag);
  const urlLayer = await renderUrl(lang);

  const descTop = TITLE_TOP + titleLayer.height + 24;

  const png = await sharp(bg)
    .composite([
      { input: titleLayer.buffer, left: TEXT_LEFT, top: TITLE_TOP },
      { input: descLayer, left: TEXT_LEFT, top: descTop },
      { input: urlLayer, left: TEXT_LEFT, top: URL_TOP },
    ])
    .png({ quality: 92 })
    .toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";

// During `astro build`, modules are bundled into dist/, so resolving paths
// relative to import.meta.url breaks. process.cwd() is the project root in
// both dev and build, so anchor reads to it.
const read = (p: string) => readFileSync(resolve(process.cwd(), p));

const frauncesBold = read("node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff");
const interRegular = read("node_modules/@fontsource/inter/files/inter-latin-400-normal.woff");
const interSemibold = read("node_modules/@fontsource/inter/files/inter-latin-600-normal.woff");

const avatarDataUri = `data:image/png;base64,${read("public/apple-touch-icon.png").toString("base64")}`;

// Inline the cobogó tile with an explicit warm-tan stroke so it reads as
// architecture, not noise, and doesn't compete with the orange accent chips.
const COBOGO_STROKE = "#C9A875";
const cobogoSvg = read("public/cobogo.svg")
  .toString("utf8")
  .replace('stroke="currentColor"', `stroke="${COBOGO_STROKE}"`)
  .replace('stroke-width="0.5"', 'stroke-width="0.7"');
const cobogoDataUri = `data:image/svg+xml;base64,${Buffer.from(cobogoSvg).toString("base64")}`;

export interface CardInput {
  title: string;
  description?: string;
}

const PALETTE = {
  bgTop: "#FAF7F2",
  bgBot: "#EFE9DC",
  ink: "#1c1814",
  inkSoft: "#5f503c",
  muted: "#8c785a",
  accent: "#d97706",
};

const DOMAIN = "franklinbaldo.github.io";

const TITLE_HARD_CAP = 70;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

// Title size + description budget scale together. Without chips we have more
// vertical room, so titles can grow noticeably bigger.
function fitTypography(title: string): { titleSize: number; descCap: number } {
  const n = title.length;
  if (n <= 14) return { titleSize: 112, descCap: 180 };
  if (n <= 22) return { titleSize: 96, descCap: 180 };
  if (n <= 36) return { titleSize: 76, descCap: 170 };
  if (n <= 52) return { titleSize: 62, descCap: 150 };
  return { titleSize: 52, descCap: 120 };
}

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]): El => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
});

function buildTree(input: CardInput): El {
  const { title: rawTitle, description: rawDesc } = input;
  const title = truncate(rawTitle, TITLE_HARD_CAP);
  const { titleSize, descCap } = fitTypography(title);
  const description = rawDesc ? truncate(rawDesc, descCap) : undefined;

  const eyebrow = h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 22,
      },
    },
    h("img", {
      src: avatarDataUri,
      width: 96,
      height: 96,
      style: { width: 96, height: 96, borderRadius: 48 },
    }),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      h(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 22,
            color: PALETTE.inkSoft,
            letterSpacing: 2,
          },
        },
        "FRANKLIN BALDO"
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 20,
            color: PALETTE.muted,
            marginTop: 4,
          },
        },
        DOMAIN
      )
    )
  );

  const titleEl = h(
    "div",
    {
      style: {
        display: "flex",
        fontFamily: "Fraunces",
        fontWeight: 700,
        fontSize: titleSize,
        lineHeight: 1.05,
        color: PALETTE.ink,
        marginTop: 44,
        maxWidth: 1040,
      },
    },
    title
  );

  const descEl = description
    ? h(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 28,
            lineHeight: 1.35,
            color: PALETTE.inkSoft,
            marginTop: 18,
            maxWidth: 1040,
          },
        },
        description
      )
    : null;

  const contentColumn = h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        // Slightly more top padding so the byline doesn't collide with the
        // top accent bar.
        paddingTop: 70,
        paddingRight: 80,
        paddingBottom: 80,
        paddingLeft: 80,
      },
    },
    eyebrow,
    titleEl,
    ...(descEl ? [descEl] : [])
  );

  const cobogo = h("img", {
    src: cobogoDataUri,
    width: 760,
    height: 760,
    style: {
      position: "absolute",
      top: -140,
      right: -180,
      width: 760,
      height: 760,
      opacity: 0.38,
    },
  });

  const topAccent = h("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 1200,
      height: 10,
      background: PALETTE.accent,
      display: "flex",
    },
  });

  return h(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundImage: `linear-gradient(180deg, ${PALETTE.bgTop} 0%, ${PALETTE.bgBot} 100%)`,
      },
    },
    cobogo,
    topAccent,
    contentColumn
  );
}

export async function renderOgCard(input: CardInput): Promise<Buffer> {
  const svg = await satori(buildTree(input) as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Fraunces", data: frauncesBold, weight: 700, style: "normal" },
      { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      { name: "Inter", data: interSemibold, weight: 600, style: "normal" },
    ],
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

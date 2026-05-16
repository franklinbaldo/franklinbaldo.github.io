import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";

// Anchor reads to project root so they work in both dev and bundled build.
const read = (p: string) => readFileSync(resolve(process.cwd(), p));

const frauncesBold = read("node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff");
const interRegular = read("node_modules/@fontsource/inter/files/inter-latin-400-normal.woff");
const interSemibold = read("node_modules/@fontsource/inter/files/inter-latin-600-normal.woff");

const avatarDataUri = `data:image/png;base64,${read("public/avatar.png").toString("base64")}`;

const COBOGO_STROKE = "#C9A875";
const cobogoSvg = read("public/cobogo.svg")
  .toString("utf8")
  .replace('stroke="currentColor"', `stroke="${COBOGO_STROKE}"`)
  .replace('stroke-width="0.5"', 'stroke-width="0.7"');
const cobogoDataUri = `data:image/svg+xml;base64,${Buffer.from(cobogoSvg).toString("base64")}`;

type CardKind = "post" | "home";

export interface CardInput {
  title: string;
  description?: string;
  tags?: string[];
  lang?: "en" | "pt";
  kind?: CardKind;
}

const PALETTE = {
  bgTop: "#FAF7F2",
  bgBot: "#EFE9DC",
  accent: "#d97706",
  ink: "#1c1814",
  inkSoft: "#5f503c",
  muted: "#8c785a",
  chipBg: "#d97706",
  chipText: "#ffffff",
};

const SUB_BY_LANG = { en: "Digital Garden", pt: "Jardim Digital" } as const;
const DOMAIN_BY_LANG = {
  en: "franklinbaldo.github.io",
  pt: "franklinbaldo.github.io/pt",
} as const;

const TITLE_HARD_CAP = 70;

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;

// Char-count heuristic: single render, no measure-and-retry.
function fitTypography(title: string): { titleSize: number; descCap: number } {
  const n = title.length;
  if (n <= 14) return { titleSize: 96, descCap: 160 };
  if (n <= 22) return { titleSize: 80, descCap: 160 };
  if (n <= 36) return { titleSize: 64, descCap: 150 };
  if (n <= 52) return { titleSize: 52, descCap: 130 };
  return { titleSize: 44, descCap: 90 };
}

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]): El => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
});

export function buildTree(input: CardInput): El {
  const { title: rawTitle, description: rawDesc, tags = [], lang = "en" } = input;
  const title = truncate(rawTitle, TITLE_HARD_CAP);
  const { titleSize, descCap } = fitTypography(title);
  const description = rawDesc ? truncate(rawDesc, descCap) : undefined;
  const chips = tags.slice(0, 3);

  const eyebrow = h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 22 } },
    h("img", {
      src: avatarDataUri,
      width: 96,
      height: 96,
      style: { display: "flex", width: 96, height: 96, borderRadius: 48 },
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
        "FRANKLIN BALDO",
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 19,
            color: PALETTE.muted,
            marginTop: 4,
          },
        },
        SUB_BY_LANG[lang],
      ),
    ),
  );

  const accentRule = h("div", {
    style: { display: "flex", width: 60, height: 4, background: PALETTE.accent, marginTop: 36 },
  });

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
        marginTop: 28,
        maxWidth: 760,
      },
    },
    title,
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
            maxWidth: 760,
          },
        },
        description,
      )
    : null;

  const chipsRow = h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "auto",
        width: "100%",
      },
    },
    h(
      "div",
      { style: { display: "flex", gap: 10 } },
      ...chips.map((tag) =>
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              paddingLeft: 18,
              paddingRight: 18,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 21,
              background: PALETTE.chipBg,
              color: PALETTE.chipText,
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 20,
            },
          },
          tag,
        ),
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          fontFamily: "Inter",
          fontWeight: 400,
          fontSize: 22,
          color: PALETTE.muted,
        },
      },
      DOMAIN_BY_LANG[lang],
    ),
  );

  const contentColumn = h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        paddingTop: 92,
        paddingRight: 80,
        paddingBottom: 80,
        paddingLeft: 80,
      },
    },
    eyebrow,
    accentRule,
    titleEl,
    ...(descEl ? [descEl] : []),
    chipsRow,
  );

  // Architectural cobogó tile bleeding off the right edge.
  const cobogo = h("img", {
    src: cobogoDataUri,
    width: 760,
    height: 760,
    style: {
      display: "flex",
      position: "absolute",
      top: -140,
      right: -180,
      width: 760,
      height: 760,
      opacity: 0.55,
    },
  });

  // Orange top accent stripe — brand stripe, full bleed.
  const accentBar = h("div", {
    style: {
      display: "flex",
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: 10,
      background: PALETTE.accent,
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
    accentBar,
    contentColumn,
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

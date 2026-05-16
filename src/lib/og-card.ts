import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { t } from "./i18n";

const read = (p: string) => readFileSync(resolve(process.cwd(), p));

const frauncesBold = read("node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff");
const interRegular = read("node_modules/@fontsource/inter/files/inter-latin-400-normal.woff");
const interSemibold = read("node_modules/@fontsource/inter/files/inter-latin-600-normal.woff");

const avatarDataUri = `data:image/png;base64,${read("public/avatar.png").toString("base64")}`;
const monsteraDataUri = `data:image/svg+xml;base64,${read("public/monstera.svg").toString("base64")}`;

// Brick-style cobogó: terracotta fill with the four circles as real
// transparent holes (cream background reads through), with cement-grey
// mortar lines between sub-bricks and around the holes.
const COBOGO_BRICK = "#b56548";
const COBOGO_MORTAR = "#8a8076";
const cobogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <mask id="holes" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
      <rect width="120" height="120" fill="white"/>
      <circle cx="30" cy="30" r="22" fill="black"/>
      <circle cx="90" cy="30" r="22" fill="black"/>
      <circle cx="30" cy="90" r="22" fill="black"/>
      <circle cx="90" cy="90" r="22" fill="black"/>
    </mask>
  </defs>
  <g mask="url(#holes)">
    <rect width="120" height="120" fill="${COBOGO_BRICK}"/>
    <line x1="60" y1="0" x2="60" y2="120" stroke="${COBOGO_MORTAR}" stroke-width="4"/>
    <line x1="0" y1="60" x2="120" y2="60" stroke="${COBOGO_MORTAR}" stroke-width="4"/>
  </g>
</svg>`;
const cobogoPng = await sharp(Buffer.from(cobogoSvg))
  .resize(760, 760)
  .png()
  .toBuffer();
const cobogoDataUri = `data:image/png;base64,${cobogoPng.toString("base64")}`;

type CardKind = "post" | "home";

export interface CardInput {
  title: string;
  description?: string;
  tags?: string[];
  lang?: "en" | "pt";
  kind?: CardKind;
  /** URL path on the site (e.g. "/blog/foo/"). Defaults to "/". */
  path?: string;
  /** PNG buffer for the QR code that points back at this page. */
  qrPng?: Buffer;
}

const PALETTE = {
  bgTop: "#FAF7F2",
  bgBot: "#EFE9DC",
  accent: "#d97706",
  ink: "#1c1814",
  inkSoft: "#5f503c",
  muted: "#8c785a",
  ring: "#ede4d3",
};

const TITLE_HARD_CAP = 90;

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;

// Char-count heuristic — single render. Sized for the narrower text
// column we have once the big avatar is on the left.
function fitTypography(title: string): { titleSize: number; descCap: number } {
  const n = title.length;
  if (n <= 10) return { titleSize: 132, descCap: 130 };
  if (n <= 16) return { titleSize: 116, descCap: 130 };
  if (n <= 24) return { titleSize: 100, descCap: 130 };
  if (n <= 36) return { titleSize: 84, descCap: 120 };
  if (n <= 52) return { titleSize: 70, descCap: 110 };
  if (n <= 72) return { titleSize: 58, descCap: 100 };
  return { titleSize: 48, descCap: 80 };
}

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]): El => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
});

const AVATAR_SIZE = 240;

const QR_SIZE = 200;

export function buildTree(input: CardInput): El {
  const { title: rawTitle, description: rawDesc, lang = "en", qrPng } = input;
  const title = truncate(rawTitle, TITLE_HARD_CAP);
  const { titleSize, descCap } = fitTypography(title);
  const description = rawDesc ? truncate(rawDesc, descCap) : undefined;

  const avatar = h(
    "div",
    {
      style: {
        display: "flex",
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: 16,
        border: `5px solid ${PALETTE.ring}`,
        boxSizing: "border-box",
        overflow: "hidden",
      },
    },
    h("img", {
      src: avatarDataUri,
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      style: { display: "flex", width: "100%", height: "100%", objectFit: "cover" },
    }),
  );

  const eyebrow = h(
    "div",
    {
      style: {
        display: "flex",
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: 18,
        lineHeight: 1.3,
        color: PALETTE.muted,
        letterSpacing: 2,
        width: AVATAR_SIZE,
        textAlign: "center",
        justifyContent: "center",
      },
    },
    t(lang, "og.siteEyebrow").toUpperCase(),
  );

  // When the artistic QR is cached, show it under the avatar. Otherwise
  // fall back to the canonical URL as text — the same fallback chain
  // continues in src/lib/og-qr.ts (slug → home → null).
  const bottomBlock = qrPng
    ? [
        h("img", {
          src: `data:image/png;base64,${qrPng.toString("base64")}`,
          width: QR_SIZE,
          height: QR_SIZE,
          style: { display: "flex", width: QR_SIZE, height: QR_SIZE, borderRadius: 12 },
        }),
        h(
          "div",
          {
            style: {
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.2,
              color: PALETTE.muted,
              letterSpacing: 1.5,
              width: AVATAR_SIZE,
              textAlign: "center",
              justifyContent: "center",
            },
          },
          t(lang, "og.qrHint").toUpperCase(),
        ),
      ]
    : [
        h(
          "div",
          {
            style: {
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 22,
              lineHeight: 1.25,
              color: PALETTE.inkSoft,
              width: AVATAR_SIZE,
              textAlign: "center",
              justifyContent: "center",
              wordBreak: "break-all",
            },
          },
          ("franklinbaldo.github.io" + (input.path || "/")).replace(/\/$/, ""),
        ),
      ];

  const leftColumn = h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        width: AVATAR_SIZE,
      },
    },
    eyebrow,
    avatar,
    ...bottomBlock,
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
            fontSize: 38,
            lineHeight: 1.3,
            color: PALETTE.inkSoft,
            marginTop: 30,
          },
        },
        description,
      )
    : null;

  // Right text column extends all the way to the right edge.
  const textColumn = h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
        gap: 18,
      },
    },
    titleEl,
    ...(descEl ? [descEl] : []),
  );

  const row = h(
    "div",
    {
      style: {
        display: "flex",
        width: "100%",
        height: "100%",
        paddingTop: 60,
        paddingRight: 56,
        paddingBottom: 48,
        paddingLeft: 56,
        gap: 48,
        alignItems: "center",
      },
    },
    leftColumn,
    textColumn,
  );

  // Terracotta cobogó tile on the right, extending left far enough to
  // sit behind the profile photo. Avatar and text live in later
  // siblings, so they stack on top. Lower opacity keeps text legible
  // where the brick passes under the text column.
  const cobogo = h("img", {
    src: cobogoDataUri,
    width: 880,
    height: 720,
    style: {
      display: "flex",
      position: "absolute",
      top: -45,
      right: -120,
      width: 880,
      height: 720,
      opacity: 0.55,
      objectFit: "cover",
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

  // Brazilian garden: jibóia/monstera leaves spilling in from the
  // right corners, in front of the cobogó wall but behind the text
  // and avatar. Bleed off the edges so they read as foliage hanging
  // into the frame, not as a centerpiece.
  const leafA = h("img", {
    src: monsteraDataUri,
    width: 280,
    height: 380,
    style: {
      display: "flex",
      position: "absolute",
      top: -180,
      right: -100,
      width: 280,
      height: 380,
      transform: "rotate(-22deg)",
      opacity: 0.82,
    },
  });
  const leafB = h("img", {
    src: monsteraDataUri,
    width: 240,
    height: 330,
    style: {
      display: "flex",
      position: "absolute",
      bottom: -200,
      right: -70,
      width: 240,
      height: 330,
      transform: "rotate(150deg)",
      opacity: 0.8,
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
    leafA,
    leafB,
    accentBar,
    row,
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

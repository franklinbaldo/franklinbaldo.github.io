import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";
import { t } from "../../lib/i18n";

const SITE = "https://franklinbaldo.github.io";

export const GET: APIRoute = async () => {
  const qrPng = await getQrPng({ slug: "home", url: `${SITE}/`, emoji: "🌱" });
  const png = await renderOgCard({
    title: "Franklin Baldo",
    description: t("en", "og.siteDescription"),
    tags: [],
    lang: "en",
    kind: "home",
    path: "/",
    qrPng,
  });
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

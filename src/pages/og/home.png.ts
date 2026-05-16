import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";
import { t } from "../../lib/i18n";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "home", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "Franklin Baldo",
    description: t("en", "og.siteDescription"),
    tags: [],
    lang: "en",
    kind: "home",
    path: "/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

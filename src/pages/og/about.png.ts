import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";
import { t } from "../../lib/i18n";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "about", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "About Franklin Baldo",
    description: t("en", "og.siteDescription"),
    tags: [],
    lang: "en",
    kind: "home",
    path: "/about/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

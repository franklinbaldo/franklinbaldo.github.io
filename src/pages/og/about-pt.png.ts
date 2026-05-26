import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";
import { t } from "../../lib/i18n";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "about-pt", fallbackSlug: "home-pt" });
  const png = await renderOgCard({
    title: "Sobre Franklin Baldo",
    description: t("pt", "og.siteDescription"),
    tags: [],
    lang: "pt",
    kind: "home",
    path: "/pt/about/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

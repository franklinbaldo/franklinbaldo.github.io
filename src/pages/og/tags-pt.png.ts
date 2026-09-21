import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";
import { t } from "../../lib/i18n";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "tags-pt", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "Etiquetas",
    description: t("pt", "og.siteDescription"),
    tags: ["tópicos", "índice"],
    lang: "pt",
    kind: "home",
    path: "/pt/tags/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";
import { t } from "../../lib/i18n";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "archive", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "Archive",
    description: t("en", "og.siteDescription"),
    tags: ["essays", "writing"],
    lang: "en",
    kind: "home",
    path: "/archive/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

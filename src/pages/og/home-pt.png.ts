import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { t } from "../../lib/i18n";

export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    title: "Franklin Baldo",
    description: t("pt", "og.siteDescription"),
    tags: [],
    lang: "pt",
    kind: "home",
    path: "/pt/",
  });
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

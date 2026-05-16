import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";

export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    title: "Franklin Baldo",
    description: "Essays on AI agency, process metaphysics, and the architecture of legal systems.",
    tags: [],
    lang: "en",
    kind: "home",
  });
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

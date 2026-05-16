import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";

export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    title: "Franklin Baldo",
    description: "Ensaios sobre agentes de IA, metafísica do processo e a arquitetura dos sistemas jurídicos.",
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

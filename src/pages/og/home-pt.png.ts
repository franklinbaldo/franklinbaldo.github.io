import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";

export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    title: "Franklin Baldo",
    description: "Ensaios sobre agência de IA, metafísica do processo e a arquitetura dos sistemas jurídicos.",
    lang: "pt",
    kind: "home",
  });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};

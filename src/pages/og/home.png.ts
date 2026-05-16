import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";

export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    title: "Franklin Baldo",
    description: "Essays on AI agency, process metaphysics, and the architecture of legal systems.",
  });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};

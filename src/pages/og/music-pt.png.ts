import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "music-pt", fallbackSlug: "home-pt" });
  const png = await renderOgCard({
    title: "Músicas",
    description: "Músicas e playlists publicadas no Suno por Franklin Baldo.",
    tags: ["música", "suno"],
    lang: "pt",
    kind: "home",
    path: "/pt/musicas/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

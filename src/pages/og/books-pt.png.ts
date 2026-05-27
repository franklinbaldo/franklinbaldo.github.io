import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "books-pt", fallbackSlug: "home-pt" });
  const png = await renderOgCard({
    title: "Livros",
    description:
      "Livros que li e gostei — seleção da minha estante no Goodreads.",
    tags: ["leitura", "livros"],
    lang: "pt",
    kind: "home",
    path: "/pt/livros/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

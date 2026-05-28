import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "projects-pt", fallbackSlug: "home-pt" });
  const png = await renderOgCard({
    title: "Projetos",
    description:
      "Repositórios públicos e trabalho de código aberto de Franklin Baldo.",
    tags: ["código", "github"],
    lang: "pt",
    kind: "home",
    path: "/pt/projects/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "projects", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "Projects",
    description: "Public repositories and open-source work by Franklin Baldo.",
    tags: ["code", "github"],
    lang: "en",
    kind: "home",
    path: "/projects/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

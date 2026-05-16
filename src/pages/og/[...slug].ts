import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";

// Allow skipping OG generation in offline environments. CI does not set
// this; production builds always emit cards.
const SKIP = process.env.SKIP_OG === "1";

const posts = SKIP ? [] : await getCollection("blog");
const pages: Record<
  string,
  { data: { title: string; description?: string; tags?: string[] } }
> = Object.fromEntries(posts.map((post) => [post.id, post]));

pages["_site"] = {
  data: {
    title: "Franklin Baldo",
    description: "Lawyer and State Attorney. Essays on AI agency, process metaphysics, and legal design.",
    tags: ["digital-garden"],
  },
};

const FRAUNCES_600 = "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-600-normal.ttf";
const FRAUNCES_400 = "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-400-normal.ttf";

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

const route = await OGImageRoute({
  param: "slug",
  pages,
  getImageOptions: (_path, post) => {
    const firstTag = post.data.tags?.[0];
    const desc = [
      trunc(post.data.description ?? "", 95),
      firstTag ? `#${firstTag}` : "",
    ]
      .filter(Boolean)
      .join("  ·  ");
    return {
      title: trunc(post.data.title, 50),
      description: desc,
      logo: {
        path: "./public/avatar-og.png",
        size: [110, 110],
      },
      bgImage: {
        path: "./public/og-bg.png",
        fit: "cover",
      },
      // Orange top accent bar — Pico primary.
      border: { color: [245, 107, 61], width: 10, side: "block-start" },
      padding: 64,
      font: {
        title: {
          families: ["Fraunces"],
          weight: "SemiBold",
          color: [237, 228, 211],
          size: 72,
          lineHeight: 1.08,
        },
        description: {
          families: ["Fraunces"],
          weight: "Normal",
          color: [157, 145, 126],
          size: 30,
          lineHeight: 1.35,
        },
      },
      fonts: [FRAUNCES_600, FRAUNCES_400],
      quality: 92,
    };
  },
});

export const getStaticPaths = route.getStaticPaths;
export const GET = route.GET;

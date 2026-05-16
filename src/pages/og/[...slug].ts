import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";

// Allow skipping OG generation in offline environments. CI does not set
// this; production builds always emit cards.
const SKIP = process.env.SKIP_OG === "1";

const posts = SKIP ? [] : await getCollection("blog");
const pages: Record<string, { data: { title: string; description: string } }> =
  Object.fromEntries(posts.map((post) => [post.id, post]));

pages["_site"] = {
  data: {
    title: "Franklin Baldo",
    description: "Lawyer and State Attorney. Essays on AI agency, process metaphysics, and legal design.",
  },
};

const FRAUNCES_600 = "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-600-normal.ttf";
const FRAUNCES_400 = "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-400-normal.ttf";

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

const route = await OGImageRoute({
  param: "slug",
  pages,
  getImageOptions: (_path, post) => ({
    title: trunc(post.data.title, 60),
    description: trunc(post.data.description ?? "", 95),
    logo: {
      path: "./public/avatar-og.png",
      size: [120, 120],
    },
    bgGradient: [
      [244, 236, 220],
      [239, 229, 208],
    ],
    padding: 72,
    font: {
      title: {
        families: ["Fraunces"],
        weight: "SemiBold",
        size: 68,
        color: [42, 36, 29],
        lineHeight: 1.1,
      },
      description: {
        families: ["Fraunces"],
        weight: "Normal",
        size: 32,
        color: [107, 98, 88],
        lineHeight: 1.35,
      },
    },
    fonts: [FRAUNCES_600, FRAUNCES_400],
    quality: 92,
  }),
});

export const getStaticPaths = route.getStaticPaths;
export const GET = route.GET;

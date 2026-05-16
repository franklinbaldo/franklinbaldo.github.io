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

const FRAUNCES_700 = "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-700-normal.ttf";
const FRAUNCES_400 = "https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-400-normal.ttf";

const route = await OGImageRoute({
  param: "slug",
  pages,
  getImageOptions: (_path, post) => ({
    title: post.data.title,
    description: post.data.description,
    bgGradient: [
      [248, 235, 213],
      [228, 205, 175],
    ],
    padding: 96,
    font: {
      title: {
        families: ["Fraunces"],
        weight: "Bold",
        size: 84,
        color: [74, 53, 32],
        lineHeight: 1.1,
      },
      description: {
        families: ["Fraunces"],
        weight: "Normal",
        size: 36,
        color: [124, 95, 67],
        lineHeight: 1.4,
      },
    },
    fonts: [FRAUNCES_700, FRAUNCES_400],
    quality: 90,
  }),
});

export const getStaticPaths = route.getStaticPaths;
export const GET = route.GET;

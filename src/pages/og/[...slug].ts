import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";

// Allow skipping OG generation in offline environments. CI does not set
// this; production builds always emit cards.
const SKIP = process.env.SKIP_OG === "1";

const posts = SKIP ? [] : await getCollection("blog");
const pages = Object.fromEntries(posts.map((post) => [post.id, post]));

const route = await OGImageRoute({
  param: "slug",
  pages,
  getImageOptions: (_path, post) => ({
    title: post.data.title,
    description: post.data.description,
    bgGradient: [
      [253, 252, 251],
      [238, 238, 238],
    ],
    border: { color: [26, 26, 26], width: 8, side: "inline-start" },
    padding: 80,
    font: {
      title: { weight: "Bold", size: 64, color: [17, 17, 17] },
      description: { size: 32, color: [102, 102, 102], lineHeight: 1.4 },
    },
  }),
});

export const getStaticPaths = route.getStaticPaths;
export const GET = route.GET;

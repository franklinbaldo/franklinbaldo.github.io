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
  getImageOptions: (_path, post) => {
    // Tags line shown after description — first tag as a category hint.
    const firstTag = post.data.tags?.[0];
    const desc = [
      post.data.description ?? "",
      firstTag ? `#${firstTag}` : "",
    ]
      .filter(Boolean)
      .join("  ·  ");

    return {
      title: post.data.title,
      description: desc,
      // Warm dark palette — matches the blog's dark theme tokens.
      // Background: --pico-background-color dark (#1a1612 → #221c16)
      bgGradient: [
        [26, 22, 18],
        [34, 28, 22],
      ],
      // Top accent bar in Pico orange primary (#f56b3d)
      border: { color: [245, 107, 61], width: 8, side: "block-start" },
      padding: 72,
      font: {
        // --pico-color dark: #ede4d3 (warm cream)
        title: { weight: "Bold", size: 56, color: [237, 228, 211], lineHeight: 1.2 },
        // --pico-muted-color dark: #9d917e (warm gray)
        description: { size: 26, color: [157, 145, 126], lineHeight: 1.5 },
      },
    };
  },
});

export const getStaticPaths = route.getStaticPaths;
export const GET = route.GET;

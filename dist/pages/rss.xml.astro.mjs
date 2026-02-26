import rss from '@astrojs/rss';
import { g as getCollection } from '../chunks/_astro_content_DHjRGdTC.mjs';
export { renderers } from '../renderers.mjs';

async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'The Chronicle - Franklin Baldo',
    description: 'A digital memory palace. Thoughts on AI, philosophy, and the future.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

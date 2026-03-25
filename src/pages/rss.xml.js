import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');

  // Sort posts by date descending
  posts.sort((a, b) => {
    const aDate = a.data.date || a.data.pubDate;
    const bDate = b.data.date || b.data.pubDate;
    if (!aDate || !bDate) return 0;
    return bDate.valueOf() - aDate.valueOf();
  });

  return rss({
    title: 'The Chronicle - Franklin Baldo',
    description: 'A digital memory palace. Thoughts on AI, philosophy, and the future.',
    site: context.site,
    xmlns: { dc: 'http://purl.org/dc/elements/1.1/' },
    items: posts.map((post) => {
      const item = {
        title: post.data.title,
        pubDate: post.data.date || post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
      };

      if (post.data.tags && post.data.tags.length > 0) {
        item.categories = post.data.tags;
      }

      if (post.data.author) {
        item.customData = `<dc:creator>${post.data.author}</dc:creator>`;
      }

      return item;
    }),
    customData: `<language>en-us</language>`,
  });
}

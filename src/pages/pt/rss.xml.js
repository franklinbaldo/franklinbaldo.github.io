import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .filter((post) => (post.data.lang ?? 'en') === 'pt')
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Franklin Baldo (Português)',
    description:
      'Advogado e Procurador do Estado. Explorando as interseções entre metafísica do processo, agentes de IA e a arquitetura dos sistemas jurídicos.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      categories: post.data.tags ?? [],
    })),
    customData: '<language>pt-br</language>',
  });
}

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { blogAudioEpisodes } from '../lib/blog-audio.js';
import { postUrl } from '../lib/i18n';
import { isPublished } from '../lib/publish';

export async function GET(context) {
  const posts = await getCollection('blog');
  const byId = new Map(posts.filter(isPublished).map((post) => [post.id, post]));
  const episodes = blogAudioEpisodes()
    .map((episode) => ({ episode, post: byId.get(episode.post_id) }))
    .filter(({ post }) => Boolean(post))
    .sort((a, b) => Date.parse(b.episode.published_at) - Date.parse(a.episode.published_at));

  return rss({
    title: 'Franklin Baldo — Áudio',
    description: 'Versões em áudio das matérias publicadas no blog de Franklin Baldo.',
    site: context.site,
    customData: '<language>pt-BR</language><itunes:author>Franklin Baldo</itunes:author><itunes:explicit>false</itunes:explicit>',
    xmlns: { itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd' },
    items: episodes.map(({ episode, post }) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(episode.published_at),
      link: postUrl(post),
      customData: `<guid isPermaLink="false">${episode.guid}</guid><enclosure url="${episode.media_url}" length="${episode.bytes}" type="${episode.mime_type}"/><itunes:duration>${Math.round(episode.duration_seconds)}</itunes:duration>`,
    })),
  });
}

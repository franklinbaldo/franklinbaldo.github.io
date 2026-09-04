import { listWorks, publishedEpisodes } from "../../../audiobook/catalog.js";
import { buildPodcastXml } from "../../../audiobook/podcast.js";

export function getStaticPaths() {
  return listWorks()
    .filter((work) => work.metadata.podcast?.enabled === true)
    .map((work) => ({ params: { workId: work.workId }, props: { work } }));
}

export function GET({ props, site }) {
  if (!site)
    throw new Error("Astro site URL is required to generate podcast feeds");
  const { work } = props;
  const episodes = publishedEpisodes(work);
  const xml = buildPodcastXml({ work, episodes, siteUrl: site });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

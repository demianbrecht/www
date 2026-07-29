import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { byNewest, postUrl } from '../utils';

export const GET: APIRoute = async (context) => {
  // Always exclude drafts from the feed, even in dev.
  const posts = (await getCollection('posts', (p) => !p.data.draft)).sort(byNewest);

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // context.site is the bare origin; the channel link needs the base path too.
    site: new URL(import.meta.env.BASE_URL, context.site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: post.data.tags,
      // postUrl() includes the base path; rss() resolves it against `site`.
      link: postUrl(post.id),
    })),
    customData: '<language>en-us</language>',
  });
};

// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// Deployed to GitHub Pages under the custom apex domain demianbrecht.com, which
// serves from the root — so `site` is the bare origin and there is no base path
// prefix. Absolute URLs (canonical, RSS, sitemap) are derived from `site`.
// Override with SITE_URL / BASE_PATH when deploying elsewhere (e.g. a project
// page served from a /<repo> subpath).
const site = process.env.SITE_URL ?? 'https://demianbrecht.com';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      // Neutral dark theme to match the slate surfaces.
      theme: 'github-dark-default',
      wrap: true,
    },
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { class: 'heading-anchor' } }],
    ],
  },
  build: {
    // post/foo/index.html — lets Pages serve clean URLs without a redirect layer.
    format: 'directory',
  },
});

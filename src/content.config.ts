import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { assertUniqueFlatPostIds, flatPostId } from './content-ids';

const postsBase = './src/content/posts';
const postsPath = fileURLToPath(new URL('./content/posts', import.meta.url));
assertUniqueFlatPostIds(
  readdirSync(postsPath, { recursive: true, encoding: 'utf8' })
    .filter((entry) => /\.(?:md|mdx)$/i.test(entry)),
);

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: postsBase,
    generateId: ({ entry }) => flatPostId(entry),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      archived: z.boolean().default(false),
      originallyPublished: z.object({
        publisher: z.string().min(1),
        url: z.string().url(),
      }).optional(),
      /** Optimized at build time; rendered atop the full post and as the social-card image. */
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
    }),
});

const series = defineCollection({
  loader: glob({
    pattern: '**/index.{yaml,yml}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.split('/').at(-2)!,
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    posts: z.array(reference('posts')).min(1),
  }),
});

export const collections = { posts, series };

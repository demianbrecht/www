import type { CollectionEntry } from 'astro:content';

/**
 * Join the configured base path (`/` for the apex domain) with a site-relative
 * route, collapsing duplicate slashes.
 */
export function url(href: string): string {
  return `${import.meta.env.BASE_URL}/${href}`.replace(/\/{2,}/g, '/');
}

export function postUrl(id: string): string {
  return url(`posts/${id}`);
}

export function tagUrl(tag: string): string {
  return url(`tags/${slugifyTag(tag)}`);
}

/** Tags are display strings; slugs are what appear in URLs. */
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Rough reading time. 200 wpm over the raw MDX body — close enough for a
 * meta line, and avoids pulling in a parser just to strip syntax.
 */
export function readingTime(body: string | undefined): string {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

type Post = CollectionEntry<'posts'>;

/** Drafts are hidden in production builds but visible while developing. */
export function isVisible(post: Post): boolean {
  return import.meta.env.DEV || !post.data.draft;
}

export function byNewest(a: Post, b: Post): number {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}

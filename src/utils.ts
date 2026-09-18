import type { CollectionEntry } from 'astro:content';

/**
 * Join the configured base path (`/` for the apex domain) with a site-relative
 * route, collapsing duplicate slashes.
 */
export function url(href: string, baseUrl: string = import.meta.env.BASE_URL): string {
  return `${baseUrl}/${href}`.replace(/\/{2,}/g, '/');
}

export function postUrl(id: string, baseUrl: string = import.meta.env.BASE_URL): string {
  return url(`posts/${id}`, baseUrl);
}

export function tagUrl(tag: string, baseUrl: string = import.meta.env.BASE_URL): string {
  return url(`tags/${slugifyTag(tag)}`, baseUrl);
}

/** Lowercase, hyphenated slug from an arbitrary display string. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Tags are display strings; slugs are what appear in URLs. */
export function slugifyTag(tag: string): string {
  return slugify(tag);
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

/** Archived posts remain published but are omitted from the homepage timeline. */
export function isCurrent(post: Post): boolean {
  return isVisible(post) && !post.data.archived;
}

export function byNewest(a: Post, b: Post): number {
  const dateOrder = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  return dateOrder || a.id.localeCompare(b.id);
}

/** Stable display identifiers, assigned oldest-first so new posts append. */
export function buildEntryIndex(posts: Post[]): ReadonlyMap<string, string> {
  const chronological = [...posts].sort((a, b) => {
    const dateOrder = a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
    return dateOrder || a.id.localeCompare(b.id);
  });
  const width = Math.max(3, String(chronological.length).length);

  return new Map(
    chronological.map((post, index) => [
      post.id,
      `ENTRY_${String(index + 1).padStart(width, '0')}`,
    ]),
  );
}

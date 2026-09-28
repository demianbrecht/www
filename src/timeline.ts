export interface TimelinePost {
  id: string;
  data: {
    title: string;
    pubDate: Date;
    draft: boolean;
  };
  visible?: boolean;
}

export interface SeriesMember<T extends TimelinePost = TimelinePost> {
  post: T;
  part: number;
}

export interface SeriesMetadata {
  id: string;
  title: string;
  description: string;
  posts: Array<string | { id: string }>;
}

export interface SeriesCollectionEntry {
  id: string;
  data: Omit<SeriesMetadata, 'id'>;
}

export type TimelineItem<T extends TimelinePost = TimelinePost> =
  | { type: 'post'; post: T; pubDate: Date }
  | {
      type: 'series';
      series: SeriesMetadata;
      members: SeriesMember<T>[];
      pubDate: Date;
    };

function referenceId(reference: string | { id: string }): string {
  return typeof reference === 'string' ? reference : reference.id;
}

export function buildTimeline<T extends TimelinePost>(
  posts: T[],
  seriesEntries: SeriesMetadata[],
): TimelineItem<T>[] {
  const postsById = new Map(posts.map((post) => [post.id, post]));
  const membership = new Map<string, string>();
  const items: TimelineItem<T>[] = [];

  for (const series of seriesEntries) {
    const seen = new Set<string>();
    const members: SeriesMember<T>[] = [];

    for (const [index, reference] of series.posts.entries()) {
      const id = referenceId(reference);
      if (seen.has(id)) {
        throw new Error(`Duplicate post reference ${id} in series ${series.id}`);
      }
      seen.add(id);

      const existingSeries = membership.get(id);
      if (existingSeries) {
        throw new Error(
          `Post ${id} belongs to both ${existingSeries} and ${series.id}`,
        );
      }
      membership.set(id, series.id);

      const post = postsById.get(id);
      if (post && post.visible !== false) {
        members.push({ post, part: index + 1 });
      }
    }

    if (members.length > 0) {
      const pubDate = members.reduce(
        (latest, { post }) => post.data.pubDate > latest ? post.data.pubDate : latest,
        members[0].post.data.pubDate,
      );
      items.push({
        type: 'series',
        series,
        members,
        pubDate,
      });
    }
  }

  for (const post of posts) {
    if (
      post.visible !== false
      && !membership.has(post.id)
    ) {
      items.push({ type: 'post', post, pubDate: post.data.pubDate });
    }
  }

  return items.sort((a, b) => {
    const dateOrder = b.pubDate.valueOf() - a.pubDate.valueOf();
    if (dateOrder) return dateOrder;

    const aId = a.type === 'post' ? a.post.id : a.series.id;
    const bId = b.type === 'post' ? b.post.id : b.series.id;
    return aId.localeCompare(bId);
  });
}

export function orderPostsForNavigation<T extends TimelinePost>(
  posts: T[],
  seriesEntries: SeriesMetadata[],
): T[] {
  const positions = new Map<string, { seriesId: string; part: number }>();

  for (const series of seriesEntries) {
    series.posts.forEach((reference, index) => {
      positions.set(referenceId(reference), {
        seriesId: series.id,
        part: index + 1,
      });
    });
  }

  return [...posts].sort((a, b) => {
    const dateOrder = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    if (dateOrder) return dateOrder;

    const aPosition = positions.get(a.id);
    const bPosition = positions.get(b.id);
    const groupOrder = (aPosition?.seriesId ?? a.id).localeCompare(
      bPosition?.seriesId ?? b.id,
    );
    if (groupOrder) return groupOrder;

    if (aPosition?.seriesId === bPosition?.seriesId && aPosition && bPosition) {
      return aPosition.part - bPosition.part;
    }

    return a.id.localeCompare(b.id);
  });
}

export function seriesMetadata(entry: SeriesCollectionEntry): SeriesMetadata {
  return { id: entry.id, ...entry.data };
}

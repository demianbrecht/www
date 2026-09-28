import { describe, expect, it } from 'vitest';
import {
  buildTimeline,
  orderPostsForNavigation,
  type SeriesMetadata,
  type TimelinePost,
} from './timeline';

const post = (
  id: string,
  pubDate: string,
  options: { draft?: boolean; visible?: boolean } = {},
): TimelinePost => ({
  id,
  data: {
    title: id,
    pubDate: new Date(pubDate),
    draft: options.draft ?? false,
  },
  visible: options.visible ?? true,
});

const series = (
  id: string,
  posts: string[],
): SeriesMetadata => ({
  id,
  title: id,
  description: `${id} description`,
  posts,
});

describe('buildTimeline', () => {
  it('returns one reverse-chronological timeline of standalone posts and series', () => {
    const newest = post('newest', '2026-08-01');
    const first = post('inner-sourcing/first', '2018-04-01');
    const second = post('inner-sourcing/second', '2018-04-02');
    const oldest = post('oldest', '2017-01-01');
    const innerSourcing = series(
      'inner-sourcing',
      ['inner-sourcing/first', 'inner-sourcing/second'],
    );

    expect(
      buildTimeline([oldest, second, newest, first], [innerSourcing]),
    ).toEqual([
      { type: 'post', post: newest, pubDate: newest.data.pubDate },
      {
        type: 'series',
        series: innerSourcing,
        members: [
          { post: first, part: 1 },
          { post: second, part: 2 },
        ],
        pubDate: second.data.pubDate,
      },
      { type: 'post', post: oldest, pubDate: oldest.data.pubDate },
    ]);
  });

  it('orders series members by metadata references rather than post dates', () => {
    const first = post('ordered-series/first', '2026-01-03');
    const second = post('ordered-series/second', '2026-01-01');
    const third = post('ordered-series/third', '2026-01-02');
    const metadata = series(
      'ordered-series',
      [
        'ordered-series/second',
        'ordered-series/third',
        'ordered-series/first',
      ],
    );

    const [item] = buildTimeline([first, second, third], [metadata]);

    expect(item).toMatchObject({
      type: 'series',
      members: [
        { post: second, part: 1 },
        { post: third, part: 2 },
        { post: first, part: 3 },
      ],
    });
  });

  it('omits series members as top-level post items', () => {
    const member = post('one-series/member', '2026-06-01');
    const standalone = post('standalone', '2026-05-01');

    const timeline = buildTimeline(
      [member, standalone],
      [series('one-series', ['one-series/member'])],
    );

    expect(timeline).toHaveLength(2);
    expect(timeline.filter((item) => item.type === 'post')).toEqual([
      { type: 'post', post: standalone, pubDate: standalone.data.pubDate },
    ]);
  });

  it('rejects duplicate membership across series', () => {
    const shared = post('shared-post', '2026-01-01');

    expect(() =>
      buildTimeline(
        [shared],
        [
          series('first-series', ['shared-post']),
          series('second-series', ['shared-post']),
        ],
      ),
    ).toThrow(/shared-post.*first-series.*second-series/i);
  });

  it('rejects duplicate references within one series', () => {
    const repeated = post('repeated-post', '2026-01-01');

    expect(() =>
      buildTimeline(
        [repeated],
        [series('duplicate-series', ['repeated-post', 'repeated-post'])],
      ),
    ).toThrow(/duplicate.*repeated-post.*duplicate-series/i);
  });

  it('honors explicit visibility without interpreting draft metadata', () => {
    const hiddenMember = post('partially-visible/hidden', '2026-01-01', {
      visible: false,
    });
    const visibleMember = post('partially-visible/visible', '2026-01-02');
    const draft = post('draft', '2026-01-03', { draft: true });

    const timeline = buildTimeline(
      [hiddenMember, draft, visibleMember],
      [
        series(
          'partially-visible',
          ['partially-visible/hidden', 'partially-visible/visible'],
        ),
      ],
    );

    expect(timeline).toEqual([
      {
        type: 'series',
        series: expect.objectContaining({ id: 'partially-visible' }),
        members: [{ post: visibleMember, part: 2 }],
        pubDate: visibleMember.data.pubDate,
      },
      { type: 'post', post: draft, pubDate: draft.data.pubDate },
    ]);
    const [seriesItem] = timeline;
    expect(seriesItem.type === 'series' && seriesItem.members.map(({ post }) => post.id))
      .not.toContain('partially-visible/hidden');
  });

  it('keeps a draft series member when the caller includes it', () => {
    const draftMember = post('draft-series/member', '2026-01-01', {
      draft: true,
    });
    const metadata = series('draft-series', [draftMember.id]);

    expect(buildTimeline([draftMember], [metadata])).toEqual([
      {
        type: 'series',
        series: metadata,
        members: [{ post: draftMember, part: 1 }],
        pubDate: draftMember.data.pubDate,
      },
    ]);
  });

  it('does not turn a referenced member absent from the visible posts into a standalone item', () => {
    const visibleMember = post('partially-visible/visible', '2026-01-02');
    const standalone = post('standalone', '2026-01-03');

    const timeline = buildTimeline(
      [standalone, visibleMember],
      [
        series(
          'partially-visible',
          ['partially-visible/hidden', 'partially-visible/visible'],
        ),
      ],
    );

    expect(timeline).toEqual([
      {
        type: 'series',
        series: expect.objectContaining({ id: 'partially-visible' }),
        members: [{ post: visibleMember, part: 2 }],
        pubDate: visibleMember.data.pubDate,
      },
      { type: 'post', post: standalone, pubDate: standalone.data.pubDate },
    ]);
    const [seriesItem] = timeline;
    expect(seriesItem.type === 'series' && seriesItem.members.map(({ post }) => post.id))
      .not.toContain('partially-visible/hidden');
  });

  it('preserves declared part numbers and total when the middle member is absent', () => {
    const first = post('partial/first', '2026-01-01');
    const third = post('partial/third', '2026-01-03');
    const metadata = series('partial', [
      'partial/first',
      'partial/hidden',
      'partial/third',
    ]);

    expect(buildTimeline([first, third], [metadata])).toEqual([
      {
        type: 'series',
        series: metadata,
        members: [
          { post: first, part: 1 },
          { post: third, part: 3 },
        ],
        pubDate: third.data.pubDate,
      },
    ]);
  });

  it('uses metadata order for equal-dated series navigation', () => {
    const first = post('ordered/first', '2026-01-01');
    const second = post('ordered/second', '2026-01-01');
    const third = post('ordered/third', '2026-01-01');
    const standalone = post('aaa-standalone', '2026-01-01');
    const metadata = series('ordered', [
      first.id,
      second.id,
      third.id,
    ]);

    expect(orderPostsForNavigation(
      [first, standalone, third, second],
      [metadata],
    )).toEqual([standalone, first, second, third]);
  });

  it('orders equal-dated timeline items by stable ID', () => {
    const alpha = post('alpha', '2026-01-01');
    const bravo = post('bravo', '2026-01-01');

    expect(buildTimeline([bravo, alpha], [])).toEqual([
      { type: 'post', post: alpha, pubDate: alpha.data.pubDate },
      { type: 'post', post: bravo, pubDate: bravo.data.pubDate },
    ]);
  });
});

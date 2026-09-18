import { describe, expect, it } from 'vitest';
import {
  findPublicationTransitions,
  parseNameStatus,
  parsePost,
} from './publication-transitions.mjs';
import { broadcastFor } from './publish-kit-broadcasts.mjs';

function post({ title = 'A transmission', description = 'A useful summary.', draft } = {}) {
  const draftLine = draft === undefined ? '' : `draft: ${draft}\n`;
  return `---\ntitle: '${title.replaceAll("'", "''")}'\ndescription: >-\n  ${description}\n${draftLine}---\n\nBody\n`;
}

function transitions(changes, files) {
  return findPublicationTransitions(changes, (revision, path) => files[`${revision}:${path}`]);
}

describe('publication transitions', () => {
  it('selects an added public post', () => {
    const path = 'src/content/posts/new-post.mdx';
    expect(transitions(
      [{ status: 'A', newPath: path }],
      { [`after:${path}`]: post({ draft: false }) },
    )).toMatchObject([{ id: 'new-post', path, title: 'A transmission' }]);
  });

  it('ignores an added draft', () => {
    const path = 'src/content/posts/new-post.mdx';
    expect(transitions(
      [{ status: 'A', newPath: path }],
      { [`after:${path}`]: post({ draft: true }) },
    )).toEqual([]);
  });

  it('selects a draft that becomes public', () => {
    const path = 'src/content/posts/new-post.mdx';
    expect(transitions(
      [{ status: 'M', oldPath: path, newPath: path }],
      {
        [`before:${path}`]: post({ draft: true }),
        [`after:${path}`]: post(),
      },
    )).toHaveLength(1);
  });

  it('ignores edits to an already-public post', () => {
    const path = 'src/content/posts/existing.mdx';
    expect(transitions(
      [{ status: 'M', oldPath: path, newPath: path }],
      {
        [`before:${path}`]: post({ description: 'Before.', draft: false }),
        [`after:${path}`]: post({ description: 'After.', draft: false }),
      },
    )).toEqual([]);
  });

  it('does not treat a public rename as a new publication', () => {
    const oldPath = 'src/content/posts/old-name.mdx';
    const newPath = 'src/content/posts/series/new-name.mdx';
    expect(transitions(
      parseNameStatus(`R100\0${oldPath}\0${newPath}\0`),
      {
        [`before:${oldPath}`]: post({ draft: false }),
        [`after:${newPath}`]: post({ draft: false }),
      },
    )).toEqual([]);
  });

  it('returns every post newly made public in a push', () => {
    const added = 'src/content/posts/added.mdx';
    const changed = 'src/content/posts/changed.mdx';
    const draft = 'src/content/posts/still-draft.mdx';
    expect(transitions(
      [
        { status: 'A', newPath: added },
        { status: 'M', oldPath: changed, newPath: changed },
        { status: 'A', newPath: draft },
      ],
      {
        [`after:${added}`]: post({ title: 'Added' }),
        [`before:${changed}`]: post({ title: 'Changed', draft: true }),
        [`after:${changed}`]: post({ title: 'Changed', draft: false }),
        [`after:${draft}`]: post({ title: 'Draft', draft: true }),
      },
    ).map(({ id }) => id)).toEqual(['added', 'changed']);
  });
});

describe('git change parsing', () => {
  it('retains both sides of a rename', () => {
    expect(parseNameStatus(
      'R100\0src/content/posts/old.mdx\0src/content/posts/new.mdx\0',
    )).toEqual([{
      status: 'R',
      oldPath: 'src/content/posts/old.mdx',
      newPath: 'src/content/posts/new.mdx',
    }]);
  });

  it('feeds both revisions of modified posts into transition detection', () => {
    const edited = 'src/content/posts/edited.mdx';
    const published = 'src/content/posts/published.mdx';
    const changes = parseNameStatus(`M\0${edited}\0M\0${published}\0`);

    expect(transitions(changes, {
      [`before:${edited}`]: post({ title: 'Edited', draft: false }),
      [`after:${edited}`]: post({ title: 'Edited again', draft: false }),
      [`before:${published}`]: post({ title: 'Published', draft: true }),
      [`after:${published}`]: post({ title: 'Published', draft: false }),
    }).map(({ id }) => id)).toEqual(['published']);
  });
});

describe('post frontmatter parsing', () => {
  it('folds descriptions and treats an omitted draft flag as public', () => {
    expect(parsePost(`---\ntitle: 'Dude, I''m here'\ndescription: >-\n  First line\n  second line\n---\n`)).toEqual({
      title: "Dude, I'm here",
      description: 'First line second line',
      draft: false,
    });
  });
});

describe('Kit broadcast payload', () => {
  it('schedules a private broadcast to all subscribers', () => {
    const description = `This & that. ${'A full description. '.repeat(10)}`.trim();
    const payload = broadcastFor(
      {
        id: 'a-post',
        title: 'A <post>',
        description,
      },
      new URL('https://demianbrecht.com'),
      '[www-publication:sha:path]',
      '2026-09-18T12:00:00.000Z',
    );

    expect(payload).toMatchObject({
      public: false,
      published_at: '2026-09-18T12:00:00.000Z',
      send_at: '2026-09-18T12:01:00.000Z',
      preview_text: description,
      description: expect.stringContaining('[www-publication:sha:path]'),
      subscriber_filter: [{ all: [{ type: 'all_subscribers' }] }],
    });
    expect(payload.content).toContain('A &lt;post&gt;');
    expect(payload.content).toContain('https://demianbrecht.com/posts/a-post/');
  });
});

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findPublicationTransitions,
  parseNameStatus,
} from './publication-transitions.mjs';

const API_ROOT = 'https://api.kit.com/v4';
const ZERO_SHA = /^0+$/;
const SHA = /^[0-9a-f]{40}$/i;

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

export function changedPosts(before, after) {
  const args = ZERO_SHA.test(before)
    ? ['diff-tree', '--root', '--no-commit-id', '--name-status', '-z', '-r', '-M', after, '--', 'src/content/posts']
    : ['diff', '--name-status', '-z', '-M', before, after, '--', 'src/content/posts'];
  return parseNameStatus(git(args));
}

function readAt(revisions, which, path) {
  return git(['show', `${revisions[which]}:${path}`]);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function kitRequest(apiKey, path, init = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': apiKey,
      ...init.headers,
    },
  });
  const body = await response.text();

  if (!response.ok) {
    const detail = body.slice(0, 1_000);
    throw new Error(`Kit API ${response.status} ${response.statusText}: ${detail}`);
  }

  return body ? JSON.parse(body) : {};
}

async function existingDescriptions(apiKey) {
  const descriptions = new Set();
  let after;

  do {
    const params = new URLSearchParams({ per_page: '100' });
    if (after) params.set('after', after);
    const result = await kitRequest(apiKey, `/broadcasts?${params}`);

    for (const broadcast of result.broadcasts ?? []) {
      if (typeof broadcast.description === 'string') {
        descriptions.add(broadcast.description);
      }
    }

    const pagination = result.pagination;
    if (!pagination?.has_next_page) break;
    if (!pagination.end_cursor || pagination.end_cursor === after) {
      throw new Error('Kit returned an invalid broadcast pagination cursor');
    }
    after = pagination.end_cursor;
  } while (after);

  return descriptions;
}

function markerFor(after, path) {
  return `[www-publication:${after}:${path}]`;
}

export function broadcastFor(post, siteUrl, marker, now) {
  const postUrl = new URL(`/posts/${encodeURIComponent(post.id)}/`, siteUrl).href;
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.description);
  const url = escapeHtml(postUrl);

  return {
    subject: `New post: ${post.title}`,
    preview_text: post.description,
    description: `New post: ${post.title} ${marker}`,
    content: `<h1>${title}</h1><p>${description}</p><p><a href="${url}">Read the post</a></p>`,
    public: false,
    published_at: now,
    send_at: new Date(Date.parse(now) + 60_000).toISOString(),
    subscriber_filter: [{ all: [{ type: 'all_subscribers' }] }],
  };
}

export async function publishNewPosts({ before, after, apiKey, siteUrl }) {
  if (!SHA.test(before) || !SHA.test(after)) {
    throw new Error('BEFORE_SHA and AFTER_SHA must be full Git commit hashes');
  }

  const changes = changedPosts(before, after);
  const revisions = { before, after };
  const posts = findPublicationTransitions(
    changes,
    (which, path) => readAt(revisions, which, path),
  );

  if (posts.length === 0) {
    console.log('No posts became public in this push.');
    return;
  }
  if (!apiKey) throw new Error('KIT_API_KEY is required when a post becomes public');

  const origin = new URL(siteUrl);
  const descriptions = await existingDescriptions(apiKey);

  for (const post of posts) {
    const marker = markerFor(after, post.path);
    if ([...descriptions].some((description) => description.includes(marker))) {
      console.log(`Skipping ${post.path}; its Kit broadcast already exists.`);
      continue;
    }

    const payload = broadcastFor(post, origin, marker, new Date().toISOString());
    await kitRequest(apiKey, '/broadcasts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    descriptions.add(payload.description);
    console.log(`Scheduled Kit broadcast for ${post.path}.`);
  }
}

const isMain = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  await publishNewPosts({
    before: process.env.BEFORE_SHA ?? '',
    after: process.env.AFTER_SHA ?? '',
    apiKey: process.env.KIT_API_KEY ?? '',
    siteUrl: process.env.SITE_URL ?? 'https://demianbrecht.com',
  });
}

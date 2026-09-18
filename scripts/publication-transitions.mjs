import { basename } from 'node:path';

const POST_PATH = /^src\/content\/posts\/.+\.(?:md|mdx)$/i;

/**
 * Parse the NUL-delimited output from `git diff --name-status -z`.
 *
 * Renames retain both paths so a public post that merely moves does not look
 * like a newly added post.
 */
export function parseNameStatus(output) {
  const fields = output.split('\0');
  if (fields.at(-1) === '') fields.pop();

  const changes = [];
  for (let index = 0; index < fields.length;) {
    const statusField = fields[index++];
    const status = statusField[0];

    if (status === 'R' || status === 'C') {
      const oldPath = fields[index++];
      const newPath = fields[index++];
      if (!oldPath || !newPath) {
        throw new Error(`Incomplete ${statusField} entry in git diff output`);
      }
      changes.push({ status, oldPath, newPath });
      continue;
    }

    const path = fields[index++];
    if (!path) throw new Error(`Incomplete ${statusField} entry in git diff output`);
    changes.push({
      status,
      oldPath: status === 'A' ? undefined : path,
      newPath: status === 'D' ? undefined : path,
    });
  }

  return changes.filter(({ oldPath, newPath }) =>
    POST_PATH.test(oldPath ?? '') || POST_PATH.test(newPath ?? ''));
}

function frontmatterLines(source, path) {
  const normalized = source.replaceAll('\r\n', '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error(`${path}: expected YAML frontmatter`);
  }

  const end = normalized.indexOf('\n---', 4);
  if (end < 0) throw new Error(`${path}: unterminated YAML frontmatter`);
  return normalized.slice(4, end).split('\n');
}

function unquoteScalar(value, path, field) {
  const trimmed = value.trim();
  if (trimmed.startsWith("'")) {
    if (!trimmed.endsWith("'")) throw new Error(`${path}: malformed ${field}`);
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error(`${path}: malformed ${field}`);
    }
  }
  return trimmed.replace(/\s+#.*$/, '').trim();
}

function topLevelScalar(lines, field, path) {
  const matcher = new RegExp(`^${field}:[ \\t]*(.*)$`);
  const index = lines.findIndex((line) => matcher.test(line));
  if (index < 0) return undefined;

  const indicator = lines[index].match(matcher)[1];
  if (!/^[>|][+-]?$/.test(indicator)) {
    return unquoteScalar(indicator, path, field);
  }

  const values = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line !== '' && !/^\s/.test(line)) break;
    values.push(line.replace(/^\s+/, ''));
  }

  const text = indicator.startsWith('>')
    ? values.join(' ').replace(/\s+/g, ' ').trim()
    : values.join('\n').trim();
  return text;
}

/** Parse only the schema fields needed to compose a publication broadcast. */
export function parsePost(source, path = '<post>') {
  const lines = frontmatterLines(source, path);
  const title = topLevelScalar(lines, 'title', path);
  const description = topLevelScalar(lines, 'description', path);
  const rawDraft = topLevelScalar(lines, 'draft', path);

  if (!title) throw new Error(`${path}: missing title`);
  if (!description) throw new Error(`${path}: missing description`);
  if (rawDraft !== undefined && rawDraft !== 'true' && rawDraft !== 'false') {
    throw new Error(`${path}: draft must be true or false`);
  }

  return {
    title,
    description,
    draft: rawDraft === 'true',
  };
}

/** Astro flattens nested post paths to their basename. */
export function postId(path) {
  return basename(path).replace(/\.(?:md|mdx)$/i, '');
}

/**
 * Return posts whose visibility changed from absent/draft to public.
 * `readRevision` receives (`before` | `after`, path) and returns file content.
 */
export function findPublicationTransitions(changes, readRevision) {
  const publications = [];

  for (const change of changes) {
    if (!change.newPath || !POST_PATH.test(change.newPath)) continue;

    const current = parsePost(readRevision('after', change.newPath), change.newPath);
    if (current.draft) continue;

    let wasPublic = false;
    // A copy creates a new public URL even when Git recognizes its source.
    if (change.status !== 'C' && change.oldPath && POST_PATH.test(change.oldPath)) {
      const previous = parsePost(readRevision('before', change.oldPath), change.oldPath);
      wasPublic = !previous.draft;
    }

    if (!wasPublic) {
      publications.push({
        ...current,
        id: postId(change.newPath),
        path: change.newPath,
      });
    }
  }

  return publications;
}

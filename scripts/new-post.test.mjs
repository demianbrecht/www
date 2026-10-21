import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

describe('new post scaffold', () => {
  it.each([
    'Notes on retry budgets',
    "Software Factories: I Don't Get 'Em. Halp.",
    String.raw`A "quoted" title: C:\posts\draft`,
  ])('preserves the title in valid YAML: %s', (title) => {
    const directory = mkdtempSync(join(tmpdir(), 'www-new-post-test-'));
    try {
      const scripts = join(directory, 'scripts');
      const posts = join(directory, 'src/content/posts');
      mkdirSync(scripts);
      mkdirSync(posts, { recursive: true });
      const script = join(scripts, 'new-post.sh');
      copyFileSync(new URL('./new-post.sh', import.meta.url), script);

      const result = spawnSync('/bin/bash', [script, title], { encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(0);

      const files = readdirSync(posts);
      expect(files).toHaveLength(1);
      const source = readFileSync(join(posts, files[0]), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
      expect(frontmatter).not.toBeNull();
      expect(yaml.load(frontmatter[1])).toMatchObject({ title, draft: true });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

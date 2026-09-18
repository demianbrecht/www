import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
const astro = join(root, 'node_modules', 'astro', 'astro.js');

function build(outDir: string): void {
  execFileSync('/usr/bin/env', [
    '-i',
    `PATH=${process.env.PATH}`,
    'HOME=/tmp',
    'NODE_ENV=production',
    'BASE_PATH=/www',
    process.execPath,
    astro,
    'build',
    '--outDir',
    outDir,
    '--force',
  ], {
    cwd: root,
    stdio: 'pipe',
  });
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('non-root builds', () => {
  it('renders inline homepage series items and ordinary attributed archive entries', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'www-base-path-'));

    try {
      build(outDir);

      const expectedHrefs = [
        'href="/www/posts/inner-sourcing-whats-this"',
        'href="/www/posts/inner-sourcing-the-mechanics"',
        'href="/www/posts/inner-sourcing-the-ups-and-downs"',
      ];
      const attributionHrefs = [
        'href="https://medium.com/salesforce-engineering/inner-sourcing-whats-this-ef2220ae59ec"',
        'href="https://medium.com/salesforce-engineering/inner-sourcing-the-mechanics-c0b1421230fd"',
        'href="https://medium.com/salesforce-engineering/inner-sourcing-the-ups-and-downs-3d443d5417b9"',
      ];
      const home = readFileSync(join(outDir, 'index.html'), 'utf8');
      const archive = readFileSync(join(outDir, 'archive', 'index.html'), 'utf8');

      expect(occurrences(home, 'data-timeline-kind="series"')).toBe(2);
      expect(home).not.toContain('class="series-section"');
      expect(home).toContain('<time datetime="2018-04-04"');

      for (const href of expectedHrefs) {
        expect(occurrences(home, href)).toBe(1);
        expect(occurrences(archive, href)).toBe(1);
      }
      for (const href of attributionHrefs) {
        expect(occurrences(home, href)).toBe(1);
        expect(occurrences(archive, href)).toBe(1);
      }

      expect(archive).not.toContain('data-timeline-kind="series"');
      expect(archive).not.toContain('class="series-section"');
      expect(home).not.toContain('Entry points in Python');
      expect(home).not.toContain('Advanced Mercurial Debugging');
      expect(home).not.toContain('My learnings on delivering technical presentations');
      expect(archive).toContain('Entry points in Python');
      expect(archive).toContain('Advanced Mercurial Debugging');
      expect(archive).toContain('My learnings on delivering technical presentations');
      expect(occurrences(archive, 'Originally published in ')).toBe(5);
      expect(occurrences(home, 'Originally published in ')).toBe(5);
      expect(archive).toContain('Salesforce Engineering');
      expect(home).toContain('Salesforce Engineering');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 15_000);

  it('prefixes generated links while keeping post output routes flat', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'www-base-path-'));

    try {
      build(outDir);

      const home = readFileSync(join(outDir, 'index.html'), 'utf8');
      const about = readFileSync(join(outDir, 'about', 'index.html'), 'utf8');

      expect(home).toContain('href="/www/posts/inner-sourcing-whats-this"');
      expect(home).not.toContain('href="/posts/inner-sourcing-whats-this"');
      expect(home).not.toContain('/www/series/');
      expect(about).toContain('href="/www/rss.xml"');
      expect(about).not.toContain('href="/rss.xml"');
      expect(
        readFileSync(
          join(outDir, 'posts', 'inner-sourcing-whats-this', 'index.html'),
          'utf8',
        ),
      ).toContain('Originally published in ');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 15_000);
});

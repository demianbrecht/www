export const SITE_TITLE = 'Demian Brecht';
export const SITE_TAGLINE =
  'Software, AI systems, and the occasional argument with an abstraction.';
export const SITE_DESCRIPTION =
  'Software, AI systems, and the occasional argument with an abstraction.';
export const AUTHOR = 'Demian Brecht';

export const NAV_LINKS = [
  { href: '/archive', label: 'Archive' },
  { href: '/tags', label: 'Tags' },
  { href: '/about', label: 'About' },
] as const;

export const START_HERE_LINK = {
  href: '/agentic-engineering',
  label: 'Start Here',
} as const;

export const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    handle: 'demianbrecht',
    href: 'https://www.linkedin.com/in/demianbrecht/',
  },
  {
    label: 'GitHub',
    handle: 'demianbrecht',
    href: 'https://github.com/demianbrecht',
  },
  {
    label: 'Reddit',
    handle: 'u/mostly_deterministic',
    href: 'https://www.reddit.com/user/mostly_deterministic/',
  },
  {
    label: 'X',
    handle: '@demianbrecht',
    href: 'https://x.com/demianbrecht',
  },
] as const;

/** Posts collected by the permanent Agentic Engineering reading guide. */
export const AGENTIC_ENGINEERING_POST_IDS: ReadonlySet<string> = new Set([
  'stop-asking-llms-to-be-deterministic',
  'the-division-of-the-local-harnesses',
  'the-harness-within-the-harness',
  'context-as-a-control-surface',
  'dude-how-does-this-help-me',
  'runtime-qa-give-the-agent-the-loop-not-the-last-word',
]);

/**
 * Giscus (GitHub Discussions-backed comments) config. Rendered on every post
 * when fully configured; the component renders nothing if any field is blank.
 * IDs are public-safe (they appear in the client bundle by design).
 */
export const GISCUS = {
  repo: 'demianbrecht/www',
  repoId: 'R_kgDOQ2Y_Gw',
  category: 'Announcements',
  categoryId: 'DIC_kwDOQ2Y_G84DDKZC',
  mapping: 'pathname',
  theme: 'dark',
  lang: 'en',
} as const;

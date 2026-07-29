# www

A personal blog. Static site built with [Astro](https://astro.build), posts
authored in MDX, deployed to GitHub Pages under the custom domain
`demianbrecht.com`.

## Layout

- `src/content/posts/` — posts as `.mdx`/`.md`; the filename is the URL slug.
- `src/content.config.ts` — frontmatter schema (Zod). Validated at build time.
- `src/consts.ts` — site title, tagline, description, author, nav links.
- `src/components/` — `Callout.astro`, `Terminal.astro`, and layout pieces.
- `src/pages/` — routes (`index`, `archive`, `tags`, `about`, `posts/[...id]`, `rss.xml`).
- `scripts/new-post.sh` — post scaffolding.
- `.github/workflows/deploy.yml` — build + deploy to Pages on push to `main`.

## Workflow

- `make run` — dev server with live reload (drafts render here).
- `make build` / `make preview` — production build in `dist/`, then serve it.
- `make check` — type-check and validate frontmatter. Run before publishing.
- `make new-post TITLE="..."` — scaffold a new post (created with `draft: true`).
- Deploy is automatic: push to `main` and GitHub Actions builds and publishes.

## Frontmatter

Required: `title`, `description`, `pubDate` (`YYYY-MM-DD`). Optional:
`updatedDate`, `tags` (defaults to `[]`), `draft` (defaults to `false`).

- `description` is one or two lines; shown in listings, meta tags, and RSS.
- New posts scaffold with `draft: true`; set `false` to publish.

## Conventions

- **Name vs. handle.** The author's display name is **Demian Brecht** — use it
  for `SITE_TITLE`, `AUTHOR`, and prose. `dbrecht` is the GitHub handle; the site
  is served from the apex domain `demianbrecht.com` (no path prefix).
- **Tags** are lowercase and hyphenated: `ai-engineering`, `developer-workflow`,
  not `AI Engineering`.
- Match the voice and formatting of the surrounding post when editing content.

## Deploy notes

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site
with `withastro/action` and publishes it to Pages via `actions/deploy-pages`.
Pages must be configured with **GitHub Actions** as its source (Settings > Pages).

The custom domain is pinned by `public/CNAME` (`demianbrecht.com`), copied into
the build output so Pages preserves it across deploys.

`astro.config.mjs` sets `site` to `https://demianbrecht.com` with `base` at `/`
(apex domain serves from root). Override with `SITE_URL` / `BASE_PATH` env vars
when deploying elsewhere — e.g. a project page served from a `/<repo>` subpath.

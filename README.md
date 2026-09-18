# www

A personal blog. Static site built with [Astro](https://astro.build), posts
authored in MDX, deployed to GitHub Pages.

Live at <https://demianbrecht.com>.

## Quick start

```console
$ make run       # dev server with live reload → http://localhost:4321
$ make build     # production build into dist/
$ make preview   # build, then serve dist/ locally
$ make help      # all targets
```

`make run` installs dependencies on first use. Override the port with
`make run PORT=8080`.

## Writing a post

```console
$ make new-post TITLE="Notes on retry budgets"
created src/content/posts/notes-on-retry-budgets.mdx
```

Posts live in `src/content/posts/` or nested directories as `.mdx` (or `.md`).
The filename is always the flat URL slug, so basenames must be unique across the
entire tree. Frontmatter is schema-validated at build time by
`src/content.config.ts`, so a typo fails the build instead of shipping a broken
page:

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | |
| `description` | yes | used in listings, meta tags, and RSS |
| `pubDate` | yes | `YYYY-MM-DD` |
| `updatedDate` | no | shown in the post meta line |
| `tags` | no | array of strings; defaults to `[]` |
| `draft` | no | defaults to `false` |
| `archived` | no | defaults to `false`; excludes a published post from the homepage but retains it in `/archive` |
| `originallyPublished` | no | `{ publisher, url }` attribution for an earlier publication |

New posts are scaffolded with `draft: true`. Drafts render in `make run` but are
excluded from production builds, the RSS feed, and the sitemap — remove the flag
or set it to `false` to publish.

Archived posts remain published, including in the RSS feed and sitemap, but are
omitted from the homepage timeline and remain available through `/archive`.

### Series

Group related posts in a nested directory and add an `index.yaml` beside them.
The `posts` list declares the part order; each post keeps its flat
`/posts/<filename>` route:

```yaml
title: Retry Budgets
description: A three-part guide to practical retry policies.
pubDate: 2026-08-08
posts:
  - retry-budgets-introduction
  - retry-budgets-backoff
  - retry-budgets-operations
```

Series metadata requires `title`, `description`, `pubDate`, and at least one
post reference. Draft visibility is still controlled by each member post.

### Components

Import inside any `.mdx` file:

```mdx
import Callout from '../../components/Callout.astro';
import Terminal from '../../components/Terminal.astro';

<Callout type="warn">Mind the rate limits.</Callout>

<Terminal title="shell">
```console
$ make build
```
</Terminal>
```

`Callout` takes `type="info|warn|danger|success"` and an optional `title`.
`OriginalPublication` and `SeriesCard` are site-rendering components rather than
author-inserted MDX components. The post `writing-posts.mdx` renders the
author-facing components as a live reference.

## Structure

```
src/
  content/posts/     posts (.mdx/.md) and series metadata (index.yaml)
  content.config.ts  frontmatter schema
  components/        Header, Footer, PostCard, SeriesCard, OriginalPublication,
                     Callout, Terminal, BaseHead
  layouts/           BaseLayout, PostLayout
  pages/             routes — index, archive, tags, about, 404, rss.xml
  styles/global.css  the entire theme
  consts.ts          title, tagline, nav links
  utils.ts           URL/date/tag helpers
  timeline.ts        homepage series assembly and post navigation ordering
scripts/new-post.sh  post scaffold
```

Routes generated: `/`, `/archive`, `/tags`, `/tags/<tag>`, `/about`,
`/posts/<slug>`, `/rss.xml`, `/sitemap-index.xml`, `/404`.

## Theming

Dark and deliberately restrained: a neutral slate ramp (`#14171c` → `#21262e`)
with a phosphor-mint accent (`#62ffc6`) for links and focus rings, plus amber,
red, and green reserved for status. Monospace interface type and headings frame
readable sans-serif article prose.

All colour and type lives in CSS custom properties at the top of
`src/styles/global.css` — edit `--bg`, `--accent`, `--text`, `--border`, and the
font stacks to reskin the site. Code blocks use Shiki's `github-dark-default`
theme, set in `astro.config.mjs`.

Subtle CRT scanlines, edge falloff, drifting glow, and occasional signal tears
provide atmosphere without moving the content. All ambient animation respects
`prefers-reduced-motion`. Small system labels and chronological `ENTRY_###`
identifiers add interface texture without changing the editorial hierarchy.

Type is the system stack — `-apple-system`/`Segoe UI` for prose and `SF Mono`/
`Menlo` for code and UI labels. No webfonts are downloaded.

## Deploying

Deployment is automatic. Pushing to `main` triggers the GitHub Actions workflow
in `.github/workflows/deploy.yml`, which builds the site and publishes it to
GitHub Pages. There is no manual publish step. After a successful push deploy,
the workflow also schedules a Kit broadcast when a post is newly public: either
a new post without `draft: true`, or an existing draft changed to public. Edits
and renames of already-public posts do not send another broadcast, and manual
workflow runs never send one.

Pages is configured once under **Settings → Pages → Source → GitHub Actions**.
The custom domain (`demianbrecht.com`) is pinned by `public/CNAME`, which is
copied into the build output so Pages preserves it across deploys.

The site's URL is split between two values in `astro.config.mjs`: `site` is the
bare origin, `base` is the path prefix (`/` for the apex domain). Both feed the
absolute URLs in the canonical tags, RSS feed, and sitemap. To deploy elsewhere
— for example a project page served from a `/<repo>` subpath — override them at
build time rather than editing the file:

```console
$ SITE_URL=https://example.com BASE_PATH=/ make build
```

### Kit newsletter configuration

Create the following repository-level configuration under **Settings → Secrets
and variables → Actions**:

| Type | Name | Value |
| --- | --- | --- |
| Variable | `KIT_FORM_UID` | the form's `data-uid` value from Kit's JavaScript embed snippet |
| Variable | `KIT_FORM_EMBED_URL` | the full `src` URL from that embed snippet |
| Secret | `KIT_API_KEY` | a personal Kit API v4 key used to read and create broadcasts |

The signup panel is omitted from the built site unless both variables are set.
In Kit, use the form's native option to hide it from visitors who have already
subscribed; the site's wrapper follows Kit's injected form visibility so it
does not leave an empty panel behind.

Broadcasts target all subscribers, are scheduled one minute after creation,
and have `public: false`, so they are not added to Kit's public web feed. Each
broadcast description contains a stable publication marker. Before creating a
broadcast, the workflow scans all existing broadcasts for that marker, making
workflow retries safe. `KIT_API_KEY` is only exposed to the post-deployment
notification step, never to Astro's browser-facing build.

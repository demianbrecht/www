#!/usr/bin/env bash
# Scaffold a new MDX post in src/content/posts/.
# Usage: ./scripts/new-post.sh ["Post Title"]   (prompts if title omitted)
set -euo pipefail

cd "$(dirname "$0")/.."

title="${1:-}"
if [[ -z "$title" ]]; then
  read -r -p "Post title: " title
fi

if [[ -z "${title// }" ]]; then
  echo "error: a title is required" >&2
  exit 1
fi

# Slugify: lowercase, non-alphanumerics to hyphens, trim leading/trailing hyphens.
slug="$(printf '%s' "$title" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -e 's/[^a-z0-9]\{1,\}/-/g' -e 's/^-*//' -e 's/-*$//')"

if [[ -z "$slug" ]]; then
  echo "error: title produced an empty slug" >&2
  exit 1
fi

file="src/content/posts/${slug}.mdx"
if [[ -e "$file" ]]; then
  echo "error: $file already exists" >&2
  exit 1
fi

# Escape single quotes for the YAML single-quoted scalar.
yaml_title="${title//\'/\'\'}"

cat > "$file" <<EOF
---
title: '${yaml_title}'
description: >-
  TODO: one or two lines. Shown in listings, meta tags, and the RSS feed.
pubDate: $(date +%Y-%m-%d)
tags: []
draft: true
---

TODO: write the post.

{/*
  Available components — import at the top of the file, then use inline:

    import Callout from '../../components/Callout.astro';
    import Terminal from '../../components/Terminal.astro';

    <Callout type="info|warn|danger|success">…</Callout>
    <Terminal title="zsh"> fenced console block </Terminal>
*/}
EOF

echo "created $file"
echo "  draft: true  — remove or set false to publish"

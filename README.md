# BOGGELINO — personal blog

Built with [Astro](https://astro.build). Bilingual (SK/EN), tags, RSS, dark/dim theme toggle.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:4321 — it'll redirect to the Slovak homepage.

## Adding an article

Articles live as Markdown files in:

- `src/content/articles/sk/` — Slovak articles
- `src/content/articles/en/` — English articles

To add a new post, create a new `.md` file (filename becomes the URL slug — keep it
lowercase, no spaces, e.g. `moj-novy-clanok.md`). At the top, add the frontmatter block,
then write the article underneath in normal Markdown:

```markdown
---
title: "My New Article"
description: "One sentence describing the article, shown on the homepage card."
date: 2026-08-01
tags: ["gaming", "music"]
---

Write your article here. Normal Markdown works: **bold**, *italic*, [links](https://example.com),
images, code blocks, > blockquotes, and so on.
```

If you're translating the same article into both languages, just create matching files
in both folders (the slugs don't have to match, but it's tidy if they do).

To hide a draft without deleting it, add `draft: true` to the frontmatter — it won't show
up on the site or in RSS until you remove that line.

Tags are freeform — just list whatever words you want in the `tags` array, and pages for
them (`/sk/tags/gaming/`) get generated automatically.

## Design

All design tokens (colors, fonts) live in `src/styles/global.css` under `:root` and
`[data-theme='dim']`. The layout/nav is in `src/layouts/BaseLayout.astro`. Ask Claude for
help tweaking any of it — the CSS is written to be easy to hand-edit.

## Deploying

1. Push this repo to GitHub.
2. Connect the repo on [Netlify](https://netlify.com) or
   [Cloudflare Pages](https://pages.cloudflare.com) — build command `npm run build`,
   output directory `dist`.
3. Every `git push` after that auto-deploys.
4. Once you have a real domain, update `site` in `astro.config.mjs` to match (this is used
   for RSS/canonical links).

## Coming later

- Article submission + approval flow (readers suggest, you approve)
- Comments (likely via Giscus)

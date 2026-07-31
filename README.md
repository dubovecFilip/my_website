# MOMENTUM — personal blog

Author/persona: BOGGELINO.

Built with [Astro](https://astro.build). Bilingual (SK/EN), tags with filtering, RSS,
dark/light theme toggle.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:4321 — it'll redirect to the Slovak homepage.

## Adding an article (recommended way)

Open `tools/compose.html` directly in your browser (just double-click it, no server
needed). Fill in the fields, write in the big text box (Markdown, with a live preview
on the right), and click **"Stiahnuť .md súbor"** — it downloads a properly formatted
file. Move that file into:

- `src/content/articles/sk/<ID>.md` — Slovak version
- `src/content/articles/en/<ID>.md` — English version

Use the **same ID** for both language versions of the same article. That's how the
language switcher on the article page knows they're the same post.

### Adding images to an article

In `tools/compose.html`, use the "Pridaj obrázok" file picker. It inserts the right
Markdown into your text automatically. It can't upload the file for you (browsers can't
write to your disk directly), so you'll need to manually copy the image file into
`public/images/articles/<ID>/` under the same filename it inserted.

## Adding an article manually (without the tool)

Create a `.md` file in `src/content/articles/sk/` or `/en/`, filename = article ID
(e.g. `2.md`):

```markdown
---
title: "My New Article"
description: "One sentence shown on the homepage card."
date: 2026-08-01
tags: ["gaming", "music"]
author: "boggelino"
---

Write your article here. Normal Markdown: **bold**, _italic_, [links](https://example.com),
![image](/images/articles/2/photo.jpg), code blocks, > blockquotes, etc.
```

To hide a draft without deleting it, add `draft: true`.

## Authors

Defined in `src/data/authors.ts`. Right now there's just `boggelino` (avatar =
`/images/boggelino.png`). If you ever open up article submissions to others, add them here
and set `author: "their-id"` in their article's frontmatter. Their avatar + name will
show up automatically next to "Written by".

## Design

Color/font tokens: `src/styles/global.css` (`:root` = dark theme, `[data-theme='light']`
= light theme). Layout/nav: `src/layouts/BaseLayout.astro`. Icons: `src/components/SocialIcon.astro`
and `src/components/FlagIcon.astro`, a plain hand-drawn SVGs, not brand assets, easy to
adjust.

## Deploying

Push to GitHub → connected to Netlify → every `git push` auto-deploys. Build command
`npm run build`, output directory `dist`.

## Coming later

- Article submission + approval flow (readers suggest, you approve)
- Comments (likely via Giscus)

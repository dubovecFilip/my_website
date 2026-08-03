# MOMENTUM — personal blog

Author/persona: BOGGELINO.

Built with [Astro](https://astro.build). Bilingual (SK/EN), full-text search and tag
filtering, related articles, a table of contents on every longer post, image
captions and a lightbox, reading time and article statistics, an optional
author's note, RSS, dark/light theme toggle.

## Contents

- [Running it locally](#running-it-locally)
- [Project structure](#project-structure)
- [Adding an article](#adding-an-article-recommended-way)
- [Adding an article manually](#adding-an-article-manually-without-the-tool)
- [What an article page includes](#what-an-article-page-includes)
- [Homepage](#homepage)
- [Archive and search page](#archive-and-search-page)
- [Gallery](#gallery)
- [Authors](#authors)
- [Design](#design)
- [Bilingual content](#bilingual-content)
- [Deploying](#deploying)
- [Coming later](#coming-later)

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:4321, it'll redirect to the Slovak homepage.

## Project structure

```
src/
  pages/sk/, pages/en/     route trees, mirrored 1:1 across both languages
  content/articles/sk/     Slovak articles, one Markdown file per article ID
  content/articles/en/     English articles, same ID as the SK counterpart
  content.config.ts        frontmatter schema for articles
  components/              Astro components (cards, TOC, lightbox, stats, etc.)
  layouts/BaseLayout.astro header, nav, theme toggle, language switcher, footer
  i18n/dict.ts             every UI string, in both languages
  data/authors.ts          author id to name and avatar mapping
  data/social.ts           social links (used on the About page)
  styles/global.css        color and font tokens, global element styles
  utils/                   small helper functions
tools/compose.html         standalone article editor, opened directly in a browser
public/images/articles/<ID>/  images for a specific article
public/images/gallery/        photos shown on the /gallery page
```

## Adding an article (recommended way)

Open `tools/compose.html` directly in your browser (just double-click it, no server
needed), or visit `/sk/compose` / `/en/compose` on the running site for the same
editor styled to match the live design. Fill in the fields, write in the big text
box (Markdown, with a live preview on the right), and either save straight into your
project folder or download the `.md` file and move it into:

- `src/content/articles/sk/<ID>.md`, Slovak version
- `src/content/articles/en/<ID>.md`, English version

Use the **same ID** for both language versions of the same article. That's how the
language switcher on the article page knows they're the same post, and how related
articles and everything else that pairs SK/EN content stays in sync.

### Adding images to an article

Use the "Pridaj obrázok" file picker in the editor. It inserts the right Markdown
into your text automatically. It can't upload the file for you (browsers can't write
arbitrary files to disk), so you'll need to manually copy the image file into
`public/images/articles/<ID>/` under the same filename it inserted.

Any image written as its own `![alt text](...)` line (not mixed inline with other
text) automatically renders as a captioned figure on the live site, using the alt
text as the caption underneath the photo. The same alt text also becomes the label
shown when that image is opened in the lightbox, so writing a real, descriptive alt
text is worth doing, it isn't just for accessibility here.

## Adding an article manually (without the tool)

Create a `.md` file in `src/content/articles/sk/` or `/en/`, filename equal to the
article ID (e.g. `2.md`):

```markdown
---
title: "My New Article"
description: "One sentence shown on the homepage card."
date: 2026-08-01
tags: ["gaming", "music"]
author: "boggelino"
authorNote: "Optional aside shown near the end of the article, e.g. version or context notes."
---

Write your article here. Normal Markdown: **bold**, _italic_, [links](https://example.com),
![image](/images/articles/2/photo.jpg), code blocks, > blockquotes, etc.

## A heading like this
Any `##` or `###` heading automatically shows up in the table of contents on the
article page. `#` isn't needed since the title already serves that role.
```

Field notes:

- `tags`, `draft`, `pinned`, and `authorNote` are all optional.
- `draft: true` hides the article without deleting it.
- `pinned: true` features it at the top of the homepage. Only one article should be
  pinned at a time, the compose tool automatically unpins whichever one was pinned
  before when you pin a new one.
- `authorNote` renders as a small aside near the end of the article when present,
  and is skipped entirely when omitted.

## What an article page includes

All of the following is generated automatically from the article's Markdown and
frontmatter, there's nothing extra to configure per article:

- **Table of contents**, built from `##`/`###` headings. Sticky sidebar on desktop,
  collapsible section on mobile, with the currently visible heading highlighted as
  you scroll. Articles with fewer than two headings simply don't get one.
- **Image captions**, any image on its own line renders as a captioned figure using
  its alt text.
- **Image lightbox**, clicking any image opens it full screen with a dark overlay,
  previous and next navigation (arrow keys, on-screen buttons, or swipe on mobile),
  and click-to-zoom.
- **Reading time**, shown next to the publish date, both on the article page itself
  and on every card that lists the article elsewhere on the site.
- **Author's note**, the optional `authorNote` field, shown when present.
- **Article statistics**, a small block with word count, reading time, image count,
  and heading count.
- **Related articles**, up to three other same-language articles, ranked by how many
  tags they share with the current one (ties broken by newest). Only appears when
  there's an actual overlap, no unrelated filler just to fill the section.

## Homepage

Features the pinned article (or the newest one, if nothing is pinned) at the top,
followed by a grid of the rest with a sidebar (about blurb, recent posts, top
categories by article count).

## Archive and search page

`/sk/tags/` (and `/en/tags/`) is a full search page:

- Instant search across title, description, and tags as you type.
- Tag checkboxes in the sidebar use AND logic, checking multiple tags narrows to
  articles that have all of them, and each checkbox shows a live count of how many
  results it would leave if selected.
- Sort by newest, oldest, reading time, or alphabetically.
- A random button jumps to a random article from whatever's currently visible in
  the filtered and searched results.

Individual tag pages still exist at `/sk/tags/<tag>/` for direct links, but the
search page above is the main way to browse.

## Gallery

`/gallery` reads photos straight out of `public/images/gallery/` at build time,
newest file first. No content collection entry needed per photo, just drop a file
in and it shows up, laid out with a loose CSS-columns masonry grid.

## Authors

Defined in `src/data/authors.ts`. Right now there's just `boggelino` (avatar =
`/images/boggelino.png`). If you ever open up article submissions to others, add
them here and set `author: "their-id"` in their article's frontmatter, their avatar
and name will show up automatically next to "Written by".

## Design

Color and font tokens live in `src/styles/global.css` (`:root` = dark theme,
`[data-theme='light']` = light theme, same variable names in both, so anything new
should reference the variables rather than hardcoding a color). Layout, nav, and
footer: `src/layouts/BaseLayout.astro`. Icons: `src/components/SocialIcon.astro`
and `src/components/FlagIcon.astro`, plain hand-drawn SVGs, not brand assets, easy
to restyle.

Theme preference (dark or light) is remembered in the browser and applied before
the page paints, so there's no flash of the wrong theme on load.

## Bilingual content

Every page exists once under `/sk/` and once under `/en/`, and every article can
have a Slovak file, an English file, or both, matched by filename. If only one
language exists for a given article, the language switcher on that article sends
the reader to the other language's homepage instead of a broken link. All UI text
(navigation, buttons, labels) lives in `src/i18n/dict.ts`, one object per language,
so adding or changing any on-page text happens there rather than in the page files
themselves.

## Deploying

Push to GitHub, connected to Netlify, every `git push` auto-deploys. Build command
`npm run build`, output directory `dist`.

## Coming later

- Article submission and approval flow (readers suggest, you approve)
- Comments (likely via Giscus)

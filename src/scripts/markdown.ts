/**
 * Malý prekladač markdownu do rovnakého tvaru, aký vyrobí build, vrátane
 * popisiek pod obrázkami (to za teba pri builde robí rehype-image-captions).
 * Používa ho Compose aj náhľadové stránky, aby text vyzeral rovnako ako na webe.
 */

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" class="is-loaded" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br />');
}

export function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface MdHeading {
  depth: number;
  text: string;
  slug: string;
}

/** Kapitoly a podkapitoly pre obsah. Číslujú sa len H2. */
export function headingsOf(markdown: string): MdHeading[] {
  return [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((m) => ({
    depth: m[1].length,
    text: m[2].trim(),
    slug: slugifyHeading(m[2].trim()),
  }));
}

export function renderMarkdown(markdown: string): string {
  const blocks = markdown.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const out: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    const image = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (image) {
      out.push(
        `<figure class="article-figure"><img src="${escapeHtml(image[2])}" alt="${escapeHtml(
          image[1],
        )}" class="is-loaded" />${
          image[1].trim() ? `<figcaption>${escapeHtml(image[1])}</figcaption>` : ''
        }</figure>`,
      );
      continue;
    }

    const heading = block.match(/^(#{2,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      out.push(`<h${level} id="${slugifyHeading(text)}">${inline(text)}</h${level}>`);
      continue;
    }

    if (/^>\s?/.test(block)) {
      out.push(`<blockquote><p>${inline(block.replace(/^>\s?/gm, ''))}</p></blockquote>`);
      continue;
    }

    if (/^([-*+])\s+/.test(block)) {
      const items = block
        .split('\n')
        .map((l) => l.replace(/^([-*+])\s+/, '').trim())
        .filter(Boolean);
      out.push(`<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(block)) {
      const items = block
        .split('\n')
        .map((l) => l.replace(/^\d+\.\s+/, '').trim())
        .filter(Boolean);
      out.push(`<ol>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`);
      continue;
    }

    if (block.startsWith('```')) {
      out.push(`<pre><code>${escapeHtml(block.replace(/^```[^\n]*\n?|```$/g, ''))}</code></pre>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(block)) {
      out.push('<hr />');
      continue;
    }

    out.push(`<p>${inline(block)}</p>`);
  }

  return out.join('');
}

export function firstImage(markdown: string): string | null {
  return markdown.match(/!\[[^\]]*\]\(([^)\s]+)/)?.[1] ?? null;
}

export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`[\]()]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

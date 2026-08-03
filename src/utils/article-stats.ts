/**
 * Small, dependency-free helpers that turn a raw markdown article body into
 * the numbers shown in the "Article Statistics" block and the reading-time
 * badge on article cards. Kept intentionally simple (regex-based) instead of
 * pulling in a markdown AST just to count things.
 */

/** Strips markdown syntax down to roughly "what a reader would read". */
function stripMarkdown(body: string): string {
  return body
    // fenced code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // inline code
    .replace(/`[^`]*`/g, ' ')
    // images: ![alt](url) -> alt (counted separately, drop from word count entirely)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // links: [text](url) -> text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // headings/blockquote/list markers
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // emphasis markers
    .replace(/[*_~]{1,3}/g, '')
    // remaining html tags
    .replace(/<[^>]+>/g, ' ');
}

export function countWords(body: string | undefined): number {
  if (!body) return 0;
  const text = stripMarkdown(body).trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** Average adult silent-reading speed, ~200 words per minute. */
export function readingTimeMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export function countImages(body: string | undefined): number {
  if (!body) return 0;
  const matches = body.match(/!\[[^\]]*\]\([^)]*\)/g);
  return matches ? matches.length : 0;
}

/** Counts H2/H3 markdown headings (H1 is the article title, not counted). */
export function countHeadings(body: string | undefined): number {
  if (!body) return 0;
  const matches = body.match(/^#{2,3}\s+.+$/gm);
  return matches ? matches.length : 0;
}

export interface ArticleStats {
  words: number;
  readingTime: number;
  images: number;
  headings: number;
}

export function computeArticleStats(body: string | undefined): ArticleStats {
  const words = countWords(body);
  return {
    words,
    readingTime: readingTimeMinutes(words),
    images: countImages(body),
    headings: countHeadings(body),
  };
}

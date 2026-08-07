import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/dict';
import { languages } from '../i18n/dict';
import { computeArticleStats } from './article-stats';
import { extractFirstImage, extractFirstImageAlt } from './extract-image';

type RawEntry = CollectionEntry<'articles-sk'> | CollectionEntry<'articles-en'>;

export interface Article {
  /** Číselné ID = názov súboru. Kanonická časť adresy. */
  id: string;
  lang: Lang;
  /** Čitateľná ozdoba za ID. */
  slug: string;
  /** Plná adresa vrátane jazykového prefixu. */
  href: string;
  title: string;
  description: string;
  date: Date;
  tags: string[];
  /** Rozpísaný: verejný, ale so značkou. */
  draft: boolean;
  pinned: boolean;
  author: string;
  authorNote?: string;
  follows?: string;
  /** Prvý obrázok z textu; slúži ako náhľad všade inde. */
  image?: string;
  imageAlt?: string;
  words: number;
  readingTime: number;
  body: string;
}

/* -------------------------------------------------------------------------
   Slug
   ------------------------------------------------------------------------- */

const SLUG_MAX = 80;

export function slugify(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(
      /[ĐđŁłØø]/g,
      (c) =>
        ({ 'Đ': 'D', 'đ': 'd', 'Ł': 'L', 'ł': 'l', 'Ø': 'O', 'ø': 'o' })[
          c
        ] ?? c,
    )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (base.length <= SLUG_MAX) return base;
  const cut = base.slice(0, SLUG_MAX);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
}

export function articleHref(lang: Lang, id: string, slug: string): string {
  return slug ? `/${lang}/articles/${id}-${slug}/` : `/${lang}/articles/${id}/`;
}

/* -------------------------------------------------------------------------
   Načítanie
   ------------------------------------------------------------------------- */

function collectionName(lang: Lang): 'articles-sk' | 'articles-en' {
  return lang === 'sk' ? 'articles-sk' : 'articles-en';
}

function toArticle(entry: RawEntry, lang: Lang): Article {
  const body = entry.body ?? '';
  const stats = computeArticleStats(body);
  const slug = entry.data.slug ? slugify(entry.data.slug) : slugify(entry.data.title);

  return {
    id: entry.id,
    lang,
    slug,
    href: articleHref(lang, entry.id, slug),
    title: entry.data.title,
    description: entry.data.description,
    date: entry.data.date,
    tags: entry.data.tags,
    draft: entry.data.draft,
    pinned: entry.data.pinned,
    author: entry.data.author,
    authorNote: entry.data.authorNote,
    follows: entry.data.follows,
    image: extractFirstImage(body),
    imageAlt: extractFirstImageAlt(body),
    words: stats.words,
    readingTime: stats.readingTime,
    body,
  };
}

const cache = new Map<Lang, Article[]>();

/**
 * Všetky články jazyka, od najnovšieho. Rozpísané (draft: true) sú verejné,
 * nesú len značku, takže sa nefiltrujú.
 */
export async function getArticles(lang: Lang): Promise<Article[]> {
  const cached = cache.get(lang);
  if (cached) return cached;

  const entries = (await getCollection(collectionName(lang))) as RawEntry[];
  const articles = entries
    .map((entry) => toArticle(entry, lang))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  assertIntegrity(articles, lang);
  cache.set(lang, articles);
  return articles;
}

export async function getArticle(lang: Lang, id: string): Promise<Article | undefined> {
  const articles = await getArticles(lang);
  return articles.find((a) => a.id === id);
}

/** ID, ktoré existujú aspoň v jednom jazyku, pre 404 a hreflang. */
export async function getAllIds(): Promise<Map<string, Lang[]>> {
  const map = new Map<string, Lang[]>();
  for (const lang of languages) {
    for (const article of await getArticles(lang)) {
      const list = map.get(article.id) ?? [];
      list.push(lang);
      map.set(article.id, list);
    }
  }
  return map;
}

/* -------------------------------------------------------------------------
   Kontroly, ktoré majú zhodiť build (sekcia 14)
   ------------------------------------------------------------------------- */

function assertIntegrity(articles: Article[], lang: Lang): void {
  const pinned = articles.filter((a) => a.pinned);
  if (pinned.length > 1) {
    throw new Error(
      `[obsah] Jazyk "${lang}" má ${pinned.length} pripnutých článkov (${pinned
        .map((a) => a.id)
        .join(', ')}). Pripnutý môže byť vždy len jeden.`,
    );
  }

  const byId = new Map(articles.map((a) => [a.id, a]));

  for (const article of articles) {
    if (!article.follows) continue;
    if (!byId.has(article.follows)) {
      throw new Error(
        `[obsah] Článok ${article.id} (${lang}) nadväzuje na neznáme ID "${article.follows}".`,
      );
    }
  }

  for (const article of articles) {
    const seen = new Set<string>([article.id]);
    let current = article.follows;
    while (current) {
      if (seen.has(current)) {
        throw new Error(
          `[obsah] Cyklus v poli follows (${lang}): ${[...seen, current].join(' → ')}.`,
        );
      }
      seen.add(current);
      current = byId.get(current)?.follows;
    }
  }

  /* Rozpísaný článok sa nikdy nepripína. */
  const pinnedDraft = articles.find((a) => a.pinned && a.draft);
  if (pinnedDraft) {
    throw new Error(
      `[obsah] Článok ${pinnedDraft.id} (${lang}) je zároveň rozpísaný aj pripnutý. Rozpísaný článok sa nepripína.`,
    );
  }
}

/* -------------------------------------------------------------------------
   Pravidlá výberu obsahu (sekcia 14)
   ------------------------------------------------------------------------- */

export const HOME_GRID_MAX = 9;
export const ARCHIVE_PAGE_SIZE = 12;
export const ARCHIVE_LINK_FROM = 11;

export interface HomeSelection {
  /** Hlavná karta: pripnutý, inak najnovší. */
  feature?: Article;
  featureLabel: 'pinned' | 'latest';
  /** Najviac 9 ďalších; hlavná sa neopakuje. */
  grid: Article[];
  total: number;
  /** Odkaz do archívu má zmysel až od 11. článku. */
  showArchiveLink: boolean;
}

export function selectHome(articles: Article[]): HomeSelection {
  const pinned = articles.find((a) => a.pinned);
  const feature = pinned ?? articles[0];
  const rest = articles.filter((a) => a.id !== feature?.id);

  return {
    feature,
    featureLabel: pinned ? 'pinned' : 'latest',
    grid: rest.slice(0, HOME_GRID_MAX),
    total: articles.length,
    showArchiveLink: articles.length >= ARCHIVE_LINK_FROM,
  };
}

/** 3 články s najviac spoločnými štítkami; pri zhode novší. */
export function selectRelated(articles: Article[], current: Article, count = 3): Article[] {
  return articles
    .filter((a) => a.id !== current.id)
    .map((a) => ({
      article: a,
      shared: a.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.article.date.valueOf() - a.article.date.valueOf())
    .slice(0, count)
    .map((x) => x.article);
}

export interface TagCount {
  name: string;
  count: number;
}

/** Počty sa prepočítavajú podľa aktuálneho výberu; zoradené zostupne. */
export function tagCounts(articles: Article[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'sk'));
}

export interface MonthGroup {
  key: string;
  year: number;
  month: number;
  articles: Article[];
}

/** Delenie po mesiacoch platí len pre nefiltrovaný zoznam od najnovšieho. */
export function groupByMonth(articles: Article[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const article of articles) {
    const year = article.date.getFullYear();
    const month = article.date.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const group = groups.get(key) ?? { key, year, month, articles: [] };
    group.articles.push(article);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}

/**
 * Os mesiacov pre archív, vždy pevných 12 mesiacov končiacich aktuálnym,
 * aj keď v niektorých nič nevyšlo. Rytmus písania je vidieť len vtedy, keď
 * má os stálu mierku.
 */
export function monthTimeline(articles: Article[], count = 12, now = new Date()): MonthGroup[] {
  const filled = new Map(groupByMonth(articles).map((g) => [g.key, g]));

  const out: MonthGroup[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    out.push(filled.get(key) ?? { key, year, month, articles: [] });
  }
  return out;
}

/* -------------------------------------------------------------------------
   Séria / nadväznosť (sekcia 09, druhá vlna)
   ------------------------------------------------------------------------- */

export interface SeriesInfo {
  parent?: Article;
  /** Všetky články, ktoré nadväzujú na tento. */
  children: Article[];
  /** Číslovanie beží len pri vetve 1 : 1. */
  numbering?: { position: number; total: number; chain: Article[] };
  next?: Article;
}

export function seriesFor(articles: Article[], current: Article): SeriesInfo {
  const byId = new Map(articles.map((a) => [a.id, a]));
  const parent = current.follows ? byId.get(current.follows) : undefined;
  const children = articles
    .filter((a) => a.follows === current.id)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  const info: SeriesInfo = { parent, children };
  if (!parent && children.length === 0) return info;

  /* Číslovanie sa vypne, len čo má niektorý článok v reťazi dve pokračovania. */
  const childrenOf = (id: string) => articles.filter((a) => a.follows === id);

  const chain: Article[] = [];
  let head: Article | undefined = current;
  while (head) {
    chain.unshift(head);
    head = head.follows ? byId.get(head.follows) : undefined;
  }

  let tail: Article | undefined = current;
  let branched = children.length > 1;
  while (tail && !branched) {
    const next: Article[] = childrenOf(tail.id);
    if (next.length > 1) {
      branched = true;
      break;
    }
    tail = next[0];
    if (tail) chain.push(tail);
  }

  for (const link of chain) {
    if (childrenOf(link.id).length > 1) branched = true;
  }

  if (!branched && chain.length > 1) {
    info.numbering = {
      position: chain.findIndex((a) => a.id === current.id) + 1,
      total: chain.length,
      chain,
    };
    info.next = chain[chain.findIndex((a) => a.id === current.id) + 1];
  }

  return info;
}

/* -------------------------------------------------------------------------
   Zoradenie
   ------------------------------------------------------------------------- */

export const SORT_KEYS = ['newest', 'oldest', 'alpha', 'reading'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export function sortArticles(articles: Article[], sort: SortKey, lang: Lang): Article[] {
  const copy = [...articles];
  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => a.date.valueOf() - b.date.valueOf());
    case 'alpha':
      return copy.sort((a, b) => a.title.localeCompare(b.title, lang));
    case 'reading':
      return copy.sort((a, b) => a.readingTime - b.readingTime || b.date.valueOf() - a.date.valueOf());
    default:
      return copy.sort((a, b) => b.date.valueOf() - a.date.valueOf());
  }
}

/** Článok je NOVÝ do 7 dní od publikovania. */
export function isNew(article: Article, now = new Date()): boolean {
  return now.valueOf() - article.date.valueOf() < 7 * 86_400_000;
}

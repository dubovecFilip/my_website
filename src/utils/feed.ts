import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getArticles } from './articles';
import { t, type Lang } from '../i18n/dict';

const FALLBACK_SITE = 'https://boggelino.netlify.app';

/** RSS pre jednu mutáciu. Rozpísané články sa do kanála nedávajú. */
export async function feedFor(lang: Lang, context: APIContext) {
  const site = context.site?.toString() ?? FALLBACK_SITE;
  const d = t(lang);
  const articles = (await getArticles(lang)).filter((article) => !article.draft);

  return rss({
    title: `${d.site_name}_`,
    description: d.site_description,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: articles.map((article) => ({
      title: article.title,
      description: article.description,
      pubDate: article.date,
      link: article.href,
      categories: article.tags,
    })),
    customData: [
      `<language>${lang}</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${new URL(`/${lang}/rss.xml`, site).href}" rel="self" type="application/rss+xml" />`,
    ].join(''),
  });
}

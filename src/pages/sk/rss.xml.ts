import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

const FALLBACK_SITE = 'https://boggelino.netlify.app';

export async function GET(context: APIContext) {
  const site = context.site?.toString() ?? FALLBACK_SITE;

  const articles = await getCollection('articles-sk', ({ data }) => !data.draft);
  const sorted = [...articles].sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: 'MOMENTUM',
    description: 'Články, názory a veci, ktoré ma bavia. Píše BOGGELINO.',
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: sorted.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.date,
      link: `/sk/articles/${article.id}/`,
      categories: article.data.tags,
    })),
    customData: [
      `<language>sk</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${new URL('/sk/rss.xml', site).href}" rel="self" type="application/rss+xml" />`,
    ].join(''),
  });
}

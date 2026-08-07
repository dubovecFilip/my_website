import type { APIRoute } from 'astro';
import { languages } from '../i18n/dict';
import { getArticles, tagCounts } from '../utils/articles';

/**
 * Index vyhľadávania (sekcia 14): názov, popis, štítky. Jeden súbor pre obe
 * mutácie, dialóg si vyberie tú svoju.
 */
export const GET: APIRoute = async () => {
  const payload: Record<string, unknown> = {};

  for (const lang of languages) {
    const articles = await getArticles(lang);
    payload[lang] = {
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        desc: a.description,
        tags: a.tags,
        href: a.href,
        draft: a.draft,
      })),
      tags: tagCounts(articles).map((tag) => ({
        name: tag.name,
        count: tag.count,
        href: `/${lang}/articles/?tag=${encodeURIComponent(tag.name)}`,
      })),
    };
  }

  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};

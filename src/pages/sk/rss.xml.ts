import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles-sk', ({ data }) => !data.draft);
  const sorted = articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'BOGGELINO',
    description: 'Articles, opinions, and things I like, by BOGGELINO.',
    site: context.site ?? 'https://boggelino.example.com',
    items: sorted.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.date,
      link: `/sk/articles/${article.id}/`,
      categories: article.data.tags,
    })),
    customData: `<language>sk</language>`,
  });
}

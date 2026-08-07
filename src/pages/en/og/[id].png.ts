import type { APIRoute } from 'astro';
import { getArticles, getArticle } from '../../../utils/articles';
import { renderOgCard } from '../../../utils/og';

export async function getStaticPaths() {
  const articles = await getArticles('en');
  return articles.map((article) => ({ params: { id: article.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const article = await getArticle('en', String(params.id));
  if (!article) return new Response('Not found', { status: 404 });

  const png = await renderOgCard(article, 'en');
  return new Response(new Uint8Array(png), {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' },
  });
};

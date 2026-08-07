import type { APIContext } from 'astro';
import { languages } from '../i18n/dict';
import { getArticles } from '../utils/articles';

const FALLBACK_SITE = 'https://boggelino.netlify.app';

export async function GET(context: APIContext) {
  const site = context.site?.toString() ?? FALLBACK_SITE;
  const urls: { loc: string; lastmod?: string }[] = [];

  for (const lang of languages) {
    urls.push({ loc: `/${lang}/` });
    urls.push({ loc: `/${lang}/articles/` });
    urls.push({ loc: `/${lang}/about/` });
    for (const article of await getArticles(lang)) {
      urls.push({ loc: article.href, lastmod: article.date.toISOString() });
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url><loc>${new URL(url.loc, site).href}</loc>${
        url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''
      }</url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}

import type { GetStaticPathsResult } from 'astro';
import { getArticles, slugify } from './articles';
import { languages, otherLang, type Lang } from '../i18n/dict';

/**
 * Cesty článkov pre daný jazyk. Okrem vlastných článkov sa generujú aj
 * obrazovky pre ID, ktoré v tomto jazyku ešte nemajú preklad, tie ukážu
 * oznam, pôvodinu a archív. Nikdy 404 (sekcia 14).
 */
export async function articlePaths(lang: Lang): Promise<GetStaticPathsResult> {
  const mine = await getArticles(lang);
  const paths: GetStaticPathsResult = [];

  for (const article of mine) {
    paths.push({
      params: { slug: `${article.id}-${article.slug}` },
      props: { lang, id: article.id, missing: false, redirectTo: null },
    });

    /* Kanonické je ID, samotné /836206/ presmeruje na plný tvar. */
    paths.push({
      params: { slug: article.id },
      props: { lang, id: article.id, missing: false, redirectTo: article.href },
    });
  }

  const known = new Set(mine.map((a) => a.id));
  const source = otherLang(lang);

  for (const article of await getArticles(source)) {
    if (known.has(article.id)) continue;
    const slug = slugify(article.title);
    paths.push({
      params: { slug: `${article.id}-${slug}` },
      props: { lang, id: article.id, missing: true, redirectTo: null },
    });
    paths.push({
      params: { slug: article.id },
      props: {
        lang,
        id: article.id,
        missing: true,
        redirectTo: `/${lang}/articles/${article.id}-${slug}/`,
      },
    });
  }

  return paths;
}

/** Všetky jazyky, používa sitemap aj generátor presmerovaní. */
export async function allArticlePaths(): Promise<
  { lang: Lang; id: string; slug: string; href: string }[]
> {
  const out: { lang: Lang; id: string; slug: string; href: string }[] = [];
  for (const lang of languages) {
    for (const article of await getArticles(lang)) {
      out.push({ lang, id: article.id, slug: article.slug, href: article.href });
    }
  }
  return out;
}

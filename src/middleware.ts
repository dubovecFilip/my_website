import { defineMiddleware } from 'astro:middleware';
import { defaultLang } from './i18n/dict';

/**
 * Kanonický tvar adresy má koncovú lomku, takže /sk skončí na /sk/ a koreň
 * na /{defaultLang}/.
 *
 * V ostrej prevádzke to robí Netlify podľa pravidiel v _redirects, ktoré
 * generuje integrácia momentum:redirects. Toto je tá istá logika pre
 * `astro dev`, aby sa vývoj správal rovnako ako nasadený web. Pri builde sa
 * nespúšťa, inak by presmerovanie nahradilo vygenerovanú stránku.
 */
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

export const onRequest = defineMiddleware((context, next) => {
  if (!import.meta.env.DEV) return next();

  const { pathname, search } = context.url;

  if (pathname === '/') {
    return context.redirect(`/${defaultLang}/${search}`, 302);
  }

  if (!pathname.endsWith('/') && !HAS_EXTENSION.test(pathname)) {
    return context.redirect(`${pathname}/${search}`, 301);
  }

  return next();
});

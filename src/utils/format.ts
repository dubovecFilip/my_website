import type { Lang } from '../i18n/dict';
import { t } from '../i18n/dict';

/**
 * Dátum má vo všetkých jazykoch rovnaký číselný tvar 14. 07. 2026
 * (sekcia 11 aj 14). Nemení sa podľa locale.
 */
export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}. ${m}. ${date.getFullYear()}`;
}

/** Strojovo čitateľný tvar pre <time datetime>. */
export function isoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Krátky tvar do meta riadku: „8 MIN“. */
export function readingTimeShort(minutes: number, lang: Lang): string {
  return `${minutes} ${t(lang).reading_unit}`;
}

/**
 * Čítačka obrazovky má počuť „8 minút čítania“, nie „8 min“ (sekcia 11).
 */
export function readingTimeLong(minutes: number, lang: Lang): string {
  const d = t(lang);
  if (lang === 'sk') {
    const word = minutes === 1 ? 'minúta' : minutes < 5 ? 'minúty' : 'minút';
    return `${minutes} ${word} ${d.reading_suffix}`;
  }
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${d.reading_suffix}`;
}

const MONTHS: Record<Lang, string[]> = {
  sk: ['JAN', 'FEB', 'MAR', 'APR', 'MÁJ', 'JÚN', 'JÚL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'],
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
};

export function monthLabel(month: number, year: number, lang: Lang): string {
  return `${MONTHS[lang][month]} ${year}`;
}

/** „3 ČLÁNKY“ / „3 ARTICLES“: slovenčina má tri tvary. */
export function articleCount(n: number, lang: Lang): string {
  const d = t(lang);
  if (lang === 'sk') {
    if (n === 1) return `${n} ${d.count_article_one}`;
    if (n >= 2 && n <= 4) return `${n} ${d.count_article_few}`;
    return `${n} ${d.count_article_many}`;
  }
  return `${n} ${n === 1 ? d.count_article_one : d.count_article_many}`;
}

export function tagCountLabel(n: number, lang: Lang): string {
  const d = t(lang);
  if (lang === 'sk') {
    if (n === 1) return `${n} ${d.count_tag_one}`;
    if (n >= 2 && n <= 4) return `${n} ${d.count_tag_few}`;
    return `${n} ${d.count_tag_many}`;
  }
  return `${n} ${n === 1 ? d.count_tag_one : d.count_tag_many}`;
}

export function chapterCount(n: number, lang: Lang): string {
  const d = t(lang);
  if (lang === 'sk') {
    if (n === 1) return `${n} ${d.count_chapter_one}`;
    if (n >= 2 && n <= 4) return `${n} ${d.count_chapter_few}`;
    return `${n} ${d.count_chapter_many}`;
  }
  return `${n} ${n === 1 ? d.count_chapter_one : d.count_chapter_many}`;
}

export function resultCountLabel(n: number, lang: Lang): string {
  const d = t(lang);
  if (lang === 'sk') {
    if (n === 0) return d.results_none;
    if (n === 1) return `${n} ${d.count_result_one}`;
    if (n >= 2 && n <= 4) return `${n} ${d.count_result_few}`;
    return `${n} ${d.count_result_many}`;
  }
  if (n === 0) return d.results_none;
  return `${n} ${n === 1 ? d.count_result_one : d.count_result_many}`;
}

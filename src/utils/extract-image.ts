/**
 * Článok nemá titulný obrázok, prvý obrázok v texte je zároveň náhľad
 * všade inde (sekcia 16, pravidlo 03). Tieto dve funkcie sú jediný zdroj
 * náhľadu pre karty, OG kartu aj zdieľanie.
 */

const FIRST_IMAGE = /!\[([^\]]*)\]\(([^)\s]+)/;

export function extractFirstImage(body: string | undefined): string | undefined {
  if (!body) return undefined;
  return body.match(FIRST_IMAGE)?.[2];
}

export function extractFirstImageAlt(body: string | undefined): string | undefined {
  if (!body) return undefined;
  const alt = body.match(FIRST_IMAGE)?.[1]?.trim();
  return alt ? alt : undefined;
}

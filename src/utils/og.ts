import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Article } from './articles';
import type { Lang } from '../i18n/dict';
import { t } from '../i18n/dict';
import { formatDate, readingTimeShort } from './format';

/**
 * Generovaná OG karta (sekcia 10).
 * Jedna šablóna 1200 × 630 v identite webu, bez fotografie, len typografia
 * na #111111, aby karta vyzerala rovnako pri každom článku.
 */

const WIDTH = 1200;
const HEIGHT = 630;
const PAD = 72;
const TITLE_MAX = 88;
const TITLE_MIN = 40;
const TITLE_STEP = 8;
const TITLE_LINES = 3;

/* Rezy sa čítajú z projektu, OG karty vznikajú výhradne pri builde. */
function font(name: string): Buffer {
  return readFileSync(join(process.cwd(), 'src', 'assets', 'fonts', name));
}

const fonts = [
  { name: 'Anton', data: font('anton-400.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: font('inter-400.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: font('inter-500.ttf'), weight: 500 as const, style: 'normal' as const },
  { name: 'JetBrains Mono', data: font('jetbrains-500.ttf'), weight: 500 as const, style: 'normal' as const },
];

/** Anton je úzky rez: priemerná šírka znaku je zhruba 0,42 × veľkosť písma. */
function fitTitleSize(title: string): number {
  const available = WIDTH - PAD * 2;
  for (let size = TITLE_MAX; size >= TITLE_MIN; size -= TITLE_STEP) {
    const perLine = Math.max(1, Math.floor(available / (size * 0.42)));
    const words = title.split(/\s+/);
    let lines = 1;
    let current = 0;
    for (const word of words) {
      const add = current === 0 ? word.length : word.length + 1;
      if (current + add > perLine) {
        lines += 1;
        current = word.length;
      } else {
        current += add;
      }
    }
    if (lines <= TITLE_LINES) return size;
  }
  return TITLE_MIN;
}

type Node = {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
};

const h = (type: string, props: Record<string, unknown>, ...children: unknown[]): Node => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
});

export async function renderOgCard(article: Article, lang: Lang): Promise<Buffer> {
  const d = t(lang);
  const titleSize = fitTitleSize(article.title);
  const tags = article.tags.slice(0, 2).map((tag) => tag.toUpperCase()).join(' · ');

  const tree = h(
    'div',
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: PAD,
        backgroundColor: '#111111',
        fontFamily: 'Inter',
      },
    },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'baseline', fontFamily: 'Anton', fontSize: 34, color: '#f4f2ec', letterSpacing: -0.5 } },
        h('span', {}, d.site_name),
        /* Rovnaký kreslený podčiarkovník ako na webe, sedí na účiare. */
        h('span', {
          style: {
            display: 'block',
            width: '19px',
            height: '5px',
            marginLeft: '2px',
            marginBottom: '4px',
            background: '#d93f11',
            alignSelf: 'flex-end',
          },
        }),
      ),
      tags
        ? h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'JetBrains Mono',
                fontSize: 20,
                letterSpacing: 3,
                color: '#f2724a',
              },
            },
            tags,
          )
        : h('div', { style: { display: 'flex' } }, ''),
    ),

    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 28 } },
      /* Rozpísaný článok má namiesto červenej linky jantárový šrafovaný pás. */
      h('div', {
        style: {
          width: article.draft ? 220 : 120,
          height: 6,
          borderRadius: 3,
          backgroundColor: article.draft ? '#d9861f' : '#d93f11',
          display: 'flex',
        },
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: titleSize,
            lineHeight: 1.02,
            letterSpacing: -1,
            color: '#f4f2ec',
          },
        },
        article.title,
      ),
    ),

    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono',
          fontSize: 22,
          letterSpacing: 3,
          color: '#8f8a80',
        },
      },
      h(
        'div',
        { style: { display: 'flex' } },
        `${formatDate(article.date)} · ${
          article.draft ? d.badge_draft.toUpperCase() : readingTimeShort(article.readingTime, lang).toUpperCase()
        }`,
      ),
      h('div', { style: { display: 'flex' } }, 'BOGGELINO.NETLIFY.APP'),
    ),
  );

  const svg = await satori(tree as never, { width: WIDTH, height: HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  return Buffer.from(png);
}

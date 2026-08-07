import { readdir, writeFile, readFile, access } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

/**
 * Presmerovania pre Netlify (sekcia 05 a 14).
 *
 *  1. Adresa bez lomky na konci vedie na tvar s lomkou. Web beží na
 *     trailingSlash: 'always', takže /sk musí skončiť na /sk/ a nie na 404.
 *  2. Kanonické je ID, takže samotné /sk/articles/836206/ presmeruje na plný
 *     tvar so slugom.
 *  3. Staré ID (článok premenovaný, zmazaný alebo presunutý) si build pamätá
 *     v tabuľke src/data/redirects.json a pošle čitateľa rovno na nový tvar.
 *
 * Nikdy sa nepresmerúva na „podobný“ článok. Pri číselných ID je najbližší
 * článok náhodný a poslať čitateľa na cudzí text je horšie než 404.
 */
export default function redirectsIntegration() {
  return {
    name: 'momentum:redirects',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = dir.pathname.replace(/^\/([A-Za-z]:)/, '$1');
        const lines = [];

        /* 1 · Holé ID článku vedie na plný tvar so slugom.
              Musí byť pred všeobecnými pravidlami, inak by ho predbehli. */
        const handled = new Set();
        for (const lang of ['sk', 'en']) {
          const base = join(out, lang, 'articles');
          let entries = [];
          try {
            entries = await readdir(base, { withFileTypes: true });
          } catch {
            continue;
          }

          for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const match = entry.name.match(/^(\d+)-(.+)$/);
            if (!match) continue;
            const bare = `/${lang}/articles/${match[1]}`;
            lines.push(`${bare}  /${lang}/articles/${entry.name}/  301`);
            lines.push(`${bare}/  /${lang}/articles/${entry.name}/  301`);
            handled.add(bare);
          }
        }

        /* 2 · Každá ďalšia stránka dostane pravidlo bez koncovej lomky. */
        const pages = [];
        const walk = async (folder) => {
          let entries = [];
          try {
            entries = await readdir(folder, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
            if (entry.isDirectory()) {
              const next = join(folder, entry.name);
              try {
                await access(join(next, 'index.html'));
                pages.push(`/${relative(out, next).split(sep).join('/')}`);
              } catch {
                /* Priečinok bez vlastnej stránky, ide sa ďalej do hĺbky. */
              }
              await walk(next);
            }
          }
        };
        await walk(out);

        for (const page of pages.sort()) {
          if (handled.has(page)) continue;
          lines.push(`${page}  ${page}/  301`);
        }

        /* 3 · Tabuľka starých ID: { "sk": { "742018": "836206" } } */
        const tablePath = new URL('../data/redirects.json', import.meta.url);
        try {
          await access(tablePath);
          const table = JSON.parse(await readFile(tablePath, 'utf8'));
          for (const [lang, map] of Object.entries(table)) {
            for (const [oldId, newId] of Object.entries(map)) {
              lines.push(`/${lang}/articles/${oldId}*  /${lang}/articles/${newId}  301`);
            }
          }
        } catch {
          /* Tabuľka je voliteľná. */
        }

        lines.push('/  /sk/  302');

        await writeFile(join(out, '_redirects'), `${lines.join('\n')}\n`, 'utf8');
        logger.info(`_redirects · ${lines.length} pravidiel`);
      },
    },
  };
}

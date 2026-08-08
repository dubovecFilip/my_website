/**
 * Obrázky rozpísaného článku.
 *
 * V Compose ukladáme obrázky rovno do priečinka projektu, ale web ich vie
 * podať až po builde a nasadení. Kým sa tak nestane, adresa
 * /images/articles/<id>/<súbor> nikam nevedie a v náhľade zostane prázdne
 * miesto.
 *
 * Preto obsah súborov prečítame z vybraného priečinka a odložíme do
 * IndexedDB. Náhľadové stránky si ho vytiahnu a adresy v obrázkoch vymenia za
 * blob: odkazy na tie isté dáta. Ide o rovnaký pôvod, takže netreba nové
 * povolenie ani otvorené Compose — a obrázok vidno hneď, ešte pred prvým
 * commitom.
 *
 * IndexedDB volíme zámerne: localStorage by fotky neuniesol a blob: odkazy z
 * inej karty prestanú platiť, len čo sa tá karta zavrie.
 */

const DB_NAME = 'momentum-compose';
const DB_VERSION = 2;

/** Handle priečinka aj obrázky sedia v jednej databáze, aby si verzie neprekážali. */
export function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
      if (!db.objectStoreNames.contains('media')) db.createObjectStore('media');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    /* Staršia karta drží predošlú verziu: radšej sa vzdáme, než by sme čakali. */
    request.onblocked = () => reject(new Error('Databáza je otvorená v inej karte.'));
  });
}

/** Cesta v článku → obsah súboru. Kľúč je presne to, čo je v markdowne. */
export type MediaBag = Record<string, Blob>;

export async function savePreviewMedia(files: MediaBag): Promise<void> {
  try {
    const db = await idb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('media', 'readwrite');
      tx.objectStore('media').put(files, 'preview');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* Bez odloženia sa náhľad iba vráti k adresám z webu. */
  }
}

async function readPreviewMedia(): Promise<MediaBag> {
  try {
    const db = await idb();
    return await new Promise((resolve) => {
      const tx = db.transaction('media', 'readonly');
      const request = tx.objectStore('media').get('preview');
      request.onsuccess = () => resolve((request.result as MediaBag) ?? {});
      request.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

/** Z ciest v článku spraví blob: odkazy použiteľné v tomto dokumente. */
export async function previewMediaUrls(): Promise<Map<string, string>> {
  const files = await readPreviewMedia();
  const urls = new Map<string, string>();
  for (const [path, blob] of Object.entries(files)) {
    if (blob instanceof Blob) urls.set(path, URL.createObjectURL(blob));
  }
  return urls;
}

/**
 * Cesta sa porovnáva bez ohľadu na to, či je zapísaná ako /images/… alebo
 * s doménou; rozhoduje sama cesta.
 */
function normalise(src: string): string {
  try {
    return new URL(src, location.origin).pathname;
  } catch {
    return src;
  }
}

/** Adresa použiteľná hneď: buď odložené dáta, alebo pôvodná cesta. */
export function resolveMedia(src: string, urls: Map<string, string>): string {
  return urls.get(normalise(src)) ?? src;
}

/**
 * Vymení adresy v už vykreslených obrázkoch za odložené dáta. Voláme to v tom
 * istom kroku ako vykreslenie, aby prehliadač o pôvodnú cestu ani nepožiadal.
 */
export function applyPreviewMedia(root: ParentNode, urls: Map<string, string>): void {
  if (urls.size === 0) return;
  for (const img of root.querySelectorAll<HTMLImageElement>('img[src]')) {
    const url = urls.get(normalise(img.getAttribute('src') ?? ''));
    if (url) img.src = url;
  }
}

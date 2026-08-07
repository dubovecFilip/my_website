/**
 * Náhľadové stránky Compose.
 *
 * Sú to skutočné obrazovky webu, len do nich pred vykreslením pridáme
 * rozpísaný článok. Nič sa nenahrádza: článok pribudne ako najnovší a ostatné
 * sa posunú presne tak, ako by sa posunuli po skutočnom publikovaní. Preto sa
 * náhľad správa rovnako ako ostrý web vrátane zmeny šírky okna.
 */
import { renderMarkdown, headingsOf, firstImage, readingMinutes, escapeHtml } from './markdown';

export const PREVIEW_KEY = 'momentum:preview';

export interface PreviewDraft {
  title: string;
  description: string;
  tags: string[];
  body: string;
  authorNote: string;
  date: string;
  draft: boolean;
  pinned: boolean;
  lang: string;
}

function readDraft(): PreviewDraft | null {
  try {
    const raw = localStorage.getItem(PREVIEW_KEY);
    return raw ? (JSON.parse(raw) as PreviewDraft) : null;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}. ${m}. ${y}` : iso;
}

function setText(root: ParentNode, selector: string, value: string): void {
  const el = root.querySelector(selector);
  if (el) el.textContent = value;
}

function setTags(root: ParentNode, selector: string, tags: string[]): void {
  const el = root.querySelector(selector);
  if (!el) return;
  el.innerHTML = tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
}

function setMeta(root: ParentNode, selector: string, dateIso: string, minutes: number): void {
  const meta = root.querySelector(selector);
  if (!meta) return;
  const time = meta.querySelector('time');
  if (time) {
    time.textContent = formatDate(dateIso);
    time.setAttribute('datetime', dateIso);
  }
  const minutesEl = meta.querySelector('.card-read-time, .feature-time, .related-time');
  if (minutesEl) {
    const svg = minutesEl.querySelector('svg')?.outerHTML ?? '';
    minutesEl.innerHTML = `${svg} ${minutes} min`;
  }
}

/**
 * Obrázok sa nikdy nededí po predchádzajúcom článku. Keď rozpísaný text
 * žiadny nemá, nasadí sa tichý monogram, presne ako na webe.
 */
function setMedia(media: Element | null, image: string | null): void {
  if (!media) return;
  const img = media.querySelector<HTMLImageElement>('img');
  const existing = media.querySelector('.ph');

  if (image) {
    existing?.remove();
    if (img) {
      img.hidden = false;
      img.src = image;
    }
    return;
  }

  if (img) img.hidden = true;
  if (existing) return;

  const template = document.querySelector<HTMLTemplateElement>('template[data-ph-template]');
  if (template) media.appendChild(template.content.cloneNode(true));
}

interface CardData {
  title: string;
  desc: string;
  tags: string[];
  dateIso: string;
  minutes: number;
  image: string | null;
  href: string;
}

function readFeature(feature: Element): CardData {
  const time = feature.querySelector('time');
  const minutes = Number(
    feature.querySelector('.feature-time')?.textContent?.match(/\d+/)?.[0] ?? '1',
  );
  return {
    title: feature.querySelector('.feature-title')?.textContent?.trim() ?? '',
    desc: feature.querySelector('.feature-desc')?.textContent?.trim() ?? '',
    tags: [...feature.querySelectorAll('.feature-tags .tag')].map((t) => t.textContent?.trim() ?? ''),
    dateIso: time?.getAttribute('datetime') ?? '',
    minutes,
    image: feature.querySelector<HTMLImageElement>('.feature-media img')?.getAttribute('src') ?? null,
    href: feature.querySelector<HTMLAnchorElement>('.feature-link')?.getAttribute('href') ?? '#',
  };
}

function fillCard(card: Element, data: CardData): void {
  setText(card, '.card-title', data.title);
  const desc = card.querySelector('.card-desc');
  if (desc) desc.textContent = data.desc;
  setTags(card, '.card-tags', data.tags);
  setMeta(card, '.card-meta', data.dateIso, data.minutes);
  setMedia(card.querySelector('.card-media'), data.image);

  const link = card.querySelector<HTMLAnchorElement>('.card-link');
  if (link) {
    link.href = data.href;
    const sr = link.querySelector('.sr-only');
    if (sr) sr.textContent = data.title;
  }

  card.querySelector('.card-flags')?.remove();
}

function draftAsCard(draft: PreviewDraft, minutes: number, image: string | null): CardData {
  return {
    title: draft.title,
    desc: draft.description,
    tags: draft.tags,
    dateIso: draft.date,
    minutes,
    image,
    href: '/compose/preview/article/',
  };
}

/** „4 články" → „5 článkov" a podobne; číslo v texte sa zvýši o jedna. */
function bumpCount(el: Element | null): void {
  if (!el) return;
  const text = el.textContent ?? '';
  const match = text.match(/\d+/);
  if (!match) return;
  const next = Number(match[0]) + 1;
  const word =
    next === 1 ? 'článok' : next >= 2 && next <= 4 ? 'články' : 'článkov';
  el.textContent = /článk|článok/i.test(text) ? `${next} ${word}` : text.replace(match[0], String(next));
}

export function initPreview(): void {
  const mode = document.body.dataset.preview;
  if (!mode) return;

  /* Beží raz. Druhý priechod by pridal článok znova a za predchádzajúci by
     považoval už podstrčený rozpísaný text. */
  if (document.body.dataset.previewDone === '1') return;
  document.body.dataset.previewDone = '1';

  const draft = readDraft();
  if (!draft) return;

  const minutes = readingMinutes(draft.body);
  const image = firstImage(draft.body);

  /* --- Homepage: rozpísaný ide na hlavnú kartu, doterajší do mriežky --- */
  if (mode === 'home') {
    const feature = document.querySelector('.feature');
    const grid = document.querySelector('.grid-grid');
    if (!feature) return;

    const previous = readFeature(feature);

    setText(feature, '.feature-title', draft.title);
    const desc = feature.querySelector('.feature-desc');
    if (desc) desc.textContent = draft.description;
    setTags(feature, '.feature-tags', draft.tags);
    setMeta(feature, '.feature-meta', draft.date, minutes);
    setText(
      feature,
      '.feature-label',
      draft.draft ? 'Rozpísané' : draft.pinned ? 'Pripnutý článok' : 'Najnovší článok',
    );
    setMedia(feature.querySelector('.feature-media'), image);
    const link = feature.querySelector<HTMLAnchorElement>('.feature-link');
    if (link) link.href = '/compose/preview/article/';

    /* Doterajšia hlavná karta sa presunie na začiatok mriežky. */
    const firstCell = grid?.querySelector('.grid-cell');
    if (grid && firstCell && previous.title) {
      const cell = firstCell.cloneNode(true) as HTMLElement;
      cell.classList.remove('reveal');
      cell.classList.add('is-in');
      const card = cell.querySelector('.card');
      if (card) fillCard(card, previous);
      grid.insertBefore(cell, firstCell);

      /* Homepage ukazuje najviac deväť kariet, posledná teda vypadne. */
      const cells = [...grid.querySelectorAll('.grid-cell')];
      if (cells.length > 9) cells[cells.length - 1].remove();
    }

    /* Odkaz do archívu hlási o jeden článok viac. */
    const archiveLink = document.querySelector('.more-link');
    if (archiveLink) {
      const text = archiveLink.textContent ?? '';
      const n = text.match(/\d+/);
      if (n) archiveLink.textContent = text.replace(n[0], String(Number(n[0]) + 1));
    }
    return;
  }

  /* --- Archív: rozpísaný pribudne ako prvá karta v najnovšom mesiaci --- */
  if (mode === 'archive') {
    const list = document.querySelector('[data-list]');
    const firstCell = list?.querySelector<HTMLElement>('[data-item]');
    if (!list || !firstCell) return;

    const cell = firstCell.cloneNode(true) as HTMLElement;
    cell.classList.remove('reveal');
    cell.classList.add('is-in');
    cell.dataset.id = 'preview-draft';
    cell.dataset.title = draft.title;
    cell.dataset.desc = draft.description;
    cell.dataset.date = draft.date;
    cell.dataset.reading = String(minutes);
    cell.dataset.itemTags = draft.tags.join('|');
    cell.dataset.href = '/compose/preview/article/';

    const card = cell.querySelector('.card');
    if (card) fillCard(card, draftAsCard(draft, minutes, image));
    firstCell.parentElement?.insertBefore(cell, firstCell);

    bumpCount(document.querySelector('.arch-counts .arch-pill'));
    bumpCount(list.querySelector('[data-month-head] .month-count'));
    return;
  }

  /* --- Stránka článku: tu je rozpísaný článok jediný obsah --- */
  if (mode === 'article') {
    setText(document, '.art-title', draft.title);
    const lead = document.querySelector('.art-lead');
    if (lead) lead.textContent = draft.description;
    setTags(document, '.art-tags', draft.tags);

    const state = document.querySelector('.art-state');
    if (state) {
      state.textContent = draft.draft ? 'Rozpísané' : 'Publikované';
      state.classList.toggle('is-draft', draft.draft);
      state.classList.toggle('is-live', !draft.draft);
    }
    setMeta(document, '.art-status', draft.date, minutes);

    const body = document.querySelector('.article-body');
    if (body) body.innerHTML = renderMarkdown(draft.body);

    /*
     * Obsah sa poskladá z nadpisov v texte. Položky klonujeme zo serverom
     * vykreslenej predlohy, aby si zachovali scopované štýly komponentu.
     */
    const list = document.querySelector('.toc-list');
    const template = list?.querySelector('.toc-item');
    if (list && template) {
      const items = headingsOf(draft.body);
      let chapter = 0;

      const rows = items.map((h) => {
        const li = template.cloneNode(true) as HTMLElement;
        if (h.depth === 2) chapter += 1;
        li.classList.toggle('is-sub', h.depth === 3);

        const mark = h.depth === 2 ? String(chapter).padStart(2, '0') : '–';
        const n = li.querySelector('.toc-n');
        if (n) {
          n.textContent = mark;
          if (h.depth === 3) n.setAttribute('aria-hidden', 'true');
          else n.removeAttribute('aria-hidden');
        }
        setText(li, '.toc-label', h.text);

        const link = li.querySelector<HTMLAnchorElement>('.toc-link');
        if (link) {
          link.href = `#${h.slug}`;
          link.dataset.tocLink = h.slug;
          link.classList.remove('is-active');
        }
        return li;
      });

      list.replaceChildren(...rows);
      setText(
        document,
        '.toc-count',
        `${chapter} ${chapter === 1 ? 'kapitola' : chapter < 5 ? 'kapitoly' : 'kapitol'}`,
      );
      const toc = document.querySelector<HTMLElement>('[data-toc]');
      if (toc) toc.hidden = items.length === 0;
    }

    const note = document.querySelector<HTMLElement>('.author-note');
    if (note) {
      note.textContent = draft.authorNote ? `„${draft.authorNote}“` : '';
      note.hidden = !draft.authorNote;
    }
  }
}

/**
 * Archív (sekcia 03 + 09).
 *
 * Stav filtra drží URL (?tag=&sort=&q=&month=&page=), voľba zobrazenia ide do
 * localStorage a do URL nejde. Bez JavaScriptu ostáva v archíve celý
 * zoznam. Neuberá sa obsah, len interaktivita.
 */

const PAGE_SIZE = 12;
const VIEW_KEY = 'momentum:view';

type Sort = 'newest' | 'oldest' | 'alpha' | 'reading';

interface Item {
  el: HTMLElement;
  id: string;
  month: string;
  tags: string[];
  haystack: string;
  date: string;
  reading: number;
  title: string;
  href: string;
}

interface Labels {
  all: string;
  filter: string;
  sorted: string;
  search: string;
  page: string;
  none: string;
  one: string;
  few: string;
  many: string;
  tagOne: string;
  tagFew: string;
  tagMany: string;
}

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function initArchive(): void {
  const shell = document.querySelector<HTMLElement>('[data-arch]');
  const list = document.querySelector<HTMLElement>('[data-list]');
  if (!shell || !list) return;
  if (list.dataset.bound === '1') return;
  list.dataset.bound = '1';

  const labels: Labels = JSON.parse(shell.dataset.labels ?? '{}');
  const lang = document.documentElement.lang || 'sk';
  const slovak = lang === 'sk';

  const items: Item[] = [...list.querySelectorAll<HTMLElement>('[data-item]')].map((el) => ({
    el,
    id: el.dataset.id ?? '',
    month: el.dataset.month ?? '',
    tags: (el.dataset.itemTags ?? '').split('|').filter(Boolean),
    haystack: fold(`${el.dataset.title ?? ''} ${el.dataset.desc ?? ''}`),
    date: el.dataset.date ?? '',
    reading: Number(el.dataset.reading ?? '0'),
    title: el.dataset.title ?? '',
    href: el.dataset.href ?? '',
  }));

  /* Pôvodné poradie v DOM, pri návrate k nefiltrovanému zoznamu sa obnoví,
     aby články opäť sedeli pod svojimi mesiacmi. */
  const originalOrder = [...list.children] as HTMLElement[];
  const monthHeads = [...list.querySelectorAll<HTMLElement>('[data-month-head]')];

  const resultEl = document.querySelector<HTMLElement>('[data-result]');
  const pageLabel = document.querySelector<HTMLElement>('[data-page-label]');
  const emptyEl = document.querySelector<HTMLElement>('[data-empty]');
  const pager = document.querySelector<HTMLElement>('[data-pagination]');
  const pagerList = document.querySelector<HTMLElement>('[data-page-list]');
  const prevBtn = document.querySelector<HTMLButtonElement>('[data-page-prev]');
  const nextBtn = document.querySelector<HTMLButtonElement>('[data-page-next]');

  const qInput = document.querySelector<HTMLInputElement>('[data-filter-q]');
  const qCount = document.querySelector<HTMLElement>('[data-q-count]');
  const qClear = document.querySelector<HTMLButtonElement>('[data-q-clear]');
  const tagSearch = document.querySelector<HTMLInputElement>('[data-tag-search]');
  const tagList = document.querySelector<HTMLElement>('[data-tag-list]');
  const tagRows = [...document.querySelectorAll<HTMLButtonElement>('[data-tag]')];
  const tagsClear = document.querySelector<HTMLButtonElement>('[data-tags-clear]');
  const tagsClearCount = document.querySelector<HTMLElement>('[data-tags-clear-count]');
  const sortRoot = document.querySelector<HTMLElement>('[data-sort]');
  const sortTrigger = document.querySelector<HTMLButtonElement>('[data-sort-trigger]');
  const sortPanel = document.querySelector<HTMLElement>('[data-sort-panel]');
  const sortCurrent = document.querySelector<HTMLElement>('[data-sort-current]');
  const timeline = document.querySelector<HTMLElement>('[data-timeline]');
  const timelineBars = [...document.querySelectorAll<HTMLButtonElement>('button[data-month]')];
  const viewButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-view]')];
  const filterShell = document.querySelector<HTMLElement>('[data-filter-shell]');
  const filtersBadge = document.querySelector<HTMLElement>('[data-filters-badge]');
  const randomBtn = document.querySelector<HTMLButtonElement>('[data-random]');

  /* --- Stav ---------------------------------------------------------- */

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') ?? '',
    tags: new Set((params.get('tag') ?? '').split(',').filter(Boolean)),
    sort: (params.get('sort') as Sort) || 'newest',
    month: params.get('month') ?? '',
    page: Math.max(1, Number(params.get('page') ?? '1')),
    view: 'grid' as 'grid' | 'list',
  };

  try {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === 'list' || saved === 'grid') state.view = saved;
  } catch {
    /* nič */
  }

  /* Delenie na mesiace platí len pre nefiltrovaný zoznam od najnovšieho. */
  const grouped = () =>
    state.q.trim() === '' && state.tags.size === 0 && state.month === '' && state.sort === 'newest';

  /* Časová os je vlastný ovládač mesiaca, skryje ju len iný filter. */
  const otherFilters = () =>
    state.q.trim() !== '' || state.tags.size > 0 || state.sort !== 'newest';

  function syncUrl(): void {
    const next = new URLSearchParams();
    if (state.q.trim()) next.set('q', state.q.trim());
    if (state.tags.size > 0) next.set('tag', [...state.tags].join(','));
    if (state.sort !== 'newest') next.set('sort', state.sort);
    if (state.month) next.set('month', state.month);
    if (state.page > 1) next.set('page', String(state.page));
    const query = next.toString();
    /* Stav histórie musí ostať nedotknutý. ClientRouter si v ňom drží index
       a pozíciu scrollu; keby sme ho prepísali na null, návrat späť by zmenil
       adresu, ale stránka by sa už nevymenila. */
    history.replaceState(history.state, '', query ? `?${query}` : location.pathname);
  }

  /* --- Výber --------------------------------------------------------- */

  function matches(item: Item, ignoreTag?: string): boolean {
    const q = fold(state.q.trim());
    if (q && !item.haystack.includes(q)) return false;
    if (state.month && item.month !== state.month) return false;
    for (const tag of state.tags) {
      if (tag === ignoreTag) continue;
      if (!item.tags.includes(tag)) return false;
    }
    return true;
  }

  function sorted(subset: Item[]): Item[] {
    const copy = [...subset];
    switch (state.sort) {
      case 'oldest':
        return copy.sort((a, b) => a.date.localeCompare(b.date));
      case 'alpha':
        return copy.sort((a, b) => a.title.localeCompare(b.title, lang));
      case 'reading':
        return copy.sort((a, b) => a.reading - b.reading || b.date.localeCompare(a.date));
      default:
        return copy.sort((a, b) => b.date.localeCompare(a.date));
    }
  }

  /* --- Popisky ------------------------------------------------------- */

  function plural(n: number, one: string, few: string, many: string): string {
    if (slovak) {
      if (n === 1) return `${n} ${one}`;
      if (n >= 2 && n <= 4) return `${n} ${few}`;
      return `${n} ${many}`;
    }
    return `${n} ${n === 1 ? one : many}`;
  }

  /* „23 VÝSLEDKOV · FILTER: 2 ŠTÍTKY · ZORADENÉ: NAJNOVŠIE“ */
  function describe(n: number): string {
    const parts: string[] = [
      n === 0 ? labels.none : plural(n, labels.one, labels.few, labels.many),
    ];

    const filters: string[] = [];
    if (state.tags.size > 0) {
      filters.push(plural(state.tags.size, labels.tagOne, labels.tagFew, labels.tagMany));
    }
    if (state.q.trim()) filters.push(`${labels.search}: „${state.q.trim()}“`);
    if (state.month) {
      const bar = timelineBars.find((b) => b.dataset.month === state.month);
      const title = bar?.getAttribute('title')?.split(' · ')[0];
      if (title) filters.push(title);
    }
    if (filters.length > 0) parts.push(`${labels.filter}: ${filters.join(', ')}`);

    const sortLabel = document
      .querySelector<HTMLElement>(`[data-sort-value="${state.sort}"]`)
      ?.dataset.sortLabel;
    if (sortLabel) parts.push(`${labels.sorted}: ${sortLabel}`);

    return parts.join(' · ').toUpperCase();
  }

  /* --- Vykreslenie --------------------------------------------------- */

  function render(animate = true): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const before = new Map<HTMLElement, DOMRect>();
    if (animate && !reduced) {
      for (const item of items) {
        if (item.el.hidden) continue;
        before.set(item.el, item.el.getBoundingClientRect());
      }
    }

    const visible = sorted(items.filter((item) => matches(item)));
    const isGrouped = grouped();

    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * PAGE_SIZE;
    const onPage = new Set(visible.slice(start, start + PAGE_SIZE).map((item) => item.id));

    for (const item of items) item.el.hidden = !onPage.has(item.id);

    /* Poradie v DOM: pri filtri podľa zoradenia, inak späť do pôvodného. */
    if (isGrouped) {
      for (const node of originalOrder) list.appendChild(node);
    } else {
      for (const item of visible) list.appendChild(item.el);
    }

    for (const head of monthHeads) {
      const key = head.dataset.monthHead ?? '';
      head.hidden = !isGrouped || !items.some((item) => item.month === key && !item.el.hidden);
    }

    if (timeline) timeline.hidden = otherFilters();

    list.dataset.mode = state.view;
    for (const card of list.querySelectorAll('.card')) {
      card.classList.toggle('card-grid', state.view === 'grid');
      card.classList.toggle('card-list', state.view === 'list');
    }

    if (resultEl) resultEl.textContent = isGrouped ? labels.all : describe(visible.length);
    if (pageLabel) pageLabel.textContent = pages > 1 ? `${labels.page} ${state.page} / ${pages}` : '';
    if (emptyEl) emptyEl.hidden = visible.length > 0;
    if (pager) pager.hidden = pages <= 1;

    renderPager(pages);
    renderTags();

    if (filtersBadge) {
      const count = state.tags.size + (state.q.trim() ? 1 : 0) + (state.month ? 1 : 0);
      filtersBadge.hidden = count === 0;
      filtersBadge.textContent = String(count);
    }

    for (const bar of timelineBars) {
      bar.setAttribute('aria-pressed', String(bar.dataset.month === state.month));
    }

    if (animate && !reduced && before.size > 0) {
      requestAnimationFrame(() => {
        for (const [el, rect] of before) {
          if (el.hidden) continue;
          const next = el.getBoundingClientRect();
          const dx = rect.left - next.left;
          const dy = rect.top - next.top;
          if (dx === 0 && dy === 0) continue;
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            el.classList.add('is-moving');
            el.style.transition = '';
            el.style.transform = '';
            window.setTimeout(() => el.classList.remove('is-moving'), 240);
          });
        }
      });
    }

    syncUrl();
  }

  function renderPager(pages: number): void {
    if (!pagerList) return;
    pagerList.innerHTML = '';
    for (let i = 1; i <= pages; i += 1) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pager-num';
      button.textContent = String(i);
      if (i === state.page) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => goToPage(i));
      li.appendChild(button);
      pagerList.appendChild(li);
    }
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= pages;
  }

  function goToPage(page: number): void {
    state.page = page;
    render();
    list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Počty sa prepočítavajú podľa aktuálneho filtra, nulové sa skryjú,
     vybrané štítky sa presunú na vrch zoznamu. */
  function renderTags(): void {
    const needle = fold(tagSearch?.value.trim() ?? '');

    for (const row of tagRows) {
      const name = row.dataset.tag ?? '';
      const active = state.tags.has(name);
      const count = items.filter((item) => matches(item, name) && item.tags.includes(name)).length;

      const countEl = row.querySelector<HTMLElement>('[data-tag-count]');
      if (countEl) countEl.textContent = String(count);
      row.setAttribute('aria-pressed', String(active));

      const li = row.parentElement;
      if (li) {
        const hiddenBySearch = needle !== '' && !fold(name).includes(needle);
        li.hidden = hiddenBySearch || (count === 0 && !active);
      }
    }

    if (tagList) {
      const rows = [...tagRows].sort((a, b) => {
        const aOn = state.tags.has(a.dataset.tag ?? '') ? 0 : 1;
        const bOn = state.tags.has(b.dataset.tag ?? '') ? 0 : 1;
        if (aOn !== bOn) return aOn - bOn;
        return Number(b.dataset.baseCount) - Number(a.dataset.baseCount);
      });
      for (const row of rows) {
        const li = row.parentElement;
        if (li) tagList.appendChild(li);
      }
    }

    if (tagsClear) tagsClear.hidden = state.tags.size === 0;
    if (tagsClearCount) tagsClearCount.textContent = String(state.tags.size);
  }

  /* --- Ovládanie ------------------------------------------------------ */

  let qTimer: number | undefined;
  qInput?.addEventListener('input', () => {
    window.clearTimeout(qTimer);
    qTimer = window.setTimeout(() => {
      state.q = qInput.value;
      state.page = 1;
      const hasValue = state.q.trim() !== '';
      if (qClear) qClear.hidden = !hasValue;
      if (qCount) {
        qCount.hidden = !hasValue;
        qCount.textContent = String(items.filter((item) => matches(item)).length);
      }
      render();
    }, 140);
  });

  qClear?.addEventListener('click', () => {
    if (qInput) qInput.value = '';
    state.q = '';
    state.page = 1;
    qClear.hidden = true;
    if (qCount) qCount.hidden = true;
    render();
  });

  tagSearch?.addEventListener('input', renderTags);

  for (const row of tagRows) {
    row.addEventListener('click', () => {
      const name = row.dataset.tag ?? '';
      if (state.tags.has(name)) {
        state.tags.delete(name);
      } else {
        state.tags.add(name);
        row.classList.add('is-pulse');
        window.setTimeout(() => row.classList.remove('is-pulse'), 260);
      }
      state.page = 1;
      render();
    });
  }

  function clearAll(): void {
    state.tags.clear();
    state.q = '';
    state.month = '';
    state.sort = 'newest';
    state.page = 1;
    if (qInput) qInput.value = '';
    if (qClear) qClear.hidden = true;
    if (qCount) qCount.hidden = true;
    if (tagSearch) tagSearch.value = '';
    setSort('newest');
    render();
  }

  tagsClear?.addEventListener('click', () => {
    state.tags.clear();
    state.page = 1;
    render();
  });

  document.querySelector<HTMLButtonElement>('[data-clear-all]')?.addEventListener('click', clearAll);

  for (const bar of timelineBars) {
    bar.addEventListener('click', () => {
      const key = bar.dataset.month ?? '';
      state.month = state.month === key ? '' : key;
      state.page = 1;
      render();
    });
  }

  /* Zoradenie */
  function setSort(value: Sort): void {
    state.sort = value;
    const chosen = document.querySelector<HTMLButtonElement>(`[data-sort-value="${value}"]`);
    if (sortCurrent) sortCurrent.textContent = chosen?.dataset.sortLabel ?? '';
    for (const item of document.querySelectorAll('[data-sort-value]')) {
      item.setAttribute('aria-selected', String(item === chosen));
    }
  }

  const closeSort = () => {
    sortPanel?.classList.remove('is-open');
    sortTrigger?.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => {
      if (sortPanel) sortPanel.hidden = true;
    }, 160);
  };

  sortTrigger?.addEventListener('click', () => {
    if (!sortPanel) return;
    if (sortPanel.hidden) {
      sortPanel.hidden = false;
      sortTrigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => sortPanel.classList.add('is-open'));
    } else {
      closeSort();
    }
  });

  document.addEventListener('click', (event) => {
    if (!sortRoot || sortPanel?.hidden) return;
    if (!sortRoot.contains(event.target as Node)) closeSort();
  });

  sortRoot?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !sortPanel?.hidden) {
      closeSort();
      sortTrigger?.focus();
    }
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-sort-value]')) {
    button.addEventListener('click', () => {
      setSort((button.dataset.sortValue as Sort) ?? 'newest');
      state.page = 1;
      closeSort();
      sortTrigger?.focus();
      render();
    });
  }

  /* Prepínač zobrazenia: voľba sa ukladá do localStorage, do URL neide. */
  function setView(value: 'grid' | 'list'): void {
    state.view = value;
    try {
      localStorage.setItem(VIEW_KEY, value);
    } catch {
      /* nič */
    }
    for (const button of viewButtons) {
      const on = button.dataset.view === value;
      button.classList.toggle('is-on', on);
      button.setAttribute('aria-pressed', String(on));
    }
  }

  for (const button of viewButtons) {
    button.addEventListener('click', () => {
      setView((button.dataset.view as 'grid' | 'list') ?? 'grid');
      render(false);
    });
  }

  prevBtn?.addEventListener('click', () => {
    if (state.page > 1) goToPage(state.page - 1);
  });
  nextBtn?.addEventListener('click', () => goToPage(state.page + 1));

  randomBtn?.addEventListener('click', () => {
    const pool = items.filter((item) => item.href);
    if (pool.length === 0) return;
    window.location.href = pool[Math.floor(Math.random() * pool.length)].href;
  });

  document.querySelector<HTMLButtonElement>('[data-filters-open]')?.addEventListener('click', () => {
    filterShell?.classList.add('is-open');
  });
  document
    .querySelector<HTMLButtonElement>('[data-filters-close]')
    ?.addEventListener('click', () => filterShell?.classList.remove('is-open'));

  /* --- Prvé vykreslenie zo stavu v URL -------------------------------- */

  if (qInput && state.q) {
    qInput.value = state.q;
    if (qClear) qClear.hidden = false;
  }
  setSort(state.sort);
  setView(state.view);
  render(false);
}

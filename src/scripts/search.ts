/**
 * Vyhľadávanie naprieč webom (sekcia 07, druhá vlna).
 * Otvára ho lupa v hlavičke, výsledky sú rozdelené na články a štítky.
 */

interface IndexArticle {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  href: string;
  draft: boolean;
}

interface IndexTag {
  name: string;
  count: number;
  href: string;
}

interface LangIndex {
  articles: IndexArticle[];
  tags: IndexTag[];
}

let indexPromise: Promise<Record<string, LangIndex>> | null = null;

function loadIndex(): Promise<Record<string, LangIndex>> {
  if (!indexPromise) {
    indexPromise = fetch('/search-index.json')
      .then((r) => r.json())
      .catch(() => ({}) as Record<string, LangIndex>);
  }
  return indexPromise;
}

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

export function initSearch(): void {
  const root = document.querySelector<HTMLElement>('[data-search]');
  if (!root) return;

  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const results = root.querySelector<HTMLElement>('[data-search-results]');
  const scrim = root.querySelector<HTMLElement>('[data-search-scrim]');
  if (!input || !results) return;

  const labels = (window as unknown as { __momentumSearchLabels?: Record<string, string> })
    .__momentumSearchLabels ?? {
    articles: 'Články',
    tags: 'Štítky',
    empty: 'Nič sa nenašlo.',
    kindArticle: 'Článok',
    kindTag: 'Štítok',
    draft: 'Rozpísané',
  };

  const lang = root.dataset.lang ?? 'sk';
  const hintHtml = results.innerHTML;
  let active = 0;
  let items: HTMLAnchorElement[] = [];
  let lastFocused: HTMLElement | null = null;

  const open = () => {
    if (!root.hidden) return;
    lastFocused = document.activeElement as HTMLElement;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
    input.value = '';
    render('');
    input.focus();
    void loadIndex();
  };

  const close = () => {
    if (root.hidden) return;
    root.classList.remove('is-open');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      root.hidden = true;
    }, reduced ? 0 : 160);
    lastFocused?.focus();
  };

  const setActive = (next: number) => {
    if (items.length === 0) return;
    active = (next + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle('is-active', i === active));
    items[active]?.scrollIntoView({ block: 'nearest' });
  };

  async function render(query: string): Promise<void> {
    const q = fold(query.trim());
    if (!q) {
      results.innerHTML = hintHtml;
      items = [];
      return;
    }

    const index = await loadIndex();
    const data = index[lang];
    if (!data) return;

    const articles = data.articles
      .filter((a) => fold(`${a.title} ${a.desc} ${a.tags.join(' ')}`).includes(q))
      .slice(0, 6);
    const tags = data.tags.filter((tagItem) => fold(tagItem.name).includes(q)).slice(0, 5);

    if (articles.length === 0 && tags.length === 0) {
      results.innerHTML = `<p class="search-empty mono-sm">${escapeHtml(labels.empty)}</p>`;
      items = [];
      return;
    }

    const parts: string[] = [];
    if (articles.length > 0) {
      parts.push(`<p class="search-group">${escapeHtml(labels.articles)}</p>`);
      parts.push(
        articles
          .map(
            (a) =>
              `<a class="search-item" href="${escapeHtml(a.href)}"><span class="s-title">${escapeHtml(
                a.title,
              )}</span><span class="s-kind">${escapeHtml(
                a.draft ? labels.draft : labels.kindArticle,
              )}</span></a>`,
          )
          .join(''),
      );
    }
    if (tags.length > 0) {
      parts.push(`<p class="search-group">${escapeHtml(labels.tags)}</p>`);
      parts.push(
        tags
          .map(
            (tagItem) =>
              `<a class="search-item" href="${escapeHtml(tagItem.href)}"><span class="s-title">${escapeHtml(
                tagItem.name,
              )}</span><span class="s-kind">${escapeHtml(labels.kindTag)} · ${tagItem.count}</span></a>`,
          )
          .join(''),
      );
    }

    results.innerHTML = parts.join('');
    items = [...results.querySelectorAll<HTMLAnchorElement>('.search-item')];
    active = -1;
    setActive(0);
  }

  if (root.dataset.bound !== '1') {
    root.dataset.bound = '1';

    let timer: number | undefined;
    input.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void render(input.value), 120);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive(active + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(active - 1);
      } else if (event.key === 'Enter') {
        const target = items[active];
        if (target) {
          event.preventDefault();
          window.location.href = target.href;
        }
      }
    });

    scrim?.addEventListener('click', close);

    /* Esc nie je skratka, ale povinný spôsob, ako sa z dialógu dostať von. */
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !root.hidden) {
        event.preventDefault();
        close();
      }
    });
  }

  document.querySelectorAll<HTMLElement>('[data-search-open]').forEach((button) => {
    if (button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.addEventListener('click', open);
  });
}

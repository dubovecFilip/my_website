import { initParallax } from './reveal';

/** Priebeh čítania: 2 px prúžok viazaný priamo na scroll, bez tranzície. */
function initProgress(): void {
  const article = document.querySelector<HTMLElement>('[data-article]');
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const track = document.querySelector<HTMLElement>('[data-progress-track]');
  if (!article || !bar) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
    bar.style.transform = `scaleX(${done})`;
    track?.setAttribute('aria-valuenow', String(Math.round(done * 100)));
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/** Aktívna kapitola v obsahu: viazaná na scroll, bez preblikávania. */
function initToc(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')];
  if (links.length === 0) return;

  const targets = links
    .map((link) => ({ link, el: document.getElementById(link.dataset.tocLink ?? '') }))
    .filter((x): x is { link: HTMLAnchorElement; el: HTMLElement } => Boolean(x.el));

  if (targets.length === 0) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.3;
    let active = targets[0];
    for (const target of targets) {
      if (target.el.getBoundingClientRect().top <= line) active = target;
    }
    for (const target of targets) {
      target.link.classList.toggle('is-active', target === active);
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

/** Zdieľanie: systémové, inak kopírovanie odkazu s potvrdením. */
function initShare(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-share]').forEach((button) => {
    if (button.dataset.bound === '1') return;
    button.dataset.bound = '1';

    button.addEventListener('click', async () => {
      const url = location.href;
      const title = document.title;
      try {
        if (navigator.share) {
          await navigator.share({ title, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        toast(button.dataset.shareDone ?? 'OK');
      } catch {
        /* Zrušené používateľom, nič sa nedeje. */
      }
    });
  });
}

function toast(message: string): void {
  const existing = document.querySelector('.toast');
  existing?.remove();

  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;
  document.body.appendChild(el);

  requestAnimationFrame(() => el.classList.add('is-in'));
  window.setTimeout(() => {
    el.classList.remove('is-in');
    window.setTimeout(() => el.remove(), 200);
  }, 2500);
}

/** Obrázok sa odhalí z rozmazania, len čo sa načíta. */
function initImageReveal(): void {
  document.querySelectorAll<HTMLImageElement>('.article-body img').forEach((img) => {
    if (img.dataset.bound === '1') return;
    img.dataset.bound = '1';
    if (img.complete) {
      img.classList.add('is-loaded');
      return;
    }
    img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    img.addEventListener('error', () => img.classList.add('is-loaded'), { once: true });
  });
}

/* Na tablete a mobile je obsah zbalený pruh nad textom, otvára sa klepnutím. */
function initTocCollapse(): void {
  const details = document.querySelector<HTMLDetailsElement>('[data-toc-details]');
  if (!details) return;
  const narrow = window.matchMedia('(max-width: 1179px)');

  /* Vlastné zbalenie sa nesmie tváriť ako klik používateľa, inak by sa obsah
     po návrate na širokú obrazovku už nikdy neroztvoril. */
  let programmatic = false;
  const apply = () => {
    if (details.dataset.touched === '1') return;
    programmatic = true;
    details.open = !narrow.matches;
    window.setTimeout(() => {
      programmatic = false;
    }, 0);
  };

  if (details.dataset.bound !== '1') {
    details.dataset.bound = '1';
    details.addEventListener('toggle', () => {
      if (!programmatic && narrow.matches) details.dataset.touched = '1';
    });
    narrow.addEventListener('change', apply);
  }
  apply();
}

export function initArticle(): void {
  initProgress();
  initTocCollapse();
  initToc();
  initShare();
  initImageReveal();
  initParallax();
}

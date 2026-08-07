/**
 * Hlavička zhustne po 80 px scrollu, otvára mobilné menu a drží premennú
 * --header-now, o ktorú sa opierajú sticky bočné stĺpce článku a archívu.
 *
 * Zhustnutie mení výšku hlavičky, a tým aj výšku dokumentu. Bez poistky by sa
 * na krátkych stránkach zacyklilo: hlavička sa zmenší, stránka sa skráti,
 * prehliadač posunie scroll pod prah, hlavička sa zväčší a začne to odznova.
 * Preto sú dva prahy (zhustí sa nad 80 px, roztiahne až pod 40 px) a na
 * stránke, ktorá nemá čo scrollovať, sa nezhusťuje vôbec.
 */
const CONDENSE_AT = 80;
const EXPAND_AT = 40;
const MIN_SCROLLABLE = 240;

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  let condensed = header.classList.contains('is-condensed');
  let ticking = false;

  const apply = (next: boolean) => {
    if (next === condensed) return;
    condensed = next;
    header.classList.toggle('is-condensed', next);
    document.documentElement.style.setProperty(
      '--header-now',
      next ? 'var(--header-h-condensed)' : 'var(--header-h)',
    );
  };

  /* Na homepage sa značka objaví, až keď obrie MOMENTUM_ odíde z obrazu. */
  const brandAfterHero = header.hasAttribute('data-brand-after-hero');
  const showBrand = () => {
    if (!brandAfterHero) {
      header.classList.add('is-brand-shown');
      return;
    }
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const line = hero ? hero.getBoundingClientRect().bottom : 0;
    header.classList.toggle('is-brand-shown', line <= header.getBoundingClientRect().height);
  };

  const sync = () => {
    ticking = false;
    showBrand();

    const room = document.documentElement.scrollHeight - window.innerHeight;
    if (room < MIN_SCROLLABLE) {
      apply(false);
      return;
    }
    const y = window.scrollY;
    if (!condensed && y > CONDENSE_AT) apply(true);
    else if (condensed && y < EXPAND_AT) apply(false);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sync);
  };

  if (header.dataset.bound !== '1') {
    header.dataset.bound = '1';

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    const toggle = header.querySelector<HTMLButtonElement>('[data-nav-toggle]');
    toggle?.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        header.classList.remove('is-open');
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.focus();
      }
    });
  }

  header.classList.remove('is-open');
  header.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded', 'false');
  sync();
}

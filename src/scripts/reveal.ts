/**
 * Príchod sekcie (sekcia 08): každý blok nabehne o 12 px zdola s fade,
 * oneskorenie 40 ms medzi súrodencami, spúšťa sa pri 15 % viditeľnosti
 * a beží raz. Pri obmedzenom pohybe sa nespúšťa vôbec.
 */
export function initReveal(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)');

  if (reduced || !('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('is-in');
        observer.unobserve(el);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -5% 0px' },
  );

  /* Poistka: obsah nesmie ostať neviditeľný, ak sa pozorovateľ nespustí. */
  window.setTimeout(() => {
    nodes.forEach((node) => {
      if (node.isConnected && !node.classList.contains('is-in')) {
        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.5) node.classList.add('is-in');
      }
    });
  }, 1200);

  nodes.forEach((node) => {
    /* Odstup medzi súrodencami sa počíta z poradia v rodičovi. */
    if (!node.style.getPropertyValue('--reveal-delay')) {
      const siblings = node.parentElement
        ? [...node.parentElement.children].filter((c) => c.classList.contains('reveal'))
        : [];
      const index = siblings.indexOf(node);
      if (index > 0) node.style.setProperty('--reveal-delay', `${Math.min(index, 8) * 40}ms`);
    }
    observer.observe(node);
  });
}

/** Jemný parallax obrázka, max 4 %, viazaný priamo na scroll. */
export function initParallax(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const targets = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  if (targets.length === 0) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) continue;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      el.style.setProperty('--parallax', `${(-progress * 4).toFixed(2)}%`);
    }
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

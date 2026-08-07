/**
 * Jazykový dropdown (sekcia 07).
 * Otvára klik alebo Enter/Space, zatvára Esc, klik mimo a výber položky.
 * Esc vždy vracia fokus na spúšťač.
 */
export function initLangSwitch(): void {
  document.querySelectorAll<HTMLElement>('[data-lang-switch]').forEach((root) => {
    if (root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    const trigger = root.querySelector<HTMLButtonElement>('[data-lang-trigger]');
    const panel = root.querySelector<HTMLElement>('[data-lang-panel]');
    if (!trigger || !panel) return;

    let closeTimer: number | undefined;

    const open = () => {
      window.clearTimeout(closeTimer);
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => panel.classList.add('is-open'));
    };

    const close = (focusTrigger = false) => {
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      closeTimer = window.setTimeout(() => {
        panel.hidden = true;
      }, reduced ? 0 : 200);
      if (focusTrigger) trigger.focus();
    };

    const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

    trigger.addEventListener('click', () => (isOpen() ? close() : open()));

    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        event.stopPropagation();
        close(true);
      }
    });

    document.addEventListener('click', (event) => {
      if (!isOpen()) return;
      if (!root.contains(event.target as Node)) close();
    });
  });
}

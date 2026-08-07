/**
 * Priveľa štítkov (sekcia 09 A): vykresľuj v poradí podľa globálnej četnosti,
 * zastav sa, keď sa minie šírka riadku, a doplň +N. Klik rozbalí zvyšok
 * a karta narastie o jeden riadok.
 */
export function initTagOverflow(): void {
  const groups = document.querySelectorAll<HTMLElement>('[data-tagrow]');

  const layout = (group: HTMLElement) => {
    if (group.dataset.expanded === '1') return;

    const tags = [...group.querySelectorAll<HTMLElement>('.tag')];
    const more = group.querySelector<HTMLButtonElement>('[data-tags-more]');
    more?.remove();

    tags.forEach((tag) => (tag.hidden = false));

    const width = group.clientWidth;
    if (width === 0 || tags.length === 0) return;

    const gap = parseFloat(getComputedStyle(group).columnGap || '6') || 6;
    /* Miesto pre prípadné +N necháme vždy, aby sa riadok nezalomil. */
    const reserve = 44;

    let used = 0;
    let visible = 0;
    for (const tag of tags) {
      const next = used + (visible > 0 ? gap : 0) + tag.offsetWidth;
      const limit = visible === tags.length - 1 ? width : width - reserve;
      if (next > limit && visible > 0) break;
      used = next;
      visible += 1;
    }

    if (visible >= tags.length) return;

    tags.slice(visible).forEach((tag) => (tag.hidden = true));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tag tag-more';
    button.dataset.tagsMore = '1';
    /* Plochu na dotyk rozširuje pseudoprvok, samotný štítok ostáva drobný. */
    button.dataset.hit = 'expanded';
    button.textContent = `+${tags.length - visible}`;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      group.dataset.expanded = '1';
      tags.forEach((tag) => (tag.hidden = false));
      button.remove();
    });
    group.appendChild(button);
  };

  groups.forEach(layout);

  if (!('ResizeObserver' in window)) return;
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) layout(entry.target as HTMLElement);
  });
  groups.forEach((group) => observer.observe(group));
}

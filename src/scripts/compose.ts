/**
 * Compose: logika editora článkov (sekcia 06 + 10).
 *
 * Priečinok projektu sa vyberá cez File System Access API a jeho handle sa
 * pamätá v IndexedDB, takže po obnovení stránky stačí jedno potvrdenie.
 * Ukladá sa priamo do src/content/articles/<jazyk>/<id>.md. Jedno uloženie
 * je jeden commit v repozitári webu.
 */
import { PREVIEW_KEY } from './preview';
import { firstImage, readingMinutes } from './markdown';


type Lang = 'sk' | 'en';

interface Draft {
  title: string;
  description: string;
  tags: string;
  body: string;
  authorNote: string;
}

interface Doc {
  id: string;
  date: string;
  draft: boolean;
  pinned: boolean;
  follows: string;
  author: string;
  langs: Record<Lang, Draft>;
}

interface Listed {
  id: string;
  title: string;
  date: string;
  langs: Lang[];
  draft: boolean;
  pinned: boolean;
}

const LANGS: Lang[] = ['sk', 'en'];
const LIMITS = { title: 60, description: 64, slug: 80 };

/* -------------------------------------------------------------------------
   Pomocné
   ------------------------------------------------------------------------- */

function emptyDraft(): Draft {
  return { title: '', description: '', tags: '', body: '', authorNote: '' };
}

function emptyDoc(): Doc {
  return {
    id: '',
    date: new Date().toISOString().slice(0, 10),
    draft: false,
    pinned: false,
    follows: '',
    author: 'boggelino',
    langs: { sk: emptyDraft(), en: emptyDraft() },
  };
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}. ${m}. ${y}` : iso;
}

/* Frontmatter --------------------------------------------------------- */

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildFile(doc: Doc, lang: Lang): string {
  const draft = doc.langs[lang];
  const tags = draft.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const lines = [
    '---',
    `title: ${yamlString(draft.title)}`,
    `description: ${yamlString(draft.description)}`,
    `date: ${doc.date}`,
    `tags: [${tags.map(yamlString).join(', ')}]`,
  ];
  if (doc.draft) lines.push('draft: true');
  if (doc.pinned) lines.push('pinned: true');
  if (doc.follows.trim()) lines.push(`follows: ${yamlString(doc.follows.trim())}`);
  if (draft.authorNote.trim()) lines.push(`authorNote: ${yamlString(draft.authorNote.trim())}`);
  lines.push(`author: ${yamlString(doc.author || 'boggelino')}`);
  lines.push('---', '', draft.body.trim(), '');

  return lines.join('\n');
}

function parseFile(text: string): { data: Record<string, string | boolean | string[]>; body: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: text };

  const data: Record<string, string | boolean | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let raw = kv[2].trim();

    if (raw === 'true' || raw === 'false') {
      data[key] = raw === 'true';
      continue;
    }
    if (raw.startsWith('[')) {
      data[key] = raw
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
      continue;
    }
    raw = raw.replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
    data[key] = raw;
  }

  return { data, body: match[2] };
}

/* IndexedDB: pamäť na handle priečinka ------------------------------- */

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('momentum-compose', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('handles');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function rememberHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await idb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(handle, 'project');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* Bez pamäte to funguje tiež, len sa priečinok vyberá zakaždým. */
  }
}

async function recallHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await idb();
    return await new Promise((resolve) => {
      const tx = db.transaction('handles', 'readonly');
      const request = tx.objectStore('handles').get('project');
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------
   Editor
   ------------------------------------------------------------------------- */

export function initCompose(): void {
  const root = document.querySelector<HTMLElement>('[data-compose]');
  if (!root || root.dataset.bound === '1') return;
  root.dataset.bound = '1';

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const $$ = <T extends HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];

  const gate = $('[data-gate]')!;
  const shell = $('[data-shell]')!;
  const toast = $('[data-toast]')!;
  const listEl = $('[data-list]')!;
  const listCount = $('[data-list-count]')!;
  const folderLabel = $('[data-folder-label]')!;
  const folderPill = $<HTMLButtonElement>('[data-folder-pick].cmp-pill')!;
  const errorsEl = $('[data-errors]')!;
  const imagesEl = $('[data-images]')!;
  const imageInput = $<HTMLInputElement>('[data-image-input]')!;

  const fields = {
    title: $<HTMLInputElement>('[data-f="title"]')!,
    description: $<HTMLTextAreaElement>('[data-f="description"]')!,
    tags: $<HTMLInputElement>('[data-f="tags"]')!,
    body: $<HTMLTextAreaElement>('[data-f="body"]')!,
    authorNote: $<HTMLTextAreaElement>('[data-f="authorNote"]')!,
    follows: $<HTMLInputElement>('[data-f="follows"]')!,
  };

  const authorSelect = $<HTMLSelectElement>('[data-f-author]');

  const supported = 'showDirectoryPicker' in window;
  if (!supported) $('[data-gate-note]')!.hidden = false;

  let dir: FileSystemDirectoryHandle | null = null;
  let doc = emptyDoc();
  let lang: Lang = 'sk';
  let listed: Listed[] = [];
  let imageNames: string[] = [];
  /* Nový článok je prázdny zámerne, chybu o názve hlásime až keď má čo uložiť. */
  let attemptedSave = false;
  const problems: { level: 'warn' | 'stop'; text: string }[] = [];

  /* --- Oznamy -------------------------------------------------------- */

  let toastTimer: number | undefined;
  function say(message: string, kind: 'ok' | 'error' = 'ok'): void {
    toast.textContent = message;
    toast.dataset.kind = kind;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2500);
  }

  /* --- Prístup k priečinku -------------------------------------------- */

  async function ensureDir(parts: string[], create = false): Promise<FileSystemDirectoryHandle> {
    if (!dir) throw new Error('Priečinok projektu nie je vybraný.');
    let current = dir;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create });
    }
    return current;
  }

  async function pickFolder(): Promise<void> {
    if (!supported) return;
    try {
      dir = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> })
        .showDirectoryPicker();
      await rememberHandle(dir);
      await afterFolder();
    } catch {
      /* Zrušené používateľom. */
    }
  }

  async function afterFolder(): Promise<void> {
    if (!dir) return;
    folderLabel.textContent = `Project folder · ${dir.name}`;
    delete folderPill.dataset.off;
    gate.hidden = true;
    shell.hidden = false;
    await scan();
    if (!doc.id) newArticle();
  }

  /* --- Zoznam článkov -------------------------------------------------- */

  async function scan(): Promise<void> {
    if (!dir) return;
    const map = new Map<string, Listed>();

    for (const code of LANGS) {
      let folder: FileSystemDirectoryHandle;
      try {
        folder = await ensureDir(['src', 'content', 'articles', code]);
      } catch {
        continue;
      }

      for await (const [name, handle] of (
        folder as unknown as {
          entries: () => AsyncIterable<[string, FileSystemHandle]>;
        }
      ).entries()) {
        if (!name.endsWith('.md') || handle.kind !== 'file') continue;
        const id = name.replace(/\.md$/, '');
        const text = await (await (handle as FileSystemFileHandle).getFile()).text();
        const { data } = parseFile(text);

        const entry = map.get(id) ?? {
          id,
          title: String(data.title ?? id),
          date: String(data.date ?? ''),
          langs: [],
          draft: Boolean(data.draft),
          pinned: Boolean(data.pinned),
        };
        entry.langs.push(code);
        if (code === 'sk') entry.title = String(data.title ?? entry.title);
        entry.draft = entry.draft || Boolean(data.draft);
        entry.pinned = entry.pinned || Boolean(data.pinned);
        map.set(id, entry);
      }
    }

    listed = [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
    renderList();
  }

  function renderList(): void {
    const drafts = listed.filter((a) => a.draft).length;
    listCount.textContent = `${listed.length} / ${drafts} draft`;

    listEl.innerHTML = '';
    for (const item of listed) {
      const card = document.createElement('div');
      card.className = `cmp-item${item.id === doc.id ? ' is-active' : ''}`;
      card.innerHTML = `
        <div class="cmp-item-head">
          <p class="cmp-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</p>
          <span class="cmp-flags">
            <span class="cmp-flag ${item.draft ? 'is-draft' : 'is-published'}">${
              item.draft ? 'Draft' : 'Published'
            }</span>
            ${item.pinned ? '<span class="cmp-flag is-pinned">Pinned</span>' : ''}
          </span>
        </div>
        <p class="cmp-item-meta">ID ${escapeHtml(item.id)} · ${escapeHtml(
          formatDate(item.date),
        )} · ${item.langs.map((l) => l.toUpperCase()).join(', ')}</p>
        <div class="cmp-item-actions">
          <button type="button" class="cmp-act" data-act="edit">Edit</button>
          <button type="button" class="cmp-act" data-act="draft">${
            item.draft ? 'Publish' : 'Hide'
          }</button>
          <button type="button" class="cmp-act" data-act="pin">${
            item.pinned ? 'Unpin' : 'Pin'
          }</button>
          <button type="button" class="cmp-act is-danger" data-act="delete">Delete</button>
        </div>`;

      card.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((button) => {
        button.addEventListener('click', () => void action(button.dataset.act ?? '', item.id));
      });
      listEl.appendChild(card);
    }
  }

  async function action(kind: string, id: string): Promise<void> {
    if (kind === 'edit') return void load(id);
    if (kind === 'delete') {
      if (!window.confirm(`Zmazať článok ${id}? Súbory sa presunú do koša projektu.`)) return;
      await removeArticle(id);
      return;
    }
    await load(id);
    if (kind === 'draft') doc.draft = !doc.draft;
    if (kind === 'pin') doc.pinned = !doc.pinned;
    syncToggles();
    await save(true);
  }

  /* --- Načítanie a zápis ---------------------------------------------- */

  async function load(id: string): Promise<void> {
    if (!dir) return;
    const next = emptyDoc();
    next.id = id;

    for (const code of LANGS) {
      try {
        const folder = await ensureDir(['src', 'content', 'articles', code]);
        const file = await (await folder.getFileHandle(`${id}.md`)).getFile();
        const { data, body } = parseFile(await file.text());

        next.langs[code] = {
          title: String(data.title ?? ''),
          description: String(data.description ?? ''),
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags ?? ''),
          body: body.trim(),
          authorNote: String(data.authorNote ?? ''),
        };
        next.date = String(data.date ?? next.date).slice(0, 10);
        next.draft = Boolean(data.draft);
        next.pinned = Boolean(data.pinned);
        next.follows = String(data.follows ?? '');
        next.author = String(data.author ?? 'boggelino');
      } catch {
        /* Mutácia zatiaľ neexistuje, ostane prázdna. */
      }
    }

    doc = next;
    await loadImages();
    fill();
    renderList();
  }

  async function loadImages(): Promise<void> {
    imageNames = [];
    if (!dir || !doc.id) return renderImages();
    try {
      const folder = await ensureDir(['public', 'images', 'articles', doc.id]);
      for await (const [name, handle] of (
        folder as unknown as { entries: () => AsyncIterable<[string, FileSystemHandle]> }
      ).entries()) {
        if (handle.kind === 'file') imageNames.push(name);
      }
    } catch {
      /* Priečinok obrázkov ešte nemusí existovať. */
    }
    renderImages();
  }

  function renderImages(): void {
    imagesEl.querySelectorAll('.cmp-image').forEach((node) => node.remove());
    const add = imagesEl.querySelector('.cmp-image-add');

    for (const name of imageNames) {
      const path = `/images/articles/${doc.id}/${name}`;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cmp-image';
      cell.title = name;
      cell.innerHTML = `<img src="${escapeHtml(path)}" alt="" loading="lazy" />
        <span class="cmp-image-insert">Vložiť</span>`;
      cell.addEventListener('click', () => {
        insert(`\n![${name.replace(/\.[^.]+$/, '')}](${path})\n`);
      });
      imagesEl.insertBefore(cell, add);
    }
  }

  async function removeArticle(id: string): Promise<void> {
    if (!dir) return;
    try {
      for (const code of LANGS) {
        const folder = await ensureDir(['src', 'content', 'articles', code]);
        const trash = await ensureDir(['_to_delete'], true);
        try {
          const file = await (await folder.getFileHandle(`${id}.md`)).getFile();
          const out = await trash.getFileHandle(`${code}-${id}.md`, { create: true });
          const writable = await out.createWritable();
          await writable.write(await file.text());
          await writable.close();
          await folder.removeEntry(`${id}.md`);
        } catch {
          /* Mutácia neexistuje. */
        }
      }
      say('Zmazané · záloha v _to_delete');
      if (doc.id === id) newArticle();
      await scan();
    } catch (error) {
      say(`Nedá sa zapisovať: ${(error as Error).message}`, 'error');
    }
  }

  async function writeFile(parts: string[], name: string, contents: string): Promise<void> {
    const folder = await ensureDir(parts, true);
    const handle = await folder.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(contents);
    await writable.close();
  }

  /** Pripnutý môže byť vždy len jeden, ostatné sa odopnú. */
  async function unpinOthers(): Promise<void> {
    if (!dir || !doc.pinned) return;
    for (const code of LANGS) {
      let folder: FileSystemDirectoryHandle;
      try {
        folder = await ensureDir(['src', 'content', 'articles', code]);
      } catch {
        continue;
      }
      for await (const [name, handle] of (
        folder as unknown as { entries: () => AsyncIterable<[string, FileSystemHandle]> }
      ).entries()) {
        if (!name.endsWith('.md') || handle.kind !== 'file') continue;
        const id = name.replace(/\.md$/, '');
        if (id === doc.id) continue;
        const text = await (await (handle as FileSystemFileHandle).getFile()).text();
        if (!/^pinned:\s*true\s*$/m.test(text)) continue;
        const writable = await (handle as FileSystemFileHandle).createWritable();
        await writable.write(text.replace(/^pinned:\s*true\s*$\n?/m, ''));
        await writable.close();
      }
    }
  }

  async function save(quiet = false): Promise<void> {
    collect();
    attemptedSave = true;
    validate();
    if (problems.some((p) => p.level === 'stop')) {
      say('Uloženie blokované, oprav chyby', 'error');
      return;
    }
    if (!dir) return;
    if (!doc.id) doc.id = await freshId();

    try {
      await unpinOthers();
      let written = 0;
      for (const code of LANGS) {
        const draft = doc.langs[code];
        if (!draft.title.trim() && !draft.body.trim()) continue;
        await writeFile(['src', 'content', 'articles', code], `${doc.id}.md`, buildFile(doc, code));
        written += 1;
      }
      if (!quiet) say(`✓ Uložené · ${written} ${written === 1 ? 'súbor' : 'súbory'}`);
      await scan();
      fill();
    } catch (error) {
      say(`Do priečinku sa nedá zapisovať: ${(error as Error).message}`, 'error');
    }
  }

  async function freshId(): Promise<string> {
    const taken = new Set(listed.map((a) => a.id));
    for (let i = 0; i < 200; i += 1) {
      const id = String(Math.floor(100000 + Math.random() * 900000));
      if (!taken.has(id)) return id;
    }
    return String(Date.now()).slice(-6);
  }

  function download(): void {
    collect();
    for (const code of LANGS) {
      const draft = doc.langs[code];
      if (!draft.title.trim() && !draft.body.trim()) continue;
      const blob = new Blob([buildFile(doc, code)], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.id || 'novy'}-${code}.md`;
      link.click();
      URL.revokeObjectURL(url);
    }
    say('Stiahnuté');
  }

  /* --- Formulár -------------------------------------------------------- */

  function collect(): void {
    const draft = doc.langs[lang];
    draft.title = fields.title.value;
    draft.description = fields.description.value;
    draft.tags = fields.tags.value;
    draft.body = fields.body.value;
    draft.authorNote = fields.authorNote.value;
    doc.follows = fields.follows.value;
    if (authorSelect) doc.author = authorSelect.value;
  }

  function fill(): void {
    const draft = doc.langs[lang];
    fields.title.value = draft.title;
    fields.description.value = draft.description;
    fields.tags.value = draft.tags;
    fields.body.value = draft.body;
    fields.authorNote.value = draft.authorNote;
    fields.follows.value = doc.follows;

    if (authorSelect) {
      const known = [...authorSelect.options].some((o) => o.value === doc.author);
      authorSelect.value = known ? doc.author : (authorSelect.options[0]?.value ?? 'boggelino');
      doc.author = authorSelect.value;
    }

    $('[data-meta-id]')!.textContent = doc.id || 'nový';
    $('[data-meta-date]')!.textContent = formatDate(doc.date);
    syncToggles();
    update();
  }

  function syncToggles(): void {
    $('[data-toggle-draft]')!.setAttribute('aria-pressed', String(doc.draft));
    $('[data-toggle-pin]')!.setAttribute('aria-pressed', String(doc.pinned));
    for (const button of $$<HTMLButtonElement>('[data-lang-tab]')) {
      const on = button.dataset.langTab === lang;
      button.classList.toggle('is-on', on);
      button.setAttribute('aria-pressed', String(on));
    }
  }

  function newArticle(): void {
    doc = emptyDoc();
    attemptedSave = false;
    lang = 'sk';
    imageNames = [];
    renderImages();
    fill();
    renderList();
    fields.title.focus();
  }

  function insert(text: string): void {
    const area = fields.body;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.selectionStart = area.selectionEnd = start + text.length;
    area.focus();
    update();
  }

  function wrap(before: string, after = before): void {
    const area = fields.body;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = area.value.slice(start, end);
    area.value = area.value.slice(0, start) + before + selected + after + area.value.slice(end);
    area.selectionStart = start + before.length;
    area.selectionEnd = start + before.length + selected.length;
    area.focus();
    update();
  }

  /* --- Kontrola dĺžok a chybové stavy ---------------------------------- */

  function level(length: number, limit: number): 'ok' | 'warn' | 'over' {
    if (length > limit + 16) return 'over';
    if (length > limit) return 'warn';
    return 'ok';
  }

  function validate(): void {
    problems.length = 0;
    const draft = doc.langs[lang];

    const slug = slugify(draft.title);
    if (slug.length > LIMITS.slug) {
      problems.push({
        level: 'stop',
        text: `Slug má ${slug.length} znakov, prekračuje bezpečný limit ${LIMITS.slug}.`,
      });
    }
    const hasContent = Boolean(
      draft.body.trim() || draft.description.trim() || draft.tags.trim() || draft.authorNote.trim(),
    );
    if (!draft.title.trim() && (attemptedSave || hasContent)) {
      problems.push({ level: 'stop', text: 'Článok bez názvu sa nedá uložiť.' });
    }
    if (doc.draft && doc.pinned) {
      problems.push({ level: 'stop', text: 'Rozpísaný článok sa nepripína.' });
    }
    if (doc.follows.trim() && !listed.some((a) => a.id === doc.follows.trim())) {
      problems.push({ level: 'stop', text: `Neznáme ID v poli „nadväzuje na“: ${doc.follows}.` });
    }
    if (doc.follows.trim() && doc.follows.trim() === doc.id) {
      problems.push({ level: 'stop', text: 'Článok nemôže nadväzovať sám na seba.' });
    }

    /* Chýbajúci obrázok je len varovanie (sekcia 14). */
    for (const match of draft.body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
      const path = match[1];
      if (!path.startsWith('/images/articles/')) continue;
      const name = path.split('/').pop() ?? '';
      const belongsHere = path.includes(`/${doc.id}/`);
      if (belongsHere && doc.id && !imageNames.includes(name)) {
        problems.push({ level: 'warn', text: `Obrázok <code>${escapeHtml(name)}</code> na disku chýba` });
      }
    }

    errorsEl.innerHTML = problems.length
      ? problems
          .map(
            (p) =>
              `<p class="cmp-err ${p.level === 'stop' ? 'is-stop' : 'is-warn'}">
                 <span class="cmp-err-mark">${p.level === 'stop' ? '✕' : '⚠'}</span>
                 <span>${p.text}</span>
               </p>`,
          )
          .join('')
      : '<p class="cmp-ok">Zatiaľ nič, všetko sedí.</p>';
  }

  /* --- Náhľady --------------------------------------------------------- */

  /**
   * Náhľad neotvárame v Compose, ale ako skutočnú stránku webu. Obsah sa
   * odovzdá cez localStorage a náhľadová obrazovka si ho podstrčí do svojho
   * rozloženia, takže je plne interaktívna vrátane zmeny šírky okna.
   */
  function openPreview(mode: string): void {
    collect();
    const draft = doc.langs[lang];
    try {
      localStorage.setItem(
        PREVIEW_KEY,
        JSON.stringify({
          title: draft.title || 'Názov článku',
          description: draft.description,
          tags: draft.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          body: draft.body,
          authorNote: draft.authorNote,
          date: doc.date,
          draft: doc.draft,
          pinned: doc.pinned,
          lang,
        }),
      );
    } catch {
      say('Náhľad sa nedá pripraviť, úložisko prehliadača je nedostupné.', 'error');
      return;
    }
    window.open(`/compose/preview/${mode}/`, `momentum-preview-${mode}`);
  }

  function update(): void {
    collect();
    validate();

    const draft = doc.langs[lang];

    /* Dĺžky */
    const titleLen = draft.title.length;
    const descLen = draft.description.length;
    const slug = slugify(draft.title);

    const lenTitle = $('[data-len-title]')!;
    lenTitle.textContent = `${titleLen} / ${LIMITS.title}`;
    lenTitle.dataset.level = level(titleLen, LIMITS.title);

    const lenDesc = $('[data-len-desc]')!;
    lenDesc.textContent = `${descLen} / ${LIMITS.description}`;
    lenDesc.dataset.level = level(descLen, LIMITS.description);

    const hintTitle = $('[data-hint-title]')!;
    const tl = level(titleLen, LIMITS.title);
    hintTitle.dataset.level = tl;
    hintTitle.textContent =
      tl === 'ok'
        ? titleLen > 0
          ? '✓ Sedí vo všetkých rozloženiach'
          : ''
        : tl === 'warn'
          ? '⚠ Na mobile sa oreže'
          : '✕ Príliš dlhé pre karty';

    const hintDesc = $('[data-hint-desc]')!;
    const dl = level(descLen, LIMITS.description);
    hintDesc.dataset.level = dl;
    hintDesc.textContent =
      dl === 'ok'
        ? ''
        : dl === 'warn'
          ? '⚠ Na mobile sa oreže, náhľad ukazuje kde'
          : '✕ Prekračuje bezpečný limit';

    const tagCount = draft.tags.split(',').filter((t) => t.trim()).length;
    $('[data-pv-chips]')!.innerHTML = [
      `<span class="pv-chip" data-level="${level(titleLen, LIMITS.title)}">Názov ${titleLen} / ${LIMITS.title}</span>`,
      `<span class="pv-chip" data-level="${level(descLen, LIMITS.description)}">Popis ${descLen} / ${LIMITS.description}</span>`,
      `<span class="pv-chip">${tagCount} ${tagCount === 1 ? 'tag' : 'tagy'}</span>`,
      `<span class="pv-chip" data-level="${level(slug.length, LIMITS.slug)}">Slug ${slug.length} / ${LIMITS.slug}</span>`,
    ].join('');

    /* Lokalizácia: chýbajúci preklad sa označí oranžovo. */
    $('[data-pv-locale]')!.innerHTML = LANGS.map((code) => {
      const other = doc.langs[code];
      const missing = !other.title.trim();
      return `<span class="pv-loc"${missing ? ' data-missing' : ''}>
          <span class="pv-loc-key">${code.toUpperCase()} · ${formatDate(doc.date)}</span>
          <span class="pv-loc-val">${missing ? 'Chýba preklad' : escapeHtml(other.title)}</span>
        </span>`;
    }).join('');

    /* Následník v poli „nadväzuje na“ */
    const followsId = doc.follows.trim();
    $('[data-follows-title]')!.textContent = followsId
      ? (listed.find((a) => a.id === followsId)?.title ?? 'Neznáme ID')
      : '';

  }

  for (const button of $$<HTMLButtonElement>('[data-preview]')) {
    button.addEventListener('click', () => openPreview(button.dataset.preview ?? 'home'));
  }

  /* --- Väzby ----------------------------------------------------------- */

  /* Náhľad sa prekresľuje počas písania s krátkym oneskorením (250 ms). */
  let previewTimer: number | undefined;
  for (const field of Object.values(fields)) {
    field.addEventListener('input', () => {
      if (fields.title.value.trim()) attemptedSave = false;
      window.clearTimeout(previewTimer);
      previewTimer = window.setTimeout(update, 250);
    });
  }

  $$<HTMLButtonElement>('[data-folder-pick]').forEach((button) =>
    button.addEventListener('click', () => void pickFolder()),
  );

  authorSelect?.addEventListener('change', () => {
    doc.author = authorSelect.value;
    update();
  });

  $('[data-refresh]')!.addEventListener('click', () => void scan());
  $('[data-new]')!.addEventListener('click', newArticle);
  for (const button of $$<HTMLButtonElement>('[data-save]')) {
    button.addEventListener('click', () => void save());
  }
  for (const button of $$<HTMLButtonElement>('[data-download]')) {
    button.addEventListener('click', download);
  }

  $('[data-toggle-draft]')!.addEventListener('click', () => {
    doc.draft = !doc.draft;
    if (doc.draft) doc.pinned = false;
    syncToggles();
    update();
  });

  $('[data-toggle-pin]')!.addEventListener('click', () => {
    doc.pinned = !doc.pinned;
    if (doc.pinned) doc.draft = false;
    syncToggles();
    update();
  });

  for (const button of $$<HTMLButtonElement>('[data-lang-tab]')) {
    button.addEventListener('click', () => {
      collect();
      lang = (button.dataset.langTab as Lang) ?? 'sk';
      fill();
    });
  }

  const toolActions: Record<string, () => void> = {
    b: () => wrap('**'),
    i: () => wrap('*'),
    h2: () => insert('\n## '),
    h3: () => insert('\n### '),
    quote: () => insert('\n> '),
    list: () => insert('\n- '),
    link: () => wrap('[', '](https://)'),
    code: () => wrap('`'),
  };

  for (const button of $$<HTMLButtonElement>('[data-tool]')) {
    button.addEventListener('click', () => toolActions[button.dataset.tool ?? '']?.());
  }

  $('[data-image-add]')!.addEventListener('click', () => imageInput.click());

  /** Názov sa pýtame pri každom obrázku; prípona ostáva z pôvodného súboru. */
  function askImageName(original: string): string | null {
    const dot = original.lastIndexOf('.');
    const ext = dot > 0 ? original.slice(dot).toLowerCase() : '';
    const base = dot > 0 ? original.slice(0, dot) : original;

    const answer = window.prompt(`Ako sa má obrázok volať?\n(${original})`, slugify(base));
    if (answer === null) return null;

    const clean = slugify(answer.replace(/\.[^.]+$/, ''));
    return `${clean || slugify(base) || 'obrazok'}${ext}`;
  }

  imageInput.addEventListener('change', async () => {
    if (!dir || !imageInput.files || imageInput.files.length === 0) return;
    if (!doc.id) doc.id = await freshId();

    const chosen: { file: File; name: string }[] = [];
    for (const file of imageInput.files) {
      const name = askImageName(file.name);
      if (name === null) continue;
      chosen.push({ file, name });
    }

    if (chosen.length === 0) {
      imageInput.value = '';
      return;
    }

    try {
      const folder = await ensureDir(['public', 'images', 'articles', doc.id], true);
      for (const { file, name } of chosen) {
        const handle = await folder.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        await writable.write(await file.arrayBuffer());
        await writable.close();
      }
      say(`Uložené: ${chosen.map((c) => c.name).join(', ')}`);
      await loadImages();
      fill();
    } catch (error) {
      say(`Obrázok sa nedá uložiť: ${(error as Error).message}`, 'error');
    }
    imageInput.value = '';
  });

  /* Plávajúce ovládanie sa ukáže, len čo pôvodné zmizne z obrazu. */
  const floatTop = $('[data-float-top]');
  const langRow = $('.cmp-row-top');

  function toggleFloat(el: HTMLElement | null, show: boolean): void {
    if (!el) return;
    if (show) {
      el.hidden = false;
      requestAnimationFrame(() => el.classList.add('is-in'));
    } else {
      el.classList.remove('is-in');
      window.setTimeout(() => {
        if (!el.classList.contains('is-in')) el.hidden = true;
      }, 220);
    }
  }

  function syncFloat(): void {
    if (shell.hidden) {
      toggleFloat(floatTop, false);
      return;
    }
    toggleFloat(floatTop, langRow ? langRow.getBoundingClientRect().bottom < 8 : false);
  }

  let floatTicking = false;
  const onFloatScroll = () => {
    if (floatTicking) return;
    floatTicking = true;
    requestAnimationFrame(() => {
      floatTicking = false;
      syncFloat();
    });
  };
  window.addEventListener('scroll', onFloatScroll, { passive: true });
  window.addEventListener('resize', onFloatScroll, { passive: true });

  /* --- Štart ----------------------------------------------------------- */

  void (async () => {
    if (!supported) return;
    const saved = await recallHandle();
    if (!saved) return;
    try {
      const permission = await (
        saved as unknown as {
          queryPermission: (o: { mode: string }) => Promise<PermissionState>;
        }
      ).queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        dir = saved;
        await afterFolder();
      } else {
        folderLabel.textContent = 'Obnoviť prístup k priečinku';
        folderPill.dataset.off = '1';
      }
    } catch {
      /* Handle už neplatí. */
    }
  })();

  fill();
  syncFloat();
}

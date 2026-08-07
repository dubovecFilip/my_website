export const languages = ["sk", "en"] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = "sk";

/**
 * Jazyky v dropdowne. `soon: true` sa vykreslí ako nedostupná položka so
 * značkou ČOSKORO (sekcia 07): nemá vlastnú mutáciu a nedá sa vybrať.
 */
export const langMeta: Record<
  string,
  { label: string; short: string; soon?: boolean }
> = {
  sk: { label: "Slovenčina", short: "SK" },
  en: { label: "English", short: "EN" },
  // es: { label: 'Español', short: 'ES', soon: true },
};

export const dict = {
  sk: {
    /* Identita ------------------------------------------------------- */
    site_name: "MOMENTUM",
    site_tagline: "Zapíš to skôr, než to stihneš prehodnotiť.",
    site_slogan:
      "Zapíš to skôr, než to stihneš prehodnotiť. Denník nápadov, poznámok a rozpracovaných myšlienok.",
    site_description:
      "Denník nápadov, poznámok a rozpracovaných myšlienok. Píše BOGGELINO.",
    footer_rights: "© 2026 BOGGELINO",

    /* Navigácia ------------------------------------------------------ */
    nav_home: "Domov",
    nav_archive: "Archív",
    nav_about: "O projekte",
    nav_menu: "Menu",
    nav_close: "Zavrieť",
    skip_to_content: "Preskočiť na obsah",
    lang_switch: "Jazyk",
    lang_soon: "Čoskoro",

    /* Homepage ------------------------------------------------------- */
    label_pinned: "Pripnutý článok",
    label_latest: "Najnovší článok",
    read_more: "Čítaj viac",
    home_more: "Ďalšie články",
    home_archive_link: "Archív",
    empty_home: "Prvý nápad je na ceste. Zatiaľ tu nie je čo čítať.",

    /* Karta ---------------------------------------------------------- */
    badge_new: "Nové",
    badge_pinned: "Pinned",
    badge_draft: "Rozpísané",

    /* Stránka článku ------------------------------------------------- */
    published: "Publikované",
    draft_state: "Rozpísané",
    draft_band: "Práca na ceste, text sa ešte mení",
    draft_last_edit: "Posledná úprava",
    toc_title: "Obsah",
    reading_progress: "Priebeh čítania",
    count_chapter_one: "kapitola",
    count_chapter_few: "kapitoly",
    count_chapter_many: "kapitol",
    article_top: "Na začiatok",
    article_archive: "Archív článkov",
    article_share: "Zdieľať",
    share_copied: "Odkaz skopírovaný",
    author_of_article: "Autor článku",
    related_title: "Súvisiace články",
    related_note: "Vybrané podľa štítkov",
    series_label: "Séria",
    series_follows: "Nadväzuje na",
    series_next: "Pokračuje",
    series_children: "Nadväzuje",
    series_children_note: "Od najnovšieho",
    reading_unit: "min",
    reading_suffix: "čítania",

    /* Archív --------------------------------------------------------- */
    archive_title: "Archív",
    archive_rhythm: "Rytmus písania",
    archive_rhythm_hint: "Klik na stĺpec odfiltruje mesiac",
    archive_search: "Hľadanie",
    archive_search_placeholder: "Názov alebo popis článku…",
    archive_tags: "Štítky",
    archive_tags_placeholder: "Hľadať v štítkoch…",
    archive_tags_hidden: "Štítky bez zhody sú skryté",
    archive_clear: "Vyčistiť",
    archive_sort: "Zoradenie",
    archive_all: "Všetky články podľa mesiacov",
    label_filter: "Filter",
    label_sorted: "Zoradené",
    label_search: "Hľadanie",
    archive_filters: "Filtre",
    view_grid: "Mriežka",
    view_list: "Zoznam",
    page_of: "Strana",
    prev_page: "Predchádzajúca strana",
    next_page: "Nasledujúca strana",
    take_me_somewhere: "Vezmi ma niekam",

    sort_newest: "Najnovšie",
    sort_oldest: "Najstaršie",
    sort_alpha: "A – Z",
    sort_reading: "Čas čítania",

    /* Počty ---------------------------------------------------------- */
    count_article_one: "článok",
    count_article_few: "články",
    count_article_many: "článkov",
    count_tag_one: "štítok",
    count_tag_few: "štítky",
    count_tag_many: "štítkov",
    count_result_one: "výsledok",
    count_result_few: "výsledky",
    count_result_many: "výsledkov",
    results_none: "0 výsledkov",

    /* Prázdne stavy -------------------------------------------------- */
    empty_filter_title: "Nič také tu zatiaľ nie je",
    empty_filter_hint: "Pre tento výber nemám žiadny článok.",
    empty_clear: "Vyčistiť filtre",

    /* Vyhľadávanie --------------------------------------------------- */
    search_open: "Hľadať",
    search_placeholder: "Hľadať v celom webe…",
    search_articles: "Články",
    search_tags: "Štítky",
    search_hint: "Píš a vyber si z výsledkov.",
    search_empty: "Nič sa nenašlo.",
    search_kind_article: "Článok",
    search_kind_tag: "Štítok",

    /* O projekte ----------------------------------------------------- */
    about_title: "O projekte",
    about_eyebrow: "Prečo táto stránka vôbec existuje",
    about_motto:
      "MOMENTUM: preto, lebo keď ma niečo napadne, dám to hneď sem a udržím si tak flow.",
    about_lead:
      "Nápad má krátku životnosť. Kým si nájdem správny nástroj, správny čas a správnu náladu, je z neho polovica. Tento web je pokus túto stratu odstrániť: textové pole, priečinok, hotovo.",
    about_what_title: "Čo tu nájdeš",
    about_what_body:
      "Poznámky, rozpracované myšlienky, technické zápisky a občas dlhší text, ktorý sa rozrástol viac, než mal. Nič z toho neprešlo redakciou, a to je zámer, nie ospravedlnenie.",
    about_how_title: "Ako to funguje",
    about_how_body:
      "Články sú obyčajné .md súbory. Stránka je statická, bez databázy a bez prihlasovania. Do budúcna počítam s tým, že sem budú môcť písať aj iní ľudia. Zatiaľ je to jednosmerka.",
    about_principle_1_title: "Bez čakania",
    about_principle_1_text:
      "Nápad ide na web v deň, keď vznikne. Aj keď nie je hotový.",
    about_principle_2_title: "Bez redakcie",
    about_principle_2_text:
      "Text sa neupravuje spätne. Staré zápisky ostávajú také, aké boli.",
    about_principle_3_title: "Bez balastu",
    about_principle_3_text:
      "Žiadne cookie lišty, žiadne odbery, žiadne sledovanie.",
    about_author_role: "Autor a jediný redaktor",
    about_author_bio:
      "Píšem o tom, ako veci robím, nie o tom, ako by sa mali robiť. Väčšinou v noci, väčšinou naraz.",

    /* 404 ------------------------------------------------------------ */
    not_found_title: "Stránka nenájdená",
    not_found_body:
      "Táto stránka sa niekam zatúlala. Nápad, ktorý tu mal byť, sa asi nestihol zapísať včas.",
    not_found_home: "Späť na hlavnú",
    not_found_search: "Prehľadať archív",
    not_found_latest: "Najnovšie články",
    not_found_error: "Chyba 404",

    /* Chýbajúci preklad ---------------------------------------------- */
    missing_translation: "Tento článok existuje zatiaľ len po slovensky.",
    missing_translation_en: "Tento článok existuje zatiaľ len po anglicky.",
    missing_read_original: "Prečítať pôvodinu",
    missing_see_archive: "Zobraziť slovenský archív",

    /* Ostatné -------------------------------------------------------- */
    rss: "RSS kanál",
    print_source: "Zdroj",
  },

  en: {
    site_name: "MOMENTUM",
    site_tagline: "Write it down before you talk yourself out of it.",
    site_slogan:
      "Write it down before you talk yourself out of it. A log of ideas, notes and half-finished thoughts.",
    site_description:
      "A log of ideas, notes and half-finished thoughts. By BOGGELINO.",
    footer_rights: "© 2026 BOGGELINO",

    nav_home: "Home",
    nav_archive: "Archive",
    nav_about: "The Project",
    nav_menu: "Menu",
    nav_close: "Close",
    skip_to_content: "Skip to content",
    lang_switch: "Language",
    lang_soon: "Soon",

    label_pinned: "Pinned article",
    label_latest: "Latest article",
    read_more: "Read more",
    home_more: "More articles",
    home_archive_link: "Archive",
    empty_home: "The first idea is on its way. Nothing to read here yet.",

    badge_new: "New",
    badge_pinned: "Pinned",
    badge_draft: "In progress",

    published: "Published",
    draft_state: "In progress",
    draft_band: "Work in progress, this text is still changing",
    draft_last_edit: "Last edited",
    toc_title: "Contents",
    reading_progress: "Reading progress",
    count_chapter_one: "chapter",
    count_chapter_few: "chapters",
    count_chapter_many: "chapters",
    article_top: "Back to top",
    article_archive: "Article archive",
    article_share: "Share",
    share_copied: "Link copied",
    author_of_article: "Article author",
    related_title: "Related articles",
    related_note: "Chosen by tags",
    series_label: "Series",
    series_follows: "Follows",
    series_next: "Continues in",
    series_children: "Followed by",
    series_children_note: "Newest first",
    reading_unit: "min",
    reading_suffix: "read",

    archive_title: "Archive",
    archive_rhythm: "Writing rhythm",
    archive_rhythm_hint: "Click a column to filter that month",
    archive_search: "Search",
    archive_search_placeholder: "Article title or description…",
    archive_tags: "Tags",
    archive_tags_placeholder: "Search tags…",
    archive_tags_hidden: "Tags without matches are hidden",
    archive_clear: "Clear",
    archive_sort: "Sort",
    archive_all: "All articles by month",
    label_filter: "Filter",
    label_sorted: "Sorted",
    label_search: "Search",
    archive_filters: "Filters",
    view_grid: "Grid",
    view_list: "List",
    page_of: "Page",
    prev_page: "Previous page",
    next_page: "Next page",
    take_me_somewhere: "Take me somewhere",

    sort_newest: "Newest",
    sort_oldest: "Oldest",
    sort_alpha: "A – Z",
    sort_reading: "Reading time",

    count_article_one: "article",
    count_article_few: "articles",
    count_article_many: "articles",
    count_tag_one: "tag",
    count_tag_few: "tags",
    count_tag_many: "tags",
    count_result_one: "result",
    count_result_few: "results",
    count_result_many: "results",
    results_none: "0 results",

    empty_filter_title: "Nothing like that here yet",
    empty_filter_hint: "No article matches this selection.",
    empty_clear: "Clear filters",

    search_open: "Search",
    search_placeholder: "Search the whole site…",
    search_articles: "Articles",
    search_tags: "Tags",
    search_hint: "Type and pick from the results.",
    search_empty: "Nothing found.",
    search_kind_article: "Article",
    search_kind_tag: "Tag",

    about_title: "The Project",
    about_eyebrow: "Why this page exists at all",
    about_motto:
      "MOMENTUM: because when an idea hits, it goes straight here and the flow keeps going.",
    about_lead:
      "An idea has a short shelf life. By the time I find the right tool, the right moment and the right mood, half of it is gone. This site is an attempt to remove that loss: a text field, a folder, done.",
    about_what_title: "What you will find here",
    about_what_body:
      "Notes, unfinished thoughts, technical scribbles and occasionally a longer text that grew more than it should have. None of it went through an editor. That is the point, not an excuse.",
    about_how_title: "How it works",
    about_how_body:
      "Articles are plain .md files. The site is static, with no database and no login. Eventually other people may be able to write here. For now it is a one-way street.",
    about_principle_1_title: "No waiting",
    about_principle_1_text:
      "An idea goes live the day it appears. Even when it is not finished.",
    about_principle_2_title: "No editing",
    about_principle_2_text:
      "Texts are not rewritten later. Old notes stay exactly as they were.",
    about_principle_3_title: "No clutter",
    about_principle_3_text: "No cookie bars, no newsletters, no tracking.",
    about_author_role: "Author and only editor",
    about_author_bio:
      "I write about how I do things, not how they should be done. Mostly at night, mostly in one sitting.",

    not_found_title: "Page not found",
    not_found_body:
      "This page wandered off. The idea that should have been here probably never got written down in time.",
    not_found_home: "Back to home",
    not_found_search: "Search the archive",
    not_found_latest: "Latest articles",
    not_found_error: "Error 404",

    missing_translation: "This one exists only in Slovak.",
    missing_translation_en: "This one exists only in English.",
    missing_read_original: "Read the original",
    missing_see_archive: "See the English archive",

    rss: "RSS feed",
    print_source: "Source",
  },
} as const;

export type Dict = (typeof dict)["sk"];

export function t(lang: Lang): Dict {
  return dict[lang] as Dict;
}

export function otherLang(lang: Lang): Lang {
  return lang === "en" ? "sk" : "en";
}

/** Rovnaká obrazovka v inom jazyku, prepnutie drží čitateľa na mieste. */
export function swapLangInPath(path: string, target: Lang): string {
  const stripped = path.replace(/^\/(sk|en)(?=\/|$)/, "");
  return `/${target}${stripped || "/"}`;
}

export const languages = ["en", "sk"] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = "sk";

// Metadata for the language dropdown. Add more entries here later if the site
// ever grows past SK/EN — the dropdown UI already supports any number of languages.
export const langMeta: Record<Lang, { label: string; flag: string }> = {
  sk: { label: "Slovenčina", flag: "🇸🇰" },
  en: { label: "English", flag: "🇬🇧" },
};

export const dict = {
  en: {
    tagline: "Rants, ramblings and things I like",
    nav_home: "Home",
    nav_tags: "Archive",
    nav_about: "The Project",
    nav_gallery: "Gallery",
    home_latest: "Latest articles",
    home_empty: "Nothing posted yet. Check back soon.",
    read_more: "Read article",
    back_home: "Back to all articles",
    written_by: "Written by",
    published_on: "Published",
    all_tags: "All tags",
    tagged_with: "Tagged",
    articles_in_tag: "articles",
    footer_rss: "RSS feed",
    lang_switch: "Language",
    theme_toggle: "Toggle light mode",
    suggest_soon: "Got an idea for an article? Submissions are coming soon.",
    not_found_title: "Page not found",
    not_found_body: "This page wandered off. Let's get you back.",
    about_title: "The Project",
    about_eyebrow: "Why this exists",
    about_motto:
      "MOMENTUM — because when an idea hits, I drop it here right away and keep the flow going. Keep the momentum.",
    about_purpose_1:
      "MOMENTUM is where I stash ideas before they slip away. Posts about games, music, 3D printing, modding, and whatever else grabs my attention. No schedule, no promises, just whatever comes to mind.",
    about_purpose_2:
      "The name is on purpose. When something clicks, I want to capture it right away and move on. Keeping that sense of momentum going while it lasts.",
    about_author_title: "Author",
    about_intro_1:
      "MOMENTUM is run by BOGGELINO, an informatics student at Žilina University.",
    about_intro_2:
      "I'm into gaming, I make amateur 3D models on the side, and I've got a habit of diving headfirst into whatever new thing I get curious about: modding, servers, whatever it is that week.",
    about_links_title: "Find me elsewhere",
    featured_label: "Pinned post",
    sidebar_about: "About me",
    sidebar_recent: "Recent posts",
    sidebar_categories: "Categories",
    sidebar_empty: "Nothing here yet.",
    gallery_title: "Gallery",
    gallery_intro:
      "Photos I want to keep around somewhere. No big context, just here.",
    gallery_empty: "No photos here yet. Check back soon.",
  },
  sk: {
    tagline: "Nadávanie, blúznenie a veci, čo mám rád",
    nav_home: "Domov",
    nav_tags: "Archív",
    nav_about: "O projekte",
    nav_gallery: "Galéria",
    home_latest: "Najnovšie články",
    home_empty: "Zatiaľ tu nič nie je. Skús to znova neskôr.",
    read_more: "Čítať článok",
    back_home: "Späť na všetky články",
    written_by: "Napísal",
    published_on: "Publikované",
    all_tags: "Všetky štítky",
    tagged_with: "Štítok",
    articles_in_tag: "článkov",
    footer_rss: "RSS kanál",
    lang_switch: "Jazyk",
    theme_toggle: "Prepnúť svetlý režim",
    suggest_soon: "Máš nápad na článok? Návrhy čoskoro spustíme.",
    not_found_title: "Stránka nenájdená",
    not_found_body: "Táto stránka sa niekam zatúlala. Poď späť.",
    about_title: "O projekte",
    about_eyebrow: "Prečo to existuje",
    about_motto:
      "MOMENTUM — preto, lebo keď ma niečo napadne, dám to hneď sem a udržím si tak flow. Svoje momentum.",
    about_purpose_1:
      "MOMENTUM je miesto, kam si ukladám myšlienky skôr, než mi vyprchajú. Články o hrách, hudbe, 3D tlači, moddingu a čomkoľvek inom, čo ma práve chytí. Bez harmonogramu, bez sľubov, jednoducho tak, ako mi to príde.",
    about_purpose_2:
      "Meno nie je náhodné. Keď ma niečo napadne, chcem si to hneď zachytiť a ísť ďalej. Udržať si ten pocit rozbehu, kým ešte trvá.",
    about_author_title: "Autor",
    about_intro_1:
      "Za MOMENTOM stojí BOGGELINO, študent informatiky na Žilinskej univerzite.",
    about_intro_2:
      "Bavia ma hry, popri tom robím amatérske 3D modely a mám taký zvyk vrhnúť sa naplno do čohokoľvek nového, čo ma zaujme: modding, servery, čokoľvek to práve je.",
    about_links_title: "Nájdeš ma aj tu",
    featured_label: "Pripnutý článok",
    sidebar_about: "O mne",
    sidebar_recent: "Posledné príspevky",
    sidebar_categories: "Kategórie",
    sidebar_empty: "Zatiaľ tu nič nie je.",
    gallery_title: "Galéria",
    gallery_intro:
      "Fotky, ktoré si chcem nechať niekde poruke. Bez veľkého kontextu, jednoducho tu sú.",
    gallery_empty: "Zatiaľ tu nie sú žiadne fotky. Skús to znova neskôr.",
  },
} as const;

export function t(lang: Lang) {
  return dict[lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === "en" ? "sk" : "en";
}

// Lightweight relative-time formatter used in the homepage sidebar
// (kept out of the main dict since it needs a numeric argument).
export function relativeTime(date: Date, lang: Lang): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86_400_000),
  );

  if (lang === "sk") {
    if (days === 0) return "dnes";
    if (days === 1) return "pred 1 dňom";
    if (days >= 2 && days <= 4) return `pred ${days} dňami`;
    return `pred ${days} dňami`;
  }

  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

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
    nav_tags: "Tags",
    nav_about: "About",
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
    about_title: "About me",
    about_intro_1:
      "I'm BOGGELINO, an informatics student at Žilina University.",
    about_intro_2:
      "I'm into gaming, I make amateur 3D models on the side, and I've got a habit of diving headfirst into whatever new thing I get curious about: modding, servers, whatever it is that week.",
    about_links_title: "Find me elsewhere",
    featured_label: "Pinned post",
    sidebar_about: "About me",
    sidebar_recent: "Recent posts",
    sidebar_categories: "Categories",
    sidebar_empty: "Nothing here yet.",
  },
  sk: {
    tagline: "Nadávanie, blúznenie a veci, čo mám rád",
    nav_home: "Domov",
    nav_tags: "Štítky",
    nav_about: "O mne",
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
    about_title: "O mne",
    about_intro_1:
      "Som BOGGELINO, študent informatiky na Žilinskej univerzite.",
    about_intro_2:
      "Bavia ma hry, popri tom robím amatérske 3D modely a mám taký zvyk vrhnúť sa naplno do čohokoľvek nového, čo ma zaujme: modding, servery, čokoľvek to práve je.",
    about_links_title: "Nájdeš ma aj tu",
    featured_label: "Pripnutý článok",
    sidebar_about: "O mne",
    sidebar_recent: "Posledné príspevky",
    sidebar_categories: "Kategórie",
    sidebar_empty: "Zatiaľ tu nič nie je.",
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

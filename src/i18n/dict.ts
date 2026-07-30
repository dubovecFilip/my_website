export const languages = ['en', 'sk'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'sk';

// Metadata for the language dropdown. Add more entries here later if the site
// ever grows past SK/EN — the dropdown UI already supports any number of languages.
export const langMeta: Record<Lang, { label: string; flag: string }> = {
  sk: { label: 'Slovenčina', flag: '🇸🇰' },
  en: { label: 'English', flag: '🇬🇧' },
};

export const dict = {
  en: {
    tagline: 'Rants, ramblings and things I like',
    nav_home: 'Home',
    nav_tags: 'Tags',
    nav_about: 'About',
    home_latest: 'Latest articles',
    home_empty: 'Nothing posted yet. Check back soon.',
    read_more: 'Read article',
    back_home: 'Back to all articles',
    written_by: 'Written by',
    published_on: 'Published',
    all_tags: 'All tags',
    tagged_with: 'Tagged',
    articles_in_tag: 'articles',
    footer_rss: 'RSS feed',
    lang_switch: 'Language',
    theme_toggle: 'Toggle light mode',
    suggest_soon: 'Got an idea for an article? Submissions are coming soon.',
    not_found_title: 'Page not found',
    not_found_body: "This page wandered off. Let's get you back.",
    about_title: 'About me',
    about_intro_1: "I'm BOGGELINO — real name Filip Dubovec, an informatics student at Žilina University.",
    about_intro_2: "I'm into gaming, I make amateur 3D models on the side, and I've got a habit of diving headfirst into whatever new thing I get curious about — modding, servers, whatever it is that week.",
    about_links_title: 'Find me elsewhere',
  },
  sk: {
    tagline: 'Nadávanie, blúznenie a veci, čo mám rád',
    nav_home: 'Domov',
    nav_tags: 'Štítky',
    nav_about: 'O mne',
    home_latest: 'Najnovšie články',
    home_empty: 'Zatiaľ tu nič nie je. Skús to znova neskôr.',
    read_more: 'Čítať článok',
    back_home: 'Späť na všetky články',
    written_by: 'Napísal',
    published_on: 'Publikované',
    all_tags: 'Všetky štítky',
    tagged_with: 'Štítok',
    articles_in_tag: 'článkov',
    footer_rss: 'RSS kanál',
    lang_switch: 'Jazyk',
    theme_toggle: 'Prepnúť svetlý režim',
    suggest_soon: 'Máš nápad na článok? Návrhy čoskoro spustíme.',
    not_found_title: 'Stránka nenájdená',
    not_found_body: 'Táto stránka sa niekam zatúlala. Poď späť.',
    about_title: 'O mne',
    about_intro_1: 'Som BOGGELINO — reálnym menom Filip Dubovec, študent informatiky na Žilinskej univerzite.',
    about_intro_2: 'Bavia ma hry, popri tom robím amatérske 3D modely, a mám taký zvyk vrhnúť sa naplno do čohokoľvek nového, čo ma zaujme — modding, servery, čokoľvek to práve je.',
    about_links_title: 'Nájdeš ma aj tu',
  },
} as const;

export function t(lang: Lang) {
  return dict[lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'sk' : 'en';
}

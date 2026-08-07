# MOMENTUM_

Denník nápadov, poznámok a rozpracovaných myšlienok. Statický web v Astro,
nasadzovaný na Netlify. Táto verzia je implementáciou návrhu **MOMENTUM · Prehľad
· v2 · 2026**, čísla sekcií nižšie odkazujú naň.

Verejný web má päť obrazoviek (homepage, článok, archív, o projekte, 404) a jeden
editor (`/compose/`). Slovenčina aj angličtina majú vlastný prefix v
adrese; koreň `/` presmeruje na `/sk/`.

---

## Spustenie

```bash
npm install
npm run dev      # vývojový server
npm run build    # statický výstup do dist/
npm run preview  # náhľad hotového buildu
```

Node 22.12 alebo novší.

---

## Adresy

| Obrazovka       | SK                                | EN                                |
| --------------- | --------------------------------- | --------------------------------- |
| Homepage        | `/sk/`                            | `/en/`                            |
| Článok          | `/sk/articles/836206-[slug]/`     | `/en/articles/836206-[slug]/`     |
| Archív          | `/sk/articles/`                   | `/en/articles/`                   |
| O projekte      | `/sk/about/`                      | `/en/about/`                      |
| 404             | `/sk/404/`                        | `/en/404/`                        |
| Compose         | `/compose/`, bez jazykového prefixu                          ||

Kanonické je **číselné ID**; slug za ním je len čitateľná ozdoba. Samotné
`/sk/articles/836206/` sa presmeruje na plný tvar, pravidlá sa generujú pri
builde do `dist/_redirects`.

---

## Ako je to poskladané

```
src/
  content.config.ts        kolekcie articles-sk / articles-en
  content/articles/{sk,en}/<id>.md
  i18n/dict.ts             všetky texty rozhrania, nikdy natvrdo v komponente
  data/authors.ts          autori
  data/social.ts           odkazy na stránke O projekte
  data/redirects.json      tabuľka starých ID → nové ID
  utils/
    articles.ts            načítanie, pravidlá výberu, kontroly obsahu
    article-paths.ts       getStaticPaths vrátane chýbajúcich prekladov
    format.ts              dátumy, čas čítania, slovenské tvary počtov
    og.ts                  generovanie OG karty (satori + resvg)
    feed.ts                RSS pre jednu mutáciu
  layouts/BaseLayout.astro hlavička, päta, meta, prechod stránok
  screens/                 celé obrazovky, jazyk dostávajú ako prop
  components/              opakované prvky
  scripts/                 klientská logika (archív, článok, vyhľadávanie, …)
  styles/
    global.css             tokeny zo sekcie 13 a 16, fonty, resety
    article.css            text článku (používa aj náhľad v Compose)
    print.css              tlačová podoba A4
  integrations/redirects.mjs   zápis dist/_redirects po builde
public/fonts/              self-hostované woff2 subsety
src/assets/fonts/          zlúčené ttf len pre generovanie OG kariet
```

Stránky v `src/pages/{sk,en}/` sú tenké, importujú obrazovku zo `src/screens/`
a odovzdajú jej jazyk. Vďaka tomu je logika na jednom mieste a mutácia sa nedá
rozísť.

---

## Frontmatter článku

```yaml
---
title: "Manifest jedného nápadu"
description: "Keď ma niečo napadne, dám to sem, hneď, bez redakcie."
date: 2026-07-14
tags: ["manifest", "proces"]
author: "boggelino"      # voliteľné, predvolene boggelino
slug: "vlastny-slug"     # voliteľné, inak sa odvodí z názvu
follows: "742018"        # voliteľné, ID predchádzajúceho článku v sérii
draft: false             # true = rozpísané: verejné, ale so značkou
pinned: false            # pripnutý môže byť vždy len jeden článok v jazyku
authorNote: "…"          # voliteľná poznámka do pravého stĺpca
---
```

ID článku je názov súboru (`836206.md`). Jazykové mutácie sa párujú cez **rovnaké
ID**, nikdy cez názov. Obrázky patria do `public/images/articles/<id>/` a v texte
sa odkazujú absolútnou cestou.

**Build zlyhá**, keď: sú dva pripnuté články v jednom jazyku, vznikne cyklus v
poli `follows`, `follows` odkazuje na neznáme ID, alebo je článok naraz rozpísaný
aj pripnutý. Chýbajúci obrázok je len varovanie.

---

## Pravidlá, na ktorých web stojí

- **Článok nemá titulný obrázok.** Prvý obrázok v texte je zároveň náhľad na
  karte aj v zdieľaní.
- **Karta je jeden odkaz na celú plochu.** Štítky na nej sú len text; filtruje sa
  zo zoznamu v archíve.
- **Jeden accentový prvok na obrazovku.** `#d93f11` pre nadpisy od 24 px, plochy
  a značky; `#f2724a` pre všetok accentový text pod 24 px.
- **Autor je len na stránke O projekte a v pravom stĺpci článku.**
- **Homepage ukazuje hlavnú kartu a najviac 9 ďalších**, dokopy 10. Odkaz do
  archívu sa objaví až od 11. článku.
- **Delenie na mesiace platí len pre nefiltrovaný archív** zoradený od
  najnovšieho.
- **Nikdy sa nedopĺňajú prázdne karty**, aby mriežka vyzerala plná.
- **Fokusový prstenec 2 px sa neodstraňuje.**
- **Obsah sa nad 1440 px centruje**, nikdy sa neroztiahne cez celú šírku okna.
- **Pri `prefers-reduced-motion` je pohyb nulový**, premenná `--motion` sa
  nastaví na 0 a web ostane plne funkčný.

Web sa dá čítať aj bez JavaScriptu: text článku, navigácia aj celý zoznam v
archíve sa vykreslia zo servera. Filtrovanie, vyhľadávanie a sledovanie čítania
sú nadstavba.

---

## Compose

`/compose/` je editor článkov. Nasadzuje sa spolu s webom, ale bežnému
návštevníkovi je na nič: pracuje s **priečinkom projektu** cez File System
Access API (Chrome, Edge), takže bez vybraného priečinku nemá čo načítať ani
kam uložiť. Preto nepotrebuje prihlásenie.

Čo vie: zoznam článkov so stavmi a akciami, výber autora zo `src/data/authors.ts`,
formulár s kontrolou dĺžok (názov 60, popis 64, slug 80 znakov, prekročený slug
uloženie blokuje), tri náhľady v reálnych rozmeroch pre desktop, tablet aj mobil
(hlavná karta, karta v mriežke, stránka článku), náhľad lokalizácie a zápis
priamo do projektu.

Web nemá klávesové skratky. Všetko sa ovláda tlačidlami; keď pôvodné ovládanie
odscrolluje z obrazu, dole nabehne plávajúca lišta s prepínačom jazyka a oboma
tlačidlami na uloženie.

Každé uloženie je jeden commit, správa sa skladá automaticky a kopíruje sa do
schránky.

---

## Build a nasadenie

`npm run build` vyprodukuje:

- statické HTML pre všetky obrazovky a obe mutácie,
- OG kartu 1200 × 630 pre každý článok (`/sk/og/<id>.png`),
- index vyhľadávania (`/search-index.json`),
- RSS pre obe mutácie a `sitemap.xml`,
- `dist/_redirects` s presmerovaním z holého ID na plný tvar a s tabuľkou
  starých ID zo `src/data/redirects.json`.

Nasadenie je push, Netlify build spustí `npm run build` a publikuje `dist/`.

### Fonty

Anton, Inter a JetBrains Mono sú self-hostované v `public/fonts/` ako woff2
subsety (latin + latin-ext) z balíkov `@fontsource/*`, ktoré sú vo
`devDependencies`. Ak pribudne rez alebo váha, skopíruj príslušný súbor z
`node_modules/@fontsource/<rodina>/files/` a dopíš `@font-face` do
`src/styles/global.css`.

`src/assets/fonts/*.ttf` sú zlúčené subsety (latin + latin-ext v jednom súbore),
ktoré potrebuje satori pri generovaní OG kariet, satori medzi subsetmi
nefallbackuje, takže bez zlúčenia by chýbala diakritika.

---

## Stav

Prvé spustenie aj druhá vlna sú implementované: séria a nadväznosť, prečítané a
rozčítané, náhodný článok, chýbajúci preklad, vyhľadávanie cez lupu v hlavičke,
generované OG karty, chybové stavy Compose, tlačová podoba a beh bez
JavaScriptu.

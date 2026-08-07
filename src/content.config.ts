import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Cieľová schéma zo sekcie 14.
 *
 * ID článku = názov súboru (836206.md) = entry.id. Jazykové mutácie sa párujú
 * cez rovnaké ID, nikdy cez názov. `slug` je len čitateľná ozdoba v adrese.
 * Ak chýba, odvodí sa z názvu.
 */
const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  /** Rozpísaný článok: verejný, ale so značkou. */
  draft: z.boolean().default(false),
  pinned: z.boolean().default(false),
  authorNote: z.string().optional(),
  author: z.string().default('boggelino'),
  /** ID predchádzajúceho článku v sérii. */
  follows: z.string().optional(),
  /** Vlastný slug; inak sa odvodí z názvu. */
  slug: z.string().optional(),
});

export type ArticleData = z.infer<typeof articleSchema>;

export const collections = {
  'articles-sk': defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/articles/sk' }),
    schema: articleSchema,
  }),
  'articles-en': defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/articles/en' }),
    schema: articleSchema,
  }),
};

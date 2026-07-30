import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  author: z.string().default('boggelino'),
});

const articlesEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles/en' }),
  schema: articleSchema,
});

const articlesSk = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles/sk' }),
  schema: articleSchema,
});

export const collections = {
  'articles-en': articlesEn,
  'articles-sk': articlesSk,
};

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

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

// @ts-check
import { defineConfig } from 'astro/config';
import rehypeImageCaptions from './src/utils/rehype-image-captions.mjs';

// https://astro.build/config
export default defineConfig({
  // Update this to your real domain once you have one (needed for correct RSS links).
  site: 'https://boggelino.netlify.app',
  markdown: {
    rehypePlugins: [rehypeImageCaptions],
  },
});

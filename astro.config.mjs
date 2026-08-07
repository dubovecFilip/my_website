// @ts-check
import { defineConfig } from 'astro/config';
import rehypeImageCaptions from './src/utils/rehype-image-captions.mjs';
import redirects from './src/integrations/redirects.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://boggelino.netlify.app',
  /*
   * 'ignore' znamená, že /sk aj /sk/ vedú na tú istú stránku a nič nehádže 404
   * ani v `astro dev`, ani v `astro preview`. Kanonický tvar s lomkou drží
   * <link rel="canonical"> v BaseLayoute a pravidlá v _redirects, ktoré
   * generuje integrácia momentum:redirects.
   */
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  markdown: {
    rehypePlugins: [rehypeImageCaptions],
  },
  integrations: [redirects()],
});

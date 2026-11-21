import { defineConfig } from 'astro/config';

// BASE is set only for a preview on GitHub Pages; the real site is served from the domain root.
export default defineConfig({
  site: process.env.SITE || 'https://regency-lodge-sharm.pages.dev',
  base: process.env.BASE || '/',
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_rl', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
  image: { responsiveStyles: false },
});

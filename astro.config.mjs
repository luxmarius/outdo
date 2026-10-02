// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * GitHub Pages settings
 * ---------------------
 * If the repo is  <user>.github.io           → site: 'https://<user>.github.io', base: '/'
 * If the repo is  <user>/outdo (project site) → site: 'https://<user>.github.io', base: '/outdo'
 * If you attach a custom domain (e.g. outdo.bike) → site: 'https://outdo.bike', base: '/'
 *
 * Always use the `url()` helper from src/lib/url.ts for internal links and
 * asset paths so the base path is applied automatically.
 */
export default defineConfig({
  site: 'https://luxmarius.github.io',
  base: '/outdo',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});

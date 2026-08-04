import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // Troque pelo domínio real (usado para gerar sitemap e URLs absolutas):
  site: 'https://SEU-DOMINIO.com.br',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [tailwind({ applyBaseStyles: false })],
});

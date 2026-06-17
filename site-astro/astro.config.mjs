import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // Troque pelo domínio real (usado para gerar sitemap e URLs absolutas):
  site: 'https://SEU-DOMINIO.com.br',
  integrations: [tailwind({ applyBaseStyles: false })],
});

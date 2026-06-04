import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: false })],
  output: 'static',
  site: 'https://bionodum.com',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});

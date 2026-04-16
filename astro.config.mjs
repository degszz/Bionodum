import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: false })],
  output: 'static',
  site: 'https://bionodum.vercel.app',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});

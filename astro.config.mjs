// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind(),
  ],
  output: 'static',
  site: 'https://ascend-bd295.web.app',
  build: {
    assets: 'astro'
  }
});

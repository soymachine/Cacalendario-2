// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://soymachine.github.io',
  base: '/Cacalendario-2',
  integrations: [react(), tailwind()],
});

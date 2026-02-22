import react from '@astrojs/react';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://chrisamaya.work',
  base: '/',
  compressHTML: true,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  build: { inlineStylesheets: 'auto' },
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['chrisamaya.work', 'www.chrisamaya.work', 'localhost', '127.0.0.1'],
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: { manualChunks: { 'react-vendor': ['react', 'react-dom'] } },
      },
    },
  },
});

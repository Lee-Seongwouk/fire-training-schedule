import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./github-pages',import.meta.url)),
  base: '/fire-training-schedule/',
  publicDir: fileURLToPath(new URL('./github-pages/public',import.meta.url)),
  resolve: {alias: {'@': fileURLToPath(new URL('.',import.meta.url))}},
  plugins: [react()],
  css: {postcss: fileURLToPath(new URL('.',import.meta.url))},
  build: {outDir: fileURLToPath(new URL('./docs',import.meta.url)),emptyOutDir:true},
});

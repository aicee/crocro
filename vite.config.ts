import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from '@samrum/vite-plugin-web-extension';
import manifest from './manifest.json';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    webExtension({
      manifest,
      browser: mode === 'firefox' ? 'firefox' : 'chrome'
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}));

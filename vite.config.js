import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// base must match the GitHub Pages project path.
export default defineConfig({
  base: '/jubilant-octo-barnacle/',
  // Keep modern CSS (color-mix, the translate property) instead of
  // downgrading it — the platform skins depend on both.
  build: { cssTarget: ['chrome111', 'safari16.4', 'firefox128'] },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.png'],
      manifest: false, // we ship our own public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/jubilant-octo-barnacle/index.html',
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});

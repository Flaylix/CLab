import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        mentions: 'mentions-legales.html',
        confidentialite: 'politique-confidentialite.html',
        cookies: 'politique-cookies.html',
        admin: 'admin.html',
      },
    },
  },
});

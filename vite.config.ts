import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
      '@shared': resolve(rootDir, 'src/shared'),
      '@actors': resolve(rootDir, 'src/actors'),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        life: resolve(rootDir, 'games/life/index.html'),
        slots: resolve(rootDir, 'games/slots/index.html'),
        arkanoid: resolve(rootDir, 'games/arkanoid/index.html'),
        snake: resolve(rootDir, 'games/snake/index.html'),
      },
    },
  },
});

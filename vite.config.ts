import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

const { version } = JSON.parse(
  readFileSync(resolve(rootDir, 'package.json'), 'utf-8'),
) as { version: string };

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(version),
  },
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

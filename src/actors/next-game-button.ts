import type { Container } from 'pixi.js';
import { createButton } from '@actors/button';

// asks the host to swap us out via postMessage. Standalone: bounces to the root menu.
export const createNextGameButton = (): Container =>
  createButton({
    label: 'NEXT GAME',
    onPress: () => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'next-game' }, '*');
      } else {
        window.location.href = '/';
      }
    },
  });

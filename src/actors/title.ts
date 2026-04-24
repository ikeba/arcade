import type { Text } from 'pixi.js';
import { createText } from '@actors/text';

// Game title bar text — mirrors the .menu h1 styling in base.css so the
// title reads like a natural continuation of the root menu.
export const createTitle = (label: string): Text =>
  createText({
    text: label.toUpperCase(),
    size: 16,
    letterSpacing: 8,
  });

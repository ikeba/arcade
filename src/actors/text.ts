import { Text, TextStyle } from 'pixi.js';
import { defaultTokens } from '@shared/tokens';

export type TextActorOptions = {
  text: string;
  size?: number;
  color?: string;
  letterSpacing?: number;
};

const FONT_FAMILY = 'ui-monospace, Menlo, Monaco, Consolas, monospace';

// Centered text actor using the project's default font and fg color.
export const createText = ({
  text,
  size = 24,
  color = defaultTokens.fg,
  letterSpacing = 4,
}: TextActorOptions): Text => {
  const actor = new Text({
    text,
    style: new TextStyle({
      fill: color,
      fontFamily: FONT_FAMILY,
      fontSize: size,
      letterSpacing,
    }),
  });
  // Anchor 0.5 makes position = center of the text.
  actor.anchor.set(0.5);
  return actor;
};

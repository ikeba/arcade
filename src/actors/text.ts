import { Text, TextStyle } from 'pixi.js';
import { defaultTokens } from '@shared/tokens';

export type TextActorOptions = {
  text: string;
  size?: number;
  color?: string;
  letterSpacing?: number;
  // Normalized anchor point (0..1). A scalar sets both axes. Default 0.5 =
  // visual center. Use 0 (or [0, 0]) for top-left anchoring, e.g. paragraphs.
  anchor?: number | [number, number];
};

const FONT_FAMILY = 'ui-monospace, Menlo, Monaco, Consolas, monospace';

// Text actor using the project's default font and fg color.
export const createText = ({
  text,
  size = 24,
  color = defaultTokens.fg,
  letterSpacing = 4,
  anchor = 0.5,
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
  const [ax, ay] = typeof anchor === 'number' ? [anchor, anchor] : anchor;
  actor.anchor.set(ax, ay);
  return actor;
};

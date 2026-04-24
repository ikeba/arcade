import { Text, TextStyle } from 'pixi.js';
import { getTokens, onThemeChange } from '@shared/theme';

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

// When `color` is omitted, the actor tracks the current fg token and repaints
// on theme change. Pass an explicit color to opt out of that subscription
// (e.g. callers like the button that manage their own text color).
export const createText = ({
  text,
  size = 24,
  color,
  letterSpacing = 4,
  anchor = 0.5,
}: TextActorOptions): Text => {
  const actor = new Text({
    text,
    style: new TextStyle({
      fill: color ?? getTokens().fg,
      fontFamily: FONT_FAMILY,
      fontSize: size,
      letterSpacing,
    }),
  });
  const [ax, ay] = typeof anchor === 'number' ? [anchor, anchor] : anchor;
  actor.anchor.set(ax, ay);

  if (color === undefined) {
    const off = onThemeChange((t) => {
      if (actor.destroyed) return;
      actor.style.fill = t.fg;
    });
    actor.on('destroyed', off);
  }

  return actor;
};

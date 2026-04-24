import { Container, Graphics, Rectangle } from 'pixi.js';
import { createText } from '@actors/text';
import { defaultTokens } from '@shared/tokens';

export const DEFAULT_BUTTON_W = 128;
export const DEFAULT_BUTTON_H = 32;

export type ButtonOptions = {
  label: string;
  width?: number;
  height?: number;
  onPress: () => void;
};

// Stroke-only rectangular button. Hover swaps fg→accent on both border and label.
export const createButton = ({
  label,
  width = DEFAULT_BUTTON_W,
  height = DEFAULT_BUTTON_H,
  onPress,
}: ButtonOptions): Container => {
  const container = new Container();
  const border = new Graphics();
  const text = createText({ text: label, size: 12 });
  container.addChild(border, text);

  // Repaints border + text to the same color so they always match.
  const paint = (color: string) => {
    border.clear();
    border.rect(-width / 2, -height / 2, width, height).stroke({ color, width: 1 });
    text.style.fill = color;
  };

  paint(defaultTokens.fg);

  container.eventMode = 'static';
  container.cursor = 'pointer';
  // Explicit hitArea so clicks land on the whole rect, not just the stroked edge.
  container.hitArea = new Rectangle(-width / 2, -height / 2, width, height);

  container.on('pointerover', () => paint(defaultTokens.accent));
  container.on('pointerout', () => paint(defaultTokens.fg));
  container.on('pointertap', onPress);

  return container;
};

import { Container, Graphics, Rectangle } from 'pixi.js';
import { createText } from '@actors/text';
import { getTokens, onThemeChange } from '@shared/host';

export const DEFAULT_BUTTON_W = 128;
export const DEFAULT_BUTTON_H = 32;

export type ButtonOptions = {
  label: string;
  width?: number;
  height?: number;
  onPress: () => void;
};

export const createButton = ({
  label,
  width = DEFAULT_BUTTON_W,
  height = DEFAULT_BUTTON_H,
  onPress,
}: ButtonOptions): Container => {
  const container = new Container();
  const border = new Graphics();
  const text = createText({ text: label, size: 12, color: getTokens().fg });
  container.addChild(border, text);

  let hovered = false;

  const repaint = () => {
    if (container.destroyed) return;
    const { fg, accent } = getTokens();
    const color = hovered ? accent : fg;
    border.clear();
    border.rect(-width / 2, -height / 2, width, height).stroke({ color, width: 1 });
    text.style.fill = color;
  };

  repaint();

  container.eventMode = 'static';
  container.cursor = 'pointer';
  // Explicit hitArea so clicks land on the whole rect, not just the stroked edge.
  container.hitArea = new Rectangle(-width / 2, -height / 2, width, height);

  container.on('pointerover', () => {
    hovered = true;
    repaint();
  });
  container.on('pointerout', () => {
    hovered = false;
    repaint();
  });
  container.on('pointertap', onPress);

  const off = onThemeChange(repaint);
  container.on('destroyed', off);

  return container;
};

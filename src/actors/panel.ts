import { Container, type Text } from 'pixi.js';
import { createText } from '@actors/text';
import { GAP } from '@shared/layout';

export type PanelOptions = {
  // Multi-line rules blurb. First line usually 'RULES'.
  rules: string;
  // Optional key/value stats. Insertion order is preserved in the rendering.
  stats?: Record<string, string>;
};

export type Panel = Container & {
  setStat: (key: string, value: string) => void;
};

const TEXT_OPTS = { size: 11, letterSpacing: 2, anchor: [0, 0] as [number, number] };

export const createPanel = ({ rules, stats }: PanelOptions): Panel => {
  const container = new Container() as Panel;
  const rulesText = createText({ text: rules, ...TEXT_OPTS });
  container.addChild(rulesText);

  const values = new Map<string, string>(Object.entries(stats ?? {}));

  // Pad keys to the longest one so values line up in a single column.
  const formatStats = () => {
    if (values.size === 0) return '';
    const keys = Array.from(values.keys());
    const pad = Math.max(...keys.map((k) => k.length));
    return Array.from(values.entries())
      .map(([k, v]) => `${k.padEnd(pad)}  ${v}`)
      .join('\n');
  };

  let statsText: Text | null = null;
  if (values.size > 0) {
    statsText = createText({ text: formatStats(), ...TEXT_OPTS });
    statsText.position.set(0, rulesText.height + GAP);
    container.addChild(statsText);
  }

  container.setStat = (key, value) => {
    values.set(key, value);
    if (statsText) statsText.text = formatStats();
  };

  return container;
};

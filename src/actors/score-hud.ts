import { Container, type Text } from 'pixi.js';
import { createText } from '@actors/text';
import type { Grid } from '@actors/grid';

export type ScoreHudOptions = {
  // Optional key/value stats. First key renders inside grid top-left,
  // last key renders top-right. With one key only the left slot is used.
  stats?: Record<string, string>;
};

export type ScoreHud = Container & {
  setStat: (key: string, value: string) => void;
  attachToGrid: (grid: Grid) => void;
};

const TEXT_OPTS = { size: 11, letterSpacing: 2 };
const INSET = 10;

const formatEntry = (key: string, value: string) => `${key} ${value}`;

export const createScoreHud = ({ stats }: ScoreHudOptions = {}): ScoreHud => {
  const container = new Container() as ScoreHud;
  const values = new Map<string, string>(Object.entries(stats ?? {}));
  const keys = Array.from(values.keys());

  const leftKey = keys[0] ?? null;
  const rightKey = keys.length > 1 ? keys[keys.length - 1] : null;

  const leftText: Text | null =
    leftKey === null
      ? null
      : createText({
          ...TEXT_OPTS,
          text: formatEntry(leftKey, values.get(leftKey) ?? ''),
          anchor: [0, 0],
        });
  const rightText: Text | null =
    rightKey === null
      ? null
      : createText({
          ...TEXT_OPTS,
          text: formatEntry(rightKey, values.get(rightKey) ?? ''),
          anchor: [1, 0],
        });
  if (leftText) {
    container.addChild(leftText);
  }
  if (rightText) {
    container.addChild(rightText);
  }

  container.setStat = (key, value) => {
    values.set(key, value);
    if (key === leftKey && leftText) {
      leftText.text = formatEntry(key, value);
    } else if (key === rightKey && rightText) {
      rightText.text = formatEntry(key, value);
    }
  };

  container.attachToGrid = (grid) => {
    const reposition = () => {
      const { cellSize, originX, originY } = grid.getGeometry();
      if (cellSize <= 0) {
        return;
      }
      const top = originY + INSET;
      if (leftText) {
        leftText.position.set(originX + INSET, top);
      }
      if (rightText) {
        rightText.position.set(originX + grid.cols * cellSize - INSET, top);
      }
    };
    reposition();
    grid.on('geometry', reposition);
  };

  return container;
};

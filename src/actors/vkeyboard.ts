import { Container } from 'pixi.js';
import { createButton } from '@actors/button';

export type VKeyboardDirection = 'up' | 'down' | 'left' | 'right';

const KEY_SIZE = 56;
const ARROW_SIZE = 24;

export const VKEYBOARD_HEIGHT = KEY_SIZE * 2; // 112

export type VKeyboardOptions = {
  onPress: (direction: VKeyboardDirection) => void;
};

export const createVKeyboard = ({ onPress }: VKeyboardOptions): Container => {
  const container = new Container();
  const makeKey = (label: string, direction: VKeyboardDirection, column: number, row: number) => {
    const button = createButton({
      label,
      width: KEY_SIZE,
      height: KEY_SIZE,
      fontSize: ARROW_SIZE,
      onPress: () => onPress(direction),
    });
    button.position.set(KEY_SIZE * (column + 0.5), KEY_SIZE * (row + 0.5));
    return button;
  };
  container.addChild(
    makeKey('↑', 'up', 1, 0),
    makeKey('←', 'left', 0, 1),
    makeKey('↓', 'down', 1, 1),
    makeKey('→', 'right', 2, 1),
  );
  return container;
};

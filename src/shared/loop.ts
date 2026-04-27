import type { Ticker } from 'pixi.js';
import type { GameHandle } from '@shared/game';

export type LoopTick = {
  deltaMS: number;
  deltaTime: number;
};

export type LoopHooks = {
  update?: (tick: LoopTick) => void;
  layout?: (width: number, height: number) => void;
};

// Wires `update` (per-frame) and `layout` (per-resize) into a game.
// Returns a stop fn that removes both hooks.
export const createLoop = (
  { app, onResize }: GameHandle,
  { update, layout }: LoopHooks,
): (() => void) => {
  // Adapter so callers never see Pixi's Ticker type.
  const tickHandler = update
    ? (ticker: Ticker) => update({ deltaMS: ticker.deltaMS, deltaTime: ticker.deltaTime })
    : null;

  if (tickHandler) {
    app.ticker.add(tickHandler);
  }

  const unsubscribeResize = layout ? onResize(layout) : null;

  // Run layout once so initial dims are applied before the first frame.
  if (layout) {
    layout(app.screen.width, app.screen.height);
  }

  return () => {
    if (tickHandler) {
      app.ticker.remove(tickHandler);
    }
    unsubscribeResize?.();
  };
};

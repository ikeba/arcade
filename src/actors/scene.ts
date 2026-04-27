import type { Container, Ticker } from 'pixi.js';
import type { GameHandle } from '@shared/game';
import { createLoop, type LoopTick } from '@shared/loop';
import { computeGridLayout, GAP } from '@shared/layout';
import { isTouchUI, onPointerChange } from '@shared/touch';
import { createTitle } from '@actors/title';
import { DEFAULT_BUTTON_H, DEFAULT_BUTTON_W } from '@actors/button';
import { createGrid, type Grid } from '@actors/grid';
import { createPanel, type Panel } from '@actors/panel';
import { createVKeyboard, VKEYBOARD_HEIGHT, type VKeyboardDirection } from '@actors/vkeyboard';

export type GridSceneDeps = {
  grid: Grid;
  panel: Panel;
};

export type GridSceneOptions = {
  game: GameHandle;
  title: string;
  cols: number;
  rows: number;
  rules: string;
  stats?: Record<string, string>;
  // Either a static list, or a factory that gets grid/panel so button
  // callbacks can close over them without forward-declaration tricks.
  buttons: readonly Container[] | ((deps: GridSceneDeps) => readonly Container[]);
  // 0 hides grid lines (Snake); >0 draws them faint (Life).
  lineAlpha?: number;
  borderAlpha?: number;
  // Optional touch / narrow-viewport on-screen arrow keys. When provided, an
  // inverted-T vkeyboard appears between the grid and the action buttons on
  // touch devices or viewports < 600px.
  controls?: { onDirection: (direction: VKeyboardDirection) => void };
};

export type GridScene = GridSceneDeps & {
  // Per-frame callback. Returns unsubscribe.
  onTick: (cb: (tick: LoopTick) => void) => () => void;
};

// Lays out a canonical arcade screen: title (top-center), grid (left), panel
// (right of grid), buttons (bottom-center). All slack from flooring lands on
// the outer canvas edges (right, bottom) so inner gutters stay exact.
export const createGridScene = ({
  game,
  title: titleLabel,
  cols,
  rows,
  rules,
  stats,
  buttons,
  lineAlpha = 0,
  borderAlpha,
  controls,
}: GridSceneOptions): GridScene => {
  const { app } = game;

  const title = createTitle(titleLabel);
  const grid = createGrid({ cols, rows, lineAlpha, borderAlpha });
  const panel = createPanel({ rules, stats });
  const resolvedButtons = typeof buttons === 'function' ? buttons({ grid, panel }) : buttons;
  const vkeyboard = controls ? createVKeyboard({ onPress: controls.onDirection }) : null;
  app.stage.addChild(grid, title, panel, ...resolvedButtons);
  if (vkeyboard) {
    app.stage.addChild(vkeyboard);
    // Pointer-type flips (e.g. docking a mouse on a hybrid tablet) don't
    // fire ResizeObserver, so request a fresh layout pass directly.
    onPointerChange(() => app.queueResize());
  }

  createLoop(game, {
    layout: (w, h) => {
      const titleH = title.height;
      const showVkeyboard = vkeyboard !== null && isTouchUI(w);
      const vkeyboardReserve = showVkeyboard ? GAP + VKEYBOARD_HEIGHT : 0;
      const availW = w - GAP * 3 - panel.width;
      const availH = h - GAP * 4 - titleH - DEFAULT_BUTTON_H - vkeyboardReserve;
      const { cellSize, gridW, gridH } = computeGridLayout({ availW, availH, cols, rows });

      const originX = GAP;
      const originY = GAP + titleH + GAP;

      // Title and buttons are anchored to the grid's left edge so the whole
      // composition reads top-to-bottom on a single column.
      title.position.set(originX + title.width / 2, GAP + titleH / 2);
      panel.position.set(originX + gridW + GAP, originY);
      grid.setGeometry(cellSize, originX, originY);

      const contentH = Math.max(gridH, panel.height);
      let bottomY: number;
      if (showVkeyboard && vkeyboard) {
        const vkeyboardY = originY + contentH + GAP;
        vkeyboard.position.set(originX, vkeyboardY);
        bottomY = vkeyboardY + VKEYBOARD_HEIGHT + GAP + DEFAULT_BUTTON_H / 2;
      } else {
        bottomY = originY + contentH + GAP + DEFAULT_BUTTON_H / 2;
      }
      if (vkeyboard) {
        vkeyboard.visible = showVkeyboard;
      }
      const firstX = originX + DEFAULT_BUTTON_W / 2;
      resolvedButtons.forEach((btn, i) => {
        btn.position.set(firstX + i * (DEFAULT_BUTTON_W + GAP), bottomY);
      });
    },
  });

  const onTick = (cb: (tick: LoopTick) => void) => {
    const handler = (ticker: Ticker) =>
      cb({ deltaMS: ticker.deltaMS, deltaTime: ticker.deltaTime });
    app.ticker.add(handler);
    return () => {
      app.ticker.remove(handler);
    };
  };

  return { grid, panel, onTick };
};

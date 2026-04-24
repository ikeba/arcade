import type { Container, Ticker } from 'pixi.js';
import type { GameHandle } from '@shared/game';
import { createLoop, type LoopTick } from '@shared/loop';
import { computeGridLayout, GAP } from '@shared/layout';
import { createTitle } from '@actors/title';
import { DEFAULT_BUTTON_H, DEFAULT_BUTTON_W } from '@actors/button';
import { createGrid, type Grid } from '@actors/grid';
import { createPanel, type Panel } from '@actors/panel';

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
}: GridSceneOptions): GridScene => {
  const { app } = game;

  const title = createTitle(titleLabel);
  const grid = createGrid({ cols, rows, lineAlpha, borderAlpha });
  const panel = createPanel({ rules, stats });
  const resolvedButtons = typeof buttons === 'function' ? buttons({ grid, panel }) : buttons;
  app.stage.addChild(grid, title, panel, ...resolvedButtons);

  createLoop(game, {
    layout: (w, h) => {
      const titleH = title.height;
      const availW = w - GAP * 3 - panel.width;
      const availH = h - GAP * 4 - titleH - DEFAULT_BUTTON_H;
      const { cellSize, gridW, gridH } = computeGridLayout({ availW, availH, cols, rows });

      const originX = GAP;
      const originY = GAP + titleH + GAP;

      // Title and buttons are anchored to the grid's left edge so the whole
      // composition reads top-to-bottom on a single column.
      title.position.set(originX + title.width / 2, GAP + titleH / 2);
      panel.position.set(originX + gridW + GAP, originY);
      grid.setGeometry(cellSize, originX, originY);

      const bottomY = originY + gridH + GAP + DEFAULT_BUTTON_H / 2;
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

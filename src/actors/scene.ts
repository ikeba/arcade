import type { Container, Ticker } from 'pixi.js';
import type { GameHandle } from '@shared/game';
import { createLoop, type LoopTick } from '@shared/loop';
import { computeGridLayout, GAP } from '@shared/layout';
import { isTouchUI, onTouchUIChange } from '@shared/touch';
import { createTitle } from '@actors/title';
import { DEFAULT_BUTTON_H, DEFAULT_BUTTON_W } from '@actors/button';
import { createGrid, type Grid } from '@actors/grid';
import { createScoreHud, type ScoreHud } from '@actors/score-hud';
import { createText } from '@actors/text';
import { createVKeyboard, VKEYBOARD_HEIGHT, type VKeyboardDirection } from '@actors/vkeyboard';

export type GridSceneDeps = {
  grid: Grid;
  scoreHud: ScoreHud;
};

export type GridSceneOptions = {
  game: GameHandle;
  title: string;
  cols: number;
  rows: number;
  // Single-line rule blurb rendered below the grid.
  rules: string;
  // Optional key/value stats. First key shows top-left inside the grid,
  // second top-right. Updated live via scoreHud.setStat.
  stats?: Record<string, string>;
  // Either a static list, or a factory that gets grid/scoreHud so button
  // callbacks can close over them without forward-declaration tricks.
  buttons: readonly Container[] | ((deps: GridSceneDeps) => readonly Container[]);
  // 0 hides grid lines (Snake); >0 draws them faint (Life).
  lineAlpha?: number;
  borderAlpha?: number;
  // Optional touch / narrow-window on-screen arrow keys. When provided, an
  // inverted-T vkeyboard appears between the rules and the action buttons on
  // touch devices in windows narrower than 600px.
  controls?: { onDirection: (direction: VKeyboardDirection) => void };
};

export type GridScene = GridSceneDeps & {
  // Per-frame callback. Returns unsubscribe.
  onTick: (cb: (tick: LoopTick) => void) => () => void;
};

const RULES_OPTS = {
  size: 11,
  letterSpacing: 2,
  anchor: [0, 0] as [number, number],
};

// Lays out a canonical arcade screen: title (top, left-anchored to grid),
// grid (full width minus gutters) with the score HUD floating inside its
// top edge, single-line rules under the grid, optional vkeyboard, then a
// row of action buttons at the bottom.
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
  const scoreHud = createScoreHud({ stats });
  scoreHud.attachToGrid(grid);
  const rulesText = createText({ ...RULES_OPTS, text: rules });
  const resolvedButtons = typeof buttons === 'function' ? buttons({ grid, scoreHud }) : buttons;
  const vkeyboard = controls ? createVKeyboard({ onPress: controls.onDirection }) : null;
  // Order matters: HUD on top of grid cells, buttons after so hover hits them.
  app.stage.addChild(grid, scoreHud, title, rulesText, ...resolvedButtons);
  if (vkeyboard) {
    app.stage.addChild(vkeyboard);
    // Pointer-type flips and window resizes can cross the touch-UI threshold
    // without changing the canvas size (host iframe stays put), so request
    // a fresh layout pass directly.
    onTouchUIChange(() => app.queueResize());
  }

  createLoop(game, {
    layout: (w, h) => {
      const titleH = title.height;
      const showVkeyboard = vkeyboard !== null && isTouchUI();
      const vkeyboardReserve = showVkeyboard ? VKEYBOARD_HEIGHT + GAP : 0;

      // Measure rules at natural scale before deciding the grid size.
      rulesText.scale.set(1);
      const naturalRulesW = rulesText.width;
      const naturalRulesH = rulesText.height;

      const availW = w - GAP * 2;
      const availH =
        h - GAP * 5 - titleH - naturalRulesH - vkeyboardReserve - DEFAULT_BUTTON_H;
      const { cellSize, gridH } = computeGridLayout({ availW, availH, cols, rows });

      const originX = GAP;
      const originY = GAP + titleH + GAP;

      title.position.set(originX + title.width / 2, GAP + titleH / 2);
      grid.setGeometry(cellSize, originX, originY);

      // Shrink rules if they overflow the grid width on tight viewports.
      const gridW = cellSize * cols;
      if (naturalRulesW > gridW && gridW > 0) {
        rulesText.scale.set(gridW / naturalRulesW);
      }

      const rulesY = originY + gridH + GAP;
      rulesText.position.set(originX, rulesY);

      const afterRules = rulesY + rulesText.height + GAP;
      let bottomY: number;
      if (showVkeyboard && vkeyboard) {
        vkeyboard.position.set(originX, afterRules);
        bottomY = afterRules + VKEYBOARD_HEIGHT + GAP + DEFAULT_BUTTON_H / 2;
      } else {
        bottomY = afterRules + DEFAULT_BUTTON_H / 2;
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

  return { grid, scoreHud, onTick };
};

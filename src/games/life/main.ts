import '@shared/dev-frame';
import { Graphics } from 'pixi.js';
import { createGame } from '@shared/game';
import { randomInt } from '@shared/helpers/random';
import { createLoop } from '@shared/loop';
import { createButton, DEFAULT_BUTTON_H, DEFAULT_BUTTON_W } from '@actors/button';
import { createText } from '@actors/text';
import { createTitle } from '@actors/title';
import { getTokens, onThemeChange } from '@shared/theme';
import { GAP, GRID_ALPHA, GRID_COLS, GRID_ROWS, TICK_MS } from './config';
import { SEED_POOL, type Pattern } from './patterns';

// How many figures to stamp on seed.
const SEED_FIGURES_MIN = 3;
const SEED_FIGURES_MAX = 6;

const RULES_TEXT = [
  'RULES',
  '',
  'LIVE CELL WITH 2',
  'OR 3 NEIGHBORS',
  'LIVES.',
  '',
  'EMPTY CELL WITH',
  'EXACTLY 3',
  'NEIGHBORS IS BORN.',
  '',
  'ALL OTHERS DIE.',
].join('\n');

const container = document.getElementById('app');
if (!container) throw new Error('#app not found');

const game = await createGame(container);

let cells = new Uint8Array(GRID_COLS * GRID_ROWS);
let nextCells = new Uint8Array(GRID_COLS * GRID_ROWS);
let tickAccum = 0;
let cellSize = 0;
let originX = 0;
let originY = 0;

const idx = (x: number, y: number) => y * GRID_COLS + x;

// Stamps a pattern's live cells onto `cells` (OR, never erases), wrapping
// toroidally so a stamp near the edge just continues on the opposite side.
const stamp = (pattern: Pattern, col: number, row: number) => {
  const rows = pattern.length;
  const cols = pattern[0].length;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (pattern[y][x] === 1) {
        const cx = (col + x + GRID_COLS) % GRID_COLS;
        const cy = (row + y + GRID_ROWS) % GRID_ROWS;
        cells[idx(cx, cy)] = 1;
      }
    }
  }
};

// Clears then drops 3–6 randomly-chosen figures at random positions.
const seedWithFigures = () => {
  cells.fill(0);
  const count = SEED_FIGURES_MIN + randomInt(SEED_FIGURES_MAX - SEED_FIGURES_MIN + 1);
  for (let i = 0; i < count; i++) {
    const pattern = SEED_POOL[randomInt(SEED_POOL.length)];
    stamp(pattern, randomInt(GRID_COLS), randomInt(GRID_ROWS));
  }
};

// Conway step with toroidal wrap (edges connect to opposite edges).
const step = () => {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = (x + dx + GRID_COLS) % GRID_COLS;
          const ny = (y + dy + GRID_ROWS) % GRID_ROWS;
          n += cells[idx(nx, ny)];
        }
      }
      const alive = cells[idx(x, y)] === 1;
      nextCells[idx(x, y)] = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
    }
  }
  [cells, nextCells] = [nextCells, cells];
};

const title = createTitle("John Conway's Game of Life");
const rules = createText({
  text: RULES_TEXT,
  size: 11,
  letterSpacing: 2,
  anchor: [0, 0],
});
const gridGfx = new Graphics();
const cellsGfx = new Graphics();
game.app.stage.addChild(gridGfx, cellsGfx, title, rules);

const drawGrid = () => {
  gridGfx.clear();
  const w = cellSize * GRID_COLS;
  const h = cellSize * GRID_ROWS;
  for (let x = 0; x <= GRID_COLS; x++) {
    const px = originX + x * cellSize;
    gridGfx.moveTo(px, originY).lineTo(px, originY + h);
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    const py = originY + y * cellSize;
    gridGfx.moveTo(originX, py).lineTo(originX + w, py);
  }
  gridGfx.stroke({ color: getTokens().fg, width: 1, alpha: GRID_ALPHA });
};

const drawCells = () => {
  cellsGfx.clear();
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (cells[idx(x, y)] === 1) {
        cellsGfx.rect(originX + x * cellSize, originY + y * cellSize, cellSize, cellSize);
      }
    }
  }
  cellsGfx.fill({ color: getTokens().accent });
};

const restart = createButton({
  label: 'RESTART',
  onPress: () => {
    seedWithFigures();
    tickAccum = 0;
    drawCells();
  },
});

// Child→parent navigation. Standalone fallback goes to the menu so the button
// still does something when the page is opened directly.
const next = createButton({
  label: 'NEXT GAME',
  onPress: () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'next' }, '*');
    } else {
      window.location.href = '/';
    }
  },
});
game.app.stage.addChild(restart, next);

onThemeChange(() => {
  drawGrid();
  drawCells();
});

seedWithFigures();

createLoop(game, {
  update: ({ deltaMS }) => {
    tickAccum += deltaMS;
    let ticked = false;
    while (tickAccum >= TICK_MS) {
      step();
      tickAccum -= TICK_MS;
      ticked = true;
    }
    if (ticked) drawCells();
  },
  layout: (w, h) => {
    // GAP on every side of the grid: canvas-left, title-above, rules-right, restart-below.
    // Title/restart/rules are anchored to the grid so any slack from cellSize flooring
    // lands on the outer canvas edges (right, bottom), not in the inner gutters.
    const titleH = title.height;
    const availW = w - GAP * 3 - rules.width;
    const availH = h - GAP * 4 - titleH - DEFAULT_BUTTON_H;
    cellSize = Math.max(1, Math.floor(Math.min(availW / GRID_COLS, availH / GRID_ROWS)));
    originX = GAP;
    originY = GAP + titleH + GAP;
    const gridW = cellSize * GRID_COLS;
    const gridH = cellSize * GRID_ROWS;
    title.position.set(w / 2, GAP + titleH / 2);
    rules.position.set(originX + gridW + GAP, originY);
    drawGrid();
    drawCells();
    const pitch = DEFAULT_BUTTON_W + GAP;
    const bottomY = originY + gridH + GAP + DEFAULT_BUTTON_H / 2;
    restart.position.set(w / 2 - pitch / 2, bottomY);
    next.position.set(w / 2 + pitch / 2, bottomY);
  },
});

document.body.classList.add('ready');

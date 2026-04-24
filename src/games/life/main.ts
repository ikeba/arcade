import '@shared/dev-frame';
import { createGame } from '@shared/game';
import { createButton } from '@actors/button';
import { createGridScene } from '@actors/scene';
import { randomInt } from '@shared/helpers/random';
import { GRID_ALPHA, GRID_COLS, GRID_ROWS, TICK_MS } from './config';
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

const scene = createGridScene({
  game,
  title: "John Conway's Game of Life",
  cols: GRID_COLS,
  rows: GRID_ROWS,
  rules: RULES_TEXT,
  lineAlpha: GRID_ALPHA,
  buttons: ({ grid }) => [
    createButton({
      label: 'RESTART',
      onPress: () => {
        seedWithFigures();
        tickAccum = 0;
        grid.drawCells(cells);
      },
    }),
  ],
});

seedWithFigures();
scene.grid.drawCells(cells);

scene.onTick(({ deltaMS }) => {
  tickAccum += deltaMS;
  let ticked = false;
  while (tickAccum >= TICK_MS) {
    step();
    tickAccum -= TICK_MS;
    ticked = true;
  }
  if (ticked) scene.grid.drawCells(cells);
});

container.removeAttribute('data-pending');

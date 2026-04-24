import '@shared/host';
import '@shared/dev-frame';
import { createGame } from '@shared/game';
import { createButton } from '@actors/button';
import { createNextGameButton } from '@actors/next-game-button';
import { createGridScene } from '@actors/scene';
import {
  BEST_STORAGE_KEY,
  GRID_COLS,
  GRID_ROWS,
  TICK_MS_DECAY,
  TICK_MS_MIN,
  TICK_MS_START,
} from './config';
import { createInitialState, enqueueDir, step, type Dir, type SnakeState } from './state';

const RULES_TEXT = ['RULES', '', 'EAT THE SQUARE.', '', 'AVOID WALLS', 'AND YOURSELF.'].join('\n');

const KEY_TO_DIR: Record<string, Dir> = {
  ArrowUp: 'up',
  w: 'up',
  ArrowDown: 'down',
  s: 'down',
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
};

// Normalize single-char keys so caps-lock / shift still work.
const dirFromKey = (key: string): Dir | null => {
  const k = key.length === 1 ? key.toLowerCase() : key;
  return KEY_TO_DIR[k] ?? null;
};

const CFG = {
  cols: GRID_COLS,
  rows: GRID_ROWS,
  tickMsStart: TICK_MS_START,
  tickMsMin: TICK_MS_MIN,
  tickMsDecay: TICK_MS_DECAY,
};

const container = document.getElementById('app');
if (!container) throw new Error('#app not found');
const game = await createGame(container);

let best = Number(localStorage.getItem(BEST_STORAGE_KEY)) || 0;
let state: SnakeState = createInitialState(CFG);
let tickAccum = 0;

const scene = createGridScene({
  game,
  title: 'Snake',
  cols: GRID_COLS,
  rows: GRID_ROWS,
  rules: RULES_TEXT,
  stats: { SCORE: '0', BEST: String(best) },
  borderAlpha: 1,
  buttons: ({ grid, panel }) => [
    createButton({
      label: 'RESTART',
      onPress: () => {
        state = createInitialState(CFG);
        tickAccum = 0;
        panel.setStat('SCORE', '0');
        grid.drawRects(state.body, [state.food]);
      },
    }),
    createNextGameButton(),
  ],
});

const draw = () => scene.grid.drawRects(state.body, [state.food]);
draw();

scene.onTick(({ deltaMS }) => {
  if (!state.alive) return;
  tickAccum += deltaMS;
  // At most one step per frame — otherwise a tab switch or GC pause lets the
  // snake teleport several cells in one frame with no chance for input to
  // slot in between the steps. Excess is dropped, not queued.
  if (tickAccum < state.tickMs) {
    draw();
    return;
  }
  tickAccum = Math.min(tickAccum - state.tickMs, state.tickMs);
  step(state, CFG);
  if (!state.alive) {
    if (state.score > best) {
      best = state.score;
      localStorage.setItem(BEST_STORAGE_KEY, String(best));
      scene.panel.setStat('BEST', String(best));
    }
  } else {
    scene.panel.setStat('SCORE', String(state.score));
  }
  draw();
});

// Listener lives the lifetime of the page — no scene teardown path exists
// yet. When GameHandle.destroy starts being called, pair this with
// removeEventListener to avoid firing into a dead state.
window.addEventListener('keydown', (e) => {
  const dir = dirFromKey(e.key);
  if (!dir) return;
  enqueueDir(state, dir);
  // Arrow keys would otherwise scroll the iframe host.
  e.preventDefault();
});

container.removeAttribute('data-pending');

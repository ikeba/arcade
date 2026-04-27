import { Graphics } from 'pixi.js';
import { getGame, getTokens } from '@shared/host';
import '@shared/dev-frame';
import { track } from '@shared/track';
import { createGame } from '@shared/game';
import { createButton } from '@actors/button';
import { createNextGameButton } from '@actors/next-game-button';
import { createGridOverlay } from '@actors/grid-overlay';
import { createGridScene } from '@actors/scene';
import {
  ACCEL_PER_BRICK,
  BALL_RADIUS,
  BALL_SPEED_MAX,
  BALL_SPEED_START,
  BEST_STORAGE_KEY,
  BRICK_COL_LEFT,
  BRICK_COL_RIGHT,
  BRICK_ROW_BOTTOM,
  BRICK_ROW_TOP,
  GRID_COLS,
  GRID_ROWS,
  MAX_DT_MS,
  MAX_PADDLE_ANGLE,
  PADDLE_ROW,
  PADDLE_SPEED,
  PADDLE_TAP_STEP,
  PADDLE_WIDTH,
  PADDLE_WIDTH_MIN,
} from './config';
import {
  createInitialState,
  movePaddle,
  step,
  type ArkanoidConfig,
  type ArkanoidState,
} from './state';

const RULES_TEXT = ['BREAK ALL', 'BRICKS.', '', '← / →', 'MOVE.'].join('\n');

type PaddleDir = -1 | 1;

const dirFromKey = (key: string): PaddleDir | null => {
  const normalized = key.length === 1 ? key.toLowerCase() : key;
  if (normalized === 'ArrowLeft' || normalized === 'a') {
    return -1;
  }
  if (normalized === 'ArrowRight' || normalized === 'd') {
    return 1;
  }
  return null;
};

const CFG: ArkanoidConfig = {
  cols: GRID_COLS,
  rows: GRID_ROWS,
  paddleWidth: PADDLE_WIDTH,
  paddleWidthMin: PADDLE_WIDTH_MIN,
  paddleRow: PADDLE_ROW,
  brickRowTop: BRICK_ROW_TOP,
  brickRowBottom: BRICK_ROW_BOTTOM,
  brickColLeft: BRICK_COL_LEFT,
  brickColRight: BRICK_COL_RIGHT,
  ballRadius: BALL_RADIUS,
  ballSpeedStart: BALL_SPEED_START,
  ballSpeedMax: BALL_SPEED_MAX,
  accelPerBrick: ACCEL_PER_BRICK,
  maxPaddleAngle: MAX_PADDLE_ANGLE,
  maxDtMs: MAX_DT_MS,
};

const container = document.getElementById('app');
if (!container) {
  throw new Error('#app not found');
}
const game = await createGame(container);

let best = Number(localStorage.getItem(BEST_STORAGE_KEY)) || 0;
let state: ArkanoidState = createInitialState(CFG);
let endTracked = false;
const heldDirections = new Set<PaddleDir>();

const scene = createGridScene({
  game,
  title: 'Arkanoid',
  cols: GRID_COLS,
  rows: GRID_ROWS,
  rules: RULES_TEXT,
  stats: { SCORE: '0', BEST: String(best) },
  borderAlpha: 1,
  controls: {
    onDirection: (direction) => {
      if (direction === 'left') {
        movePaddle(state, -PADDLE_TAP_STEP, CFG);
      } else if (direction === 'right') {
        movePaddle(state, PADDLE_TAP_STEP, CFG);
      }
      // up/down vkeyboard taps wake the game but don't steer the paddle.
      else {
        state.started = true;
      }
    },
  },
  buttons: ({ panel }) => [
    createButton({
      label: 'RESTART',
      onPress: () => {
        track('arcade_game_restart', { game: getGame() });
        state = createInitialState(CFG);
        endTracked = false;
        heldDirections.clear();
        panel.setStat('SCORE', '0');
      },
    }),
    createNextGameButton(),
  ],
});

const paddleGfx = new Graphics();
const ballGfx = new Graphics();
game.app.stage.addChild(paddleGfx, ballGfx);

const idleHint = createGridOverlay({
  grid: scene.grid,
  text: 'PRESS ANY KEY',
  pulse: { amplitude: 0.3, periodMs: 1500 },
});

const gameOverHint = createGridOverlay({
  grid: scene.grid,
  text: 'GAME OVER',
  size: 24,
  letterSpacing: 8,
});

const winHint = createGridOverlay({
  grid: scene.grid,
  text: 'YOU WIN',
  size: 24,
  letterSpacing: 8,
});

game.app.stage.addChild(idleHint, gameOverHint, winHint);

const draw = () => {
  scene.grid.drawRects([], state.bricks);

  const { cellSize, originX, originY } = scene.grid.getGeometry();
  paddleGfx.clear();
  ballGfx.clear();
  if (cellSize <= 0) {
    return;
  }

  const accent = getTokens().accent;
  const halfWidth = state.paddleWidth / 2;
  paddleGfx
    .rect(
      originX + (state.paddleCenter - halfWidth) * cellSize,
      originY + CFG.paddleRow * cellSize,
      state.paddleWidth * cellSize,
      cellSize,
    )
    .fill({ color: accent });

  if (state.alive) {
    ballGfx
      .circle(
        originX + state.ball.x * cellSize,
        originY + state.ball.y * cellSize,
        CFG.ballRadius * cellSize,
      )
      .fill({ color: accent });
  }
};

draw();

scene.onTick(({ deltaMS }) => {
  idleHint.update(deltaMS, !state.started);
  gameOverHint.update(deltaMS, state.started && !state.alive);
  winHint.update(deltaMS, state.started && state.alive && state.won);
});

scene.onTick(({ deltaMS }) => {
  if (!state.started || !state.alive || state.won) {
    draw();
    return;
  }
  const dt = Math.min(deltaMS, CFG.maxDtMs) / 1000;
  if (heldDirections.has(-1)) {
    movePaddle(state, -PADDLE_SPEED * dt, CFG);
  }
  if (heldDirections.has(1)) {
    movePaddle(state, PADDLE_SPEED * dt, CFG);
  }
  step(state, deltaMS, CFG);
  if (!state.alive || state.won) {
    if (!endTracked) {
      track('arcade_game_over', { game: getGame(), score: state.score });
      endTracked = true;
      if (state.score > best) {
        best = state.score;
        localStorage.setItem(BEST_STORAGE_KEY, String(best));
        scene.panel.setStat('BEST', String(best));
      }
    }
  } else {
    scene.panel.setStat('SCORE', String(state.score));
  }
  draw();
});

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph']);

// Listeners live the lifetime of the page — no scene teardown path exists
// yet. Pair with removeEventListener once GameHandle.destroy lands.
window.addEventListener('keydown', (event) => {
  if (MODIFIER_KEYS.has(event.key)) {
    return;
  }
  // Any non-modifier keydown wakes the game, even non-paddle keys.
  state.started = true;
  const direction = dirFromKey(event.key);
  if (direction === null) {
    return;
  }
  heldDirections.add(direction);
  // Arrow keys would otherwise scroll the iframe host.
  event.preventDefault();
});

window.addEventListener('keyup', (event) => {
  const direction = dirFromKey(event.key);
  if (direction !== null) {
    heldDirections.delete(direction);
  }
});

container.removeAttribute('data-pending');

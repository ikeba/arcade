import { randomInt } from '@shared/helpers/random';

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Cell = { x: number; y: number };

export type SnakeConfig = {
  cols: number;
  rows: number;
  tickMsStart: number;
  tickMsMin: number;
  tickMsDecay: number;
};

export type SnakeState = {
  body: Cell[]; // body[0] is the head; last entry is the tail.
  dir: Dir;
  // FIFO of queued directional inputs, consumed one per tick. Tiny buffer
  // (max 2) so a fast right→up→left flick registers both turns instead of
  // collapsing to a 180° that gets dropped against the current heading.
  inputs: Dir[];
  food: Cell;
  alive: boolean;
  // False until the player's first directional input. The tick loop is
  // gated on this so the snake doesn't auto-march before the player is
  // looking at the iframe.
  started: boolean;
  score: number;
  tickMs: number;
};

const MAX_INPUTS = 2;

const DELTAS: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

// Rejection sample a free cell. Returns null when every cell is occupied —
// vanishingly unlikely in normal play, but without the guard the while loop
// would spin forever and freeze the tab.
const placeFood = (body: readonly Cell[], cols: number, rows: number): Cell | null => {
  if (body.length >= cols * rows) return null;
  const occupied = new Set(body.map((c) => c.y * cols + c.x));
  while (true) {
    const x = randomInt(cols);
    const y = randomInt(rows);
    if (!occupied.has(y * cols + x)) return { x, y };
  }
};

export const createInitialState = (cfg: SnakeConfig): SnakeState => {
  const cx = Math.floor(cfg.cols / 2);
  const cy = Math.floor(cfg.rows / 2);
  const body: Cell[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  // Start body is never full, so placeFood is guaranteed non-null here.
  const food = placeFood(body, cfg.cols, cfg.rows);
  if (food === null) throw new Error('snake: grid too small for initial food');
  return {
    body,
    dir: 'right',
    inputs: [],
    food,
    alive: true,
    started: false,
    score: 0,
    tickMs: cfg.tickMsStart,
  };
};

// Validate against the direction that will actually precede `dir` in the
// final queue — not the current heading. When the queue is full we replace
// the last slot (a spammed fourth keypress should override the third, not
// be silently dropped), so the predecessor is inputs[len-2] in that case.
export const enqueueDir = (state: SnakeState, dir: Dir): void => {
  // Any directional input wakes the game — even one that's rejected as a
  // direction (same-as-current or 180°). The player signaled intent.
  state.started = true;
  const full = state.inputs.length >= MAX_INPUTS;
  const refIdx = full ? state.inputs.length - 2 : state.inputs.length - 1;
  const prevDir = refIdx >= 0 ? state.inputs[refIdx] : state.dir;
  if (dir === prevDir || OPPOSITE[prevDir] === dir) return;
  if (full) state.inputs[state.inputs.length - 1] = dir;
  else state.inputs.push(dir);
};

export const step = (state: SnakeState, cfg: SnakeConfig): void => {
  if (!state.alive) return;
  const nextDir = state.inputs.shift();
  if (nextDir !== undefined) state.dir = nextDir;
  const d = DELTAS[state.dir];
  const head = state.body[0];
  const next: Cell = { x: head.x + d.x, y: head.y + d.y };

  if (next.x < 0 || next.x >= cfg.cols || next.y < 0 || next.y >= cfg.rows) {
    state.alive = false;
    return;
  }

  // When not eating, the tail vacates its cell this tick, so the head is
  // allowed to step into it (stop one short of body.length). When eating,
  // the tail stays put and every segment is a potential collision.
  const willEat = next.x === state.food.x && next.y === state.food.y;
  const limit = willEat ? state.body.length : state.body.length - 1;
  for (let i = 0; i < limit; i++) {
    const c = state.body[i];
    if (c.x === next.x && c.y === next.y) {
      state.alive = false;
      return;
    }
  }

  state.body.unshift(next);

  if (willEat) {
    state.score += 1;
    state.tickMs = Math.max(cfg.tickMsMin, state.tickMs - cfg.tickMsDecay);
    const nextFood = placeFood(state.body, cfg.cols, cfg.rows);
    if (nextFood === null) {
      // Every cell is now body — technically a win. Stop the loop; food stays
      // on its last known cell (now overlapped by the head) so render is a no-op.
      state.alive = false;
      return;
    }
    state.food = nextFood;
  } else {
    state.body.pop();
  }
};

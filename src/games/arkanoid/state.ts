export type Cell = { x: number; y: number };
export type Vec2 = { x: number; y: number };

export type ArkanoidConfig = {
  cols: number;
  rows: number;
  paddleWidth: number;
  paddleWidthMin: number;
  paddleRow: number;
  brickRowTop: number;
  brickRowBottom: number;
  brickColLeft: number;
  brickColRight: number;
  ballRadius: number;
  ballSpeedStart: number;
  ballSpeedMax: number;
  accelPerBrick: number;
  maxPaddleAngle: number;
  maxDtMs: number;
};

export type ArkanoidState = {
  // Float center of the ball, in cell units. (0, 0) = top-left of cell (0, 0).
  ball: Vec2;
  // Velocity in cells per second.
  ballV: Vec2;
  // Float center X of the paddle, in cell units. The paddle is anchored at
  // cfg.paddleRow vertically, with width state.paddleWidth horizontally.
  paddleCenter: number;
  // Current paddle width — interpolates linearly from cfg.paddleWidth down to
  // cfg.paddleWidthMin as bricks are broken.
  paddleWidth: number;
  // Alive bricks only — splice on hit.
  bricks: Cell[];
  // Snapshot of the initial brick count, kept so the lerp denominator stays
  // stable as state.bricks shrinks.
  bricksTotal: number;
  alive: boolean;
  won: boolean;
  // False until the player's first input. Tick loop is gated on this so the
  // ball doesn't auto-launch before the player is looking at the iframe.
  started: boolean;
  score: number;
};

const INITIAL_BALL_ANGLE = Math.PI / 6;

const clampPaddle = (state: ArkanoidState, cfg: ArkanoidConfig): void => {
  const half = state.paddleWidth / 2;
  state.paddleCenter = Math.max(half, Math.min(cfg.cols - half, state.paddleCenter));
};

export const createInitialState = (cfg: ArkanoidConfig): ArkanoidState => {
  const bricks: Cell[] = [];
  for (let y = cfg.brickRowTop; y < cfg.brickRowBottom; y++) {
    for (let x = cfg.brickColLeft; x < cfg.brickColRight; x++) {
      bricks.push({ x, y });
    }
  }
  const paddleCenter = cfg.cols / 2;
  return {
    ball: {
      x: paddleCenter,
      y: cfg.paddleRow - cfg.ballRadius * 1.1,
    },
    ballV: {
      x: cfg.ballSpeedStart * Math.sin(INITIAL_BALL_ANGLE),
      y: -cfg.ballSpeedStart * Math.cos(INITIAL_BALL_ANGLE),
    },
    paddleCenter,
    paddleWidth: cfg.paddleWidth,
    bricks,
    bricksTotal: bricks.length,
    alive: true,
    won: false,
    started: false,
    score: 0,
  };
};

// Move the paddle by `delta` cells.
export const movePaddle = (state: ArkanoidState, delta: number, cfg: ArkanoidConfig): void => {
  // Any paddle input wakes the game, even if the move clamps to a no-op.
  state.started = true;
  state.paddleCenter += delta;
  clampPaddle(state, cfg);
};

const updatePaddleWidth = (state: ArkanoidState, cfg: ArkanoidConfig): void => {
  if (state.bricksTotal === 0) {
    return;
  }
  const broken = state.bricksTotal - state.bricks.length;
  const progress = broken / state.bricksTotal;
  const target = cfg.paddleWidth - (cfg.paddleWidth - cfg.paddleWidthMin) * progress;
  state.paddleWidth = Math.max(cfg.paddleWidthMin, target);
  // Center may now violate the new half-width clamp at the edges.
  clampPaddle(state, cfg);
};

const rescale = (vector: Vec2, targetSpeed: number): void => {
  const current = Math.hypot(vector.x, vector.y);
  if (current === 0) {
    return;
  }
  const factor = targetSpeed / current;
  vector.x *= factor;
  vector.y *= factor;
};

// Single physics micro-step. Mutates state in place. Hot path, so kept
// imperative — declarative rewrites here would just allocate per frame.
const integrate = (state: ArkanoidState, dt: number, cfg: ArkanoidConfig): void => {
  const radius = cfg.ballRadius;
  let nextX = state.ball.x + state.ballV.x * dt;
  let nextY = state.ball.y + state.ballV.y * dt;

  if (nextX - radius < 0) {
    state.ballV.x = Math.abs(state.ballV.x);
    nextX = radius;
  } else if (nextX + radius > cfg.cols) {
    state.ballV.x = -Math.abs(state.ballV.x);
    nextX = cfg.cols - radius;
  }

  if (nextY - radius < 0) {
    state.ballV.y = Math.abs(state.ballV.y);
    nextY = radius;
  }

  if (nextY > cfg.rows) {
    state.alive = false;
    return;
  }

  if (state.ballV.y > 0) {
    const halfWidth = state.paddleWidth / 2;
    const paddleLeft = state.paddleCenter - halfWidth;
    const paddleRight = state.paddleCenter + halfWidth;
    const paddleTop = cfg.paddleRow;
    const paddleBottom = cfg.paddleRow + 1;
    if (
      nextX + radius > paddleLeft &&
      nextX - radius < paddleRight &&
      nextY + radius > paddleTop &&
      nextY - radius < paddleBottom
    ) {
      const rawOffset = (nextX - state.paddleCenter) / halfWidth;
      const offset = Math.max(-1, Math.min(1, rawOffset));
      const speed = Math.hypot(state.ballV.x, state.ballV.y);
      state.ballV.x = speed * Math.sin(offset * cfg.maxPaddleAngle);
      state.ballV.y = -Math.abs(speed * Math.cos(offset * cfg.maxPaddleAngle));
      nextY = paddleTop - radius;
    }
  }

  for (let i = 0; i < state.bricks.length; i++) {
    const brick = state.bricks[i];
    const brickRight = brick.x + 1;
    const brickBottom = brick.y + 1;
    if (
      nextX + radius <= brick.x ||
      nextX - radius >= brickRight ||
      nextY + radius <= brick.y ||
      nextY - radius >= brickBottom
    ) {
      continue;
    }
    const overlapX = Math.min(nextX + radius - brick.x, brickRight - (nextX - radius));
    const overlapY = Math.min(nextY + radius - brick.y, brickBottom - (nextY - radius));
    if (overlapX < overlapY) {
      state.ballV.x = -state.ballV.x;
    } else {
      state.ballV.y = -state.ballV.y;
    }
    state.bricks.splice(i, 1);
    state.score += 1;
    updatePaddleWidth(state, cfg);
    const newSpeed = Math.min(
      cfg.ballSpeedMax,
      Math.hypot(state.ballV.x, state.ballV.y) * (1 + cfg.accelPerBrick),
    );
    rescale(state.ballV, newSpeed);
    break;
  }

  state.ball.x = nextX;
  state.ball.y = nextY;
  if (state.bricks.length === 0) {
    state.won = true;
  }
};

export const step = (state: ArkanoidState, dtMs: number, cfg: ArkanoidConfig): void => {
  if (!state.alive || state.won) {
    return;
  }
  // Cap dt so a tab-switch frame can't teleport the ball through the field.
  const dt = Math.min(dtMs, cfg.maxDtMs) / 1000;
  // Sub-step so per-micro-step travel is at most half a cell — small enough
  // that AABB overlap with bricks reliably catches the first hit.
  const maxMove = Math.max(Math.abs(state.ballV.x), Math.abs(state.ballV.y)) * dt;
  const subSteps = Math.max(1, Math.ceil(maxMove / 0.5));
  const subDt = dt / subSteps;
  for (let i = 0; i < subSteps; i++) {
    if (!state.alive || state.won) {
      return;
    }
    integrate(state, subDt, cfg);
  }
};

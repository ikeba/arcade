export const GRID_COLS = 20;
export const GRID_ROWS = 16;

// Brick rect (inclusive): rows 2..5, cols 3..16 → 4 × 14 = 56 bricks.
export const BRICK_ROW_TOP = 2;
export const BRICK_ROW_BOTTOM = 6;
export const BRICK_COL_LEFT = 3;
export const BRICK_COL_RIGHT = 17;

// Paddle width is a float in cell units — shrinks linearly from PADDLE_WIDTH
// to PADDLE_WIDTH_MIN as bricks are broken. Rendered on its own Graphics
// layer so the in-between widths are sub-cell smooth.
export const PADDLE_WIDTH = 3;
export const PADDLE_WIDTH_MIN = 1;
export const PADDLE_ROW = GRID_ROWS - 2;

// Cells per second when an arrow key is held. Tap (non-repeating keydown)
// also kicks the paddle by 1 cell for instant feel.
export const PADDLE_SPEED = 18.0;
// Cells the paddle jumps per vkeyboard tap. Larger than 1 because touch taps
// are slower than holding a key on a keyboard.
export const PADDLE_TAP_STEP = 1.5;

export const BALL_RADIUS = 0.35;

// Cells per second. Tuned so the fresh ball already feels lively, not
// crawling — a brand-new player has to track the ball, not wait for it.
export const BALL_SPEED_START = 9.0;
export const BALL_SPEED_MAX = 20.0;
// Per brick: scale velocity by 1 + ACCEL_PER_BRICK. At 1.5%, the ball
// approaches the cap only near the very end of the field.
export const ACCEL_PER_BRICK = 0.015;

// Cap on the angle at which the ball flies off the paddle, measured from
// vertical. 60° leaves room to steer without ever sending the ball purely
// horizontal (which would let it loop along a row of bricks forever).
export const MAX_PADDLE_ANGLE = (60 * Math.PI) / 180;

export const MAX_DT_MS = 33;

export const BEST_STORAGE_KEY = 'arcade:arkanoid:best';

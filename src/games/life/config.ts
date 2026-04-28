// Twice snake/arkanoid (24 × 16) so the outer field rectangle matches them
// pixel-for-pixel while life keeps a finer-grained playfield (cellSize = half).
export const GRID_COLS = 48;
export const GRID_ROWS = 32;

// Milliseconds between generations.
export const TICK_MS = 200;

// Grid line opacity (0..1). Low so the grid reads as a backdrop, not a cage.
export const GRID_ALPHA = 0.1;

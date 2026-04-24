export const GRID_COLS = 24;
export const GRID_ROWS = 16;

// Starting tick — generous, so the first few seconds feel Nokia-slow.
export const TICK_MS_START = 180;
// Floor — any faster and input has no time to register.
export const TICK_MS_MIN = 60;
// Ms shaved off per food eaten
export const TICK_MS_DECAY = 4;

export const BEST_STORAGE_KEY = 'arcade:snake:best';

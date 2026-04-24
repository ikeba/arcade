export type Pattern = readonly (readonly number[])[];

export const GLIDER: Pattern = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 1],
];

export const BLINKER: Pattern = [[1, 1, 1]];

export const TOAD: Pattern = [
  [0, 1, 1, 1],
  [1, 1, 1, 0],
];

export const BEACON: Pattern = [
  [1, 1, 0, 0],
  [1, 1, 0, 0],
  [0, 0, 1, 1],
  [0, 0, 1, 1],
];

export const LWSS: Pattern = [
  [1, 0, 0, 1, 0],
  [0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 1],
];

export const SEED_POOL: readonly Pattern[] = [GLIDER, GLIDER, LWSS, TOAD, BEACON];

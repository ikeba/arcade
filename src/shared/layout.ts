// Pixels of breathing room between the grid and anything that sits next to it
// (canvas edge, title, side panel, button row). Shared so every grid-based
// game frames its playfield the same way.
export const GAP = 16;

export type GridLayoutInput = {
  availW: number;
  availH: number;
  cols: number;
  rows: number;
};

export type GridLayout = {
  cellSize: number;
  gridW: number;
  gridH: number;
};

// Largest integer `cellSize` that fits `cols x rows` into the available box.
// Floor — we'd rather have slack on the canvas edge than fractional pixels
// inside the grid. Clamp to 1 so degenerate boxes still render something.
export const computeGridLayout = ({ availW, availH, cols, rows }: GridLayoutInput): GridLayout => {
  const cellSize = Math.max(1, Math.floor(Math.min(availW / cols, availH / rows)));
  return { cellSize, gridW: cellSize * cols, gridH: cellSize * rows };
};

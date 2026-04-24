import { Container, Graphics } from 'pixi.js';
import { getTokens, onThemeChange } from '@shared/host';

export type GridCell = { x: number; y: number };

export type GridOptions = {
  cols: number;
  rows: number;
  // Alpha (0..1) for internal grid lines. 0 hides them (Snake default).
  lineAlpha?: number;
  // Alpha for the outer rectangle.
  borderAlpha?: number;
};

export type Grid = Container & {
  readonly cols: number;
  readonly rows: number;
  setGeometry: (cellSize: number, originX: number, originY: number) => void;
  // Life-style dense rendering — one byte per cell.
  drawCells: (cells: Uint8Array) => void;
  // Snake-style sparse rendering — explicit lists so games can mix solid and
  // outlined glyphs in a single frame (e.g. body segments + food).
  drawRects: (filled: readonly GridCell[], outlined?: readonly GridCell[]) => void;
};

type Paint =
  | { kind: 'cells'; data: Uint8Array }
  | { kind: 'rects'; filled: readonly GridCell[]; outlined: readonly GridCell[] };

export const createGrid = ({
  cols,
  rows,
  lineAlpha = 0,
  borderAlpha = lineAlpha,
}: GridOptions): Grid => {
  const container = new Container() as Grid;
  const linesGfx = new Graphics();
  const cellsGfx = new Graphics();
  container.addChild(linesGfx, cellsGfx);

  let cellSize = 0;
  let originX = 0;
  let originY = 0;
  let last: Paint | null = null;

  const redrawLines = () => {
    linesGfx.clear();
    if (cellSize <= 0) return;
    const w = cellSize * cols;
    const h = cellSize * rows;
    const { fg } = getTokens();
    if (lineAlpha > 0) {
      for (let x = 1; x < cols; x++) {
        const px = originX + x * cellSize;
        linesGfx.moveTo(px, originY).lineTo(px, originY + h);
      }
      for (let y = 1; y < rows; y++) {
        const py = originY + y * cellSize;
        linesGfx.moveTo(originX, py).lineTo(originX + w, py);
      }
      linesGfx.stroke({ color: fg, width: 1, alpha: lineAlpha });
    }
    if (borderAlpha > 0) {
      linesGfx.rect(originX, originY, w, h).stroke({ color: fg, width: 1, alpha: borderAlpha });
    }
  };

  const rectAt = ({ x, y }: GridCell, inset = 0) => {
    // Clamp so tiny cellSize doesn't collapse the rect to zero or negative.
    const safe = Math.min(inset, Math.max(0, (cellSize - 1) / 2));
    return cellsGfx.rect(
      originX + x * cellSize + safe,
      originY + y * cellSize + safe,
      cellSize - safe * 2,
      cellSize - safe * 2,
    );
  };

  const redrawCells = () => {
    cellsGfx.clear();
    if (!last || cellSize <= 0) return;
    const { accent } = getTokens();
    if (last.kind === 'cells') {
      const { data } = last;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (data[y * cols + x] === 1) rectAt({ x, y });
        }
      }
      cellsGfx.fill({ color: accent });
      return;
    }
    last.filled.forEach((c) => rectAt(c));
    cellsGfx.fill({ color: accent });
    // Inset the outline by 1px so the stroke sits inside the cell instead of
    // straddling the boundary with its neighbor.
    last.outlined.forEach((c) => rectAt(c, 1));
    cellsGfx.stroke({ color: accent, width: 1 });
  };

  Object.defineProperties(container, {
    cols: { value: cols, enumerable: true },
    rows: { value: rows, enumerable: true },
  });

  container.setGeometry = (size, ox, oy) => {
    cellSize = size;
    originX = ox;
    originY = oy;
    redrawLines();
    redrawCells();
  };

  container.drawCells = (data) => {
    last = { kind: 'cells', data };
    redrawCells();
  };

  container.drawRects = (filled, outlined = []) => {
    last = { kind: 'rects', filled, outlined };
    redrawCells();
  };

  const off = onThemeChange(() => {
    if (container.destroyed) return;
    redrawLines();
    redrawCells();
  });
  container.on('destroyed', off);

  return container;
};

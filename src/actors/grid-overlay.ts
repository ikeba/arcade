import { Container } from 'pixi.js';
import { createText } from '@actors/text';
import type { Grid } from '@actors/grid';

export type PulseConfig = {
  // Alpha sweeps between (1 - 2*amplitude) and 1.
  amplitude: number;
  periodMs: number;
};

export type GridOverlayOptions = {
  grid: Grid;
  text: string;
  // Cells from grid vertical center. Negative = above, positive = below.
  rowOffset?: number;
  size?: number;
  letterSpacing?: number;
  pulse?: PulseConfig;
};

export type GridOverlay = Container & {
  update: (deltaMS: number, visible: boolean) => void;
};

export const createGridOverlay = ({
  grid,
  text,
  rowOffset = 0,
  size = 20,
  letterSpacing = 6,
  pulse,
}: GridOverlayOptions): GridOverlay => {
  const container = new Container() as GridOverlay;
  container.addChild(createText({ text, size, letterSpacing }));

  const reposition = () => {
    const { cellSize, originX, originY } = grid.getGeometry();
    if (cellSize <= 0) {
      return;
    }
    container.position.set(
      originX + (grid.cols * cellSize) / 2,
      originY + (grid.rows / 2 + rowOffset) * cellSize,
    );
    // Shrink to fit when the rendered text is wider than the grid (mobile).
    // Inset by half a cell on each side so it never touches the border.
    container.scale.set(1);
    const maxWidth = grid.cols * cellSize - cellSize;
    const naturalWidth = container.width;
    if (naturalWidth > maxWidth) {
      container.scale.set(maxWidth / naturalWidth);
    }
  };
  reposition();
  grid.on('geometry', reposition);

  let elapsed = 0;
  container.update = (deltaMS, visible) => {
    container.visible = visible;
    if (!visible || !pulse) {
      return;
    }
    elapsed += deltaMS;
    container.alpha =
      1 - pulse.amplitude + pulse.amplitude * Math.sin((elapsed / pulse.periodMs) * Math.PI * 2);
  };

  return container;
};

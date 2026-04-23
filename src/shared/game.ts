import { Application, type ApplicationOptions } from 'pixi.js';
import { createEmitter } from '@shared/emitter';

export type GameHandle = {
  app: Application;
  onResize: (cb: (width: number, height: number) => void) => () => void;
  destroy: () => void;
};

// Boots a Pixi app inside `container` and keeps it sized to that element.
export const createGame = async (
  container: HTMLElement,
  options: Partial<ApplicationOptions> = {},
): Promise<GameHandle> => {
  // Pixi v8: construct then init async.
  const app = new Application();

  await app.init({
    preference: 'webgpu',
    resizeTo: container,
    autoDensity: true,
    resolution: globalThis.devicePixelRatio ?? 1,
    antialias: true,
    backgroundAlpha: 0,
    powerPreference: 'high-performance',
    hello: false,
    autoStart: true,
    sharedTicker: false,
    ...options,
  });

  // Put the canvas into the user's element.
  container.appendChild(app.canvas);

  // Fan-out for resize events so games can subscribe.
  const resize = createEmitter<[number, number]>();

  // Re-emit after Pixi has applied a new size.
  const emitResize = () => resize.emit(app.screen.width, app.screen.height);
  app.renderer.on('resize', emitResize);

  // Pixi's resizeTo only listens to window resize — ResizeObserver catches
  // element-level changes (flex reflow, iframe host, etc.). queueResize is
  // rAF-throttled, safe to spam.
  const observer = new ResizeObserver(() => app.queueResize());
  observer.observe(container);

  // Tear everything down in reverse init order.
  const destroy = () => {
    observer.disconnect();
    app.renderer.off('resize', emitResize);
    resize.clear();
    app.destroy(
      { removeView: true },
      { children: true, texture: true, textureSource: true, context: true },
    );
  };

  return { app, onResize: resize.on, destroy };
};

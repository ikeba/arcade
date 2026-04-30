const POINTER_COARSE = window.matchMedia('(pointer: coarse)');
const NARROW_PX = 600;

export const isTouchUI = (): boolean =>
  POINTER_COARSE.matches && window.innerWidth < NARROW_PX;

// Fires when either the pointer type or the window width crosses the touch-UI
// boundary. The check itself reads the live values, so callers re-evaluate
// on every fire and decide whether the answer actually changed.
export const onTouchUIChange = (callback: () => void): (() => void) => {
  POINTER_COARSE.addEventListener('change', callback);
  window.addEventListener('resize', callback);
  return () => {
    POINTER_COARSE.removeEventListener('change', callback);
    window.removeEventListener('resize', callback);
  };
};

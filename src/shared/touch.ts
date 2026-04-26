const POINTER_COARSE = window.matchMedia('(pointer: coarse)');
const NARROW_PX = 600;

export const isTouchUI = (viewportWidth: number): boolean =>
  POINTER_COARSE.matches || viewportWidth < NARROW_PX;

export const onPointerChange = (callback: () => void): (() => void) => {
  POINTER_COARSE.addEventListener('change', callback);
  return () => POINTER_COARSE.removeEventListener('change', callback);
};

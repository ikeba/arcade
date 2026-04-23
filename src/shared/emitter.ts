// Minimal pub/sub. `on` returns an unsubscribe fn.

export type Listener<Args extends unknown[]> = (...args: Args) => void;

export type Emitter<Args extends unknown[]> = {
  on: (listener: Listener<Args>) => () => void;
  emit: (...args: Args) => void;
  clear: () => void;
};

export const createEmitter = <Args extends unknown[]>(): Emitter<Args> => {
  const listeners = new Set<Listener<Args>>();

  return {
    // Register listener, get unsubscribe back.
    on: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    // Fire every listener with the given args.
    emit: (...args) => listeners.forEach((listener) => listener(...args)),
    // Drop all listeners at once (used on teardown).
    clear: () => listeners.clear(),
  };
};

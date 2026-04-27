import './version';
import { createEmitter } from './emitter';
import { defaultTokens, tokensFromQuery, type ThemeTokens } from './tokens';
import { track } from './track';

type ThemeMessage = {
  type: 'theme';
  payload: ThemeTokens;
};

const emitter = createEmitter<[ThemeTokens]>();
let current: ThemeTokens = { ...defaultTokens };

const GAME_PATH = /^\/games\/([^/]+)\/?$/;
const gameSlug = location.pathname.match(GAME_PATH)?.[1] ?? null;

export const getTokens = (): ThemeTokens => current;
export const onThemeChange = emitter.on;
export const getGame = (): string | null => gameSlug;

const applyTokens = (tokens: ThemeTokens): void => {
  current = { ...tokens };
  const root = document.documentElement;
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--fg', tokens.fg);
  emitter.emit(current);
};

const isThemeMessage = (data: unknown): data is ThemeMessage => {
  if (typeof data !== 'object' || data === null) return false;
  const maybe = data as { type?: unknown; payload?: unknown };
  if (maybe.type !== 'theme') return false;
  const payload = maybe.payload;
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as { accent?: unknown; fg?: unknown };
  return typeof p.accent === 'string' && typeof p.fg === 'string';
};

applyTokens(tokensFromQuery(window.location.search));

window.addEventListener('message', (event) => {
  if (!isThemeMessage(event.data)) return;
  applyTokens(event.data.payload);
});

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph']);

if (gameSlug !== null) {
  track('arcade_game_loaded', { game: gameSlug });

  // Capture-phase so a game's preventDefault on keydown can't swallow this
  // first-input signal. One-shot — modifier-only keypresses don't count.
  const onFirstInput = (event: Event): void => {
    if (event instanceof KeyboardEvent && MODIFIER_KEYS.has(event.key)) return;
    track('arcade_game_engaged', { game: gameSlug });
    window.removeEventListener('keydown', onFirstInput, true);
    window.removeEventListener('pointerdown', onFirstInput, true);
  };

  window.addEventListener('keydown', onFirstInput, true);
  window.addEventListener('pointerdown', onFirstInput, true);
}

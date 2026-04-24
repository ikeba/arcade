import { createEmitter } from './emitter';
import { defaultTokens, type ThemeTokens } from './tokens';

type ThemeMessage = {
  type: 'theme';
  payload: ThemeTokens;
};

const emitter = createEmitter<[ThemeTokens]>();
let current: ThemeTokens = { ...defaultTokens };

export const getTokens = (): ThemeTokens => current;
export const onThemeChange = emitter.on;

const applyTokens = (tokens: ThemeTokens): void => {
  current = { ...tokens };
  const root = document.documentElement;
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--bg', tokens.bg);
  root.style.setProperty('--fg', tokens.fg);
  emitter.emit(current);
};

const isThemeMessage = (data: unknown): data is ThemeMessage => {
  if (typeof data !== 'object' || data === null) return false;
  const maybe = data as { type?: unknown; payload?: unknown };
  if (maybe.type !== 'theme') return false;
  const payload = maybe.payload;
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as { accent?: unknown; bg?: unknown; fg?: unknown };
  return typeof p.accent === 'string' && typeof p.bg === 'string' && typeof p.fg === 'string';
};

applyTokens(defaultTokens);

window.addEventListener('message', (event) => {
  if (!isThemeMessage(event.data)) return;
  applyTokens(event.data.payload);
});

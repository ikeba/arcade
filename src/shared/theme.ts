import { defaultTokens, type ThemeTokens } from './tokens';

type ThemeMessage = {
  type: 'theme';
  payload: ThemeTokens;
};

function applyTokens(tokens: ThemeTokens): void {
  const root = document.documentElement;
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--bg', tokens.bg);
  root.style.setProperty('--fg', tokens.fg);
}

function isThemeMessage(data: unknown): data is ThemeMessage {
  if (typeof data !== 'object' || data === null) return false;
  const maybe = data as { type?: unknown; payload?: unknown };
  if (maybe.type !== 'theme') return false;
  const payload = maybe.payload;
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as { accent?: unknown; bg?: unknown; fg?: unknown };
  return typeof p.accent === 'string' && typeof p.bg === 'string' && typeof p.fg === 'string';
}

applyTokens(defaultTokens);

window.addEventListener('message', (event) => {
  if (!isThemeMessage(event.data)) return;
  applyTokens(event.data.payload);
});

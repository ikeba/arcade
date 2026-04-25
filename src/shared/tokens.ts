export type ThemeTokens = {
  accent: string;
  fg: string;
};

export const defaultTokens: ThemeTokens = {
  accent: '#FFD60A',
  fg: '#D3D1C7',
};

const HEX = /^[0-9a-fA-F]{6}$/;

const normalize = (raw: string | null): string | null =>
  raw && HEX.test(raw) ? `#${raw.toUpperCase()}` : null;

// Reads accent/fg from a URL query string (no `#` prefix), validates each
// independently, and falls back per-field to defaultTokens. Lets the host
// hand the palette in on first paint without a postMessage round-trip.
export const tokensFromQuery = (search: string): ThemeTokens => {
  const q = new URLSearchParams(search);
  return {
    accent: normalize(q.get('accent')) ?? defaultTokens.accent,
    fg: normalize(q.get('fg')) ?? defaultTokens.fg,
  };
};

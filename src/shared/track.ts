type TrackMessage = {
  type: 'track';
  name: string;
  properties: Record<string, unknown>;
};

export const track = (name: string, properties: Record<string, unknown> = {}): void => {
  if (window.parent === window) return;
  const message: TrackMessage = { type: 'track', name, properties };
  window.parent.postMessage(message, '*');
};

// In DEV, tag the body so CSS can box #app into a fixed iframe-like frame.
// Skip when iframed so the page behaves like production and shrinks with the host.
if (import.meta.env.DEV && window === window.top) {
  document.body.classList.add('dev');
}

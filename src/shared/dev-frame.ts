// In DEV, tag the body so CSS can box #app into a fixed iframe-like frame.
if (import.meta.env.DEV) {
  document.body.classList.add('dev');
}

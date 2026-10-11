// Compatibility loader for cached pages using the previous mount point.
const root = document.querySelector('#cmdtreemap-root');
if (root) {
  root.dataset.devkit = '';
  root.dataset.defaultView = 'map';
  if (root.dataset.source) root.dataset.catalog = root.dataset.source;
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('../assets/css/devkit.css', import.meta.url).href;
  document.head.append(style);
  await import('../assets/js/devkit.js');
}

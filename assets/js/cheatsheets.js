// Compatibility loader for cached pages using the previous cheatsheet markup.
const root = document.querySelector('.cheatsheet-browser');
if (root) {
  root.dataset.devkit = '';
  root.dataset.defaultView = 'sheet';
  if (root.dataset.source) root.dataset.cheatsheets = root.dataset.source;
  root.classList.remove('cheatsheet-browser');
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('../css/devkit.css', import.meta.url).href;
  document.head.append(style);
  await import('./devkit.js');
}

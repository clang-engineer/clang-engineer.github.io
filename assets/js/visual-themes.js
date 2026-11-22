(() => {
  const key = 'clang-engineer-visual-theme';
  const themes = ['default', 'minimal', 'terminal'];
  const names = { default: 'Default', minimal: 'Minimal', terminal: 'Terminal' };
  let saved = 'default';
  try { saved = localStorage.getItem(key) || saved; } catch (_) {}
  let current = themes.includes(saved) ? saved : 'default';
  document.documentElement.dataset.visualTheme = current;

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('visual-theme-toggle');
    if (!button) return;
    const sync = () => {
      const label = '디자인 테마: ' + names[current] + ' (클릭하여 변경)';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.dataset.theme = current;
    };
    sync();
    button.addEventListener('click', () => {
      current = themes[(themes.indexOf(current) + 1) % themes.length];
      document.documentElement.dataset.visualTheme = current;
      try { localStorage.setItem(key, current); } catch (_) {}
      sync();
    });
  });
})();

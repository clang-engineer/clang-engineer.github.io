(() => {
  const key = 'clang-engineer-visual-theme';
  const themes = ['default', 'minimal', 'terminal'];
  const names = { default: 'Default', minimal: 'Minimal', terminal: 'Terminal' };
  let saved = 'default';
  try { saved = localStorage.getItem(key) || saved; } catch (_) {}
  let current = themes.includes(saved) ? saved : 'default';
  document.documentElement.dataset.visualTheme = current;

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('mode-toggle');
    const menu = document.getElementById('visual-theme-menu');
    if (!button || !menu) return;
    const options = [...menu.querySelectorAll('[data-theme-option]')];
    const close = () => { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); };
    const sync = () => {
      button.setAttribute('title', '테마: ' + names[current]);
      options.forEach(option => {
        const selected = option.dataset.themeOption === current;
        option.setAttribute('aria-pressed', String(selected));
        option.querySelector('span').textContent = selected ? '✓' : '';
      });
    };
    sync();
    button.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      button.setAttribute('aria-expanded', String(!menu.hidden));
      if (!menu.hidden) (menu.querySelector('.dropdown-item.active') || options.find(option => option.dataset.themeOption === current))?.focus();
    });
    options.forEach(option => option.addEventListener('click', () => {
      current = option.dataset.themeOption;
      document.documentElement.dataset.visualTheme = current;
      try { localStorage.setItem(key, current); } catch (_) {}
      sync();
      close();
      button.focus();
    }));
    menu.addEventListener('click', event => {
      if (event.target.closest('[data-theme-mode]')) { close(); button.focus(); }
    });
    document.addEventListener('pointerdown', event => {
      if (!menu.hidden && !event.target.closest('.visual-theme-picker')) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) { close(); button.focus(); }
    });
  });
})();

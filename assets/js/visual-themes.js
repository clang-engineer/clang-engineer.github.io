(() => {
  const key = 'clang-engineer-visual-theme';
  const allowed = ['default', 'minimal', 'terminal'];
  let saved = 'default';
  try { saved = localStorage.getItem(key) || saved; } catch (_) {}
  const current = allowed.includes(saved) ? saved : 'default';
  document.documentElement.dataset.visualTheme = current;
  document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('footer[aria-label="Site Info"]');
    if (!footer || footer.querySelector('.visual-theme-control')) return;
    const label = document.createElement('label');
    label.className = 'visual-theme-control';
    label.textContent = '디자인 ';
    const select = document.createElement('select');
    select.setAttribute('aria-label', '블로그 디자인 테마');
    for (const [value, name] of [['default','Default'],['minimal','Minimal'],['terminal','Terminal']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = name;
      select.append(option);
    }
    select.value = current;
    select.addEventListener('change', () => {
      document.documentElement.dataset.visualTheme = select.value;
      try { localStorage.setItem(key, select.value); } catch (_) {}
    });
    label.append(select);
    footer.append(label);
  });
})();
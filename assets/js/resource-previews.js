(() => {
  const root = document.getElementById('resource-previews');
  if (!root) return;

  const data = JSON.parse(document.getElementById('rp-data').textContent);
  const themes = new Map(data.themes.map((theme) => [theme.id, theme]));
  const families = new Map(data.theme_families.map((family) => [family.id, family]));
  const fonts = new Map(data.fonts.map((font) => [font.id, font]));
  const dialog = root.querySelector('#rp-detail');
  const preview = root.querySelector('#rp-detail-preview');
  const title = root.querySelector('#rp-detail-title');
  const meta = root.querySelector('#rp-detail-meta');
  const description = root.querySelector('#rp-detail-description');
  const focus = root.querySelector('#rp-detail-focus');
  const status = root.querySelector('#rp-detail-font-status');
  const links = root.querySelector('#rp-detail-links');
  root.querySelectorAll('.rp-theme-icon').forEach((icon) => {
    icon.addEventListener('error', () => icon.remove());
    if (icon.complete && !icon.naturalWidth) icon.remove();
  });
  let returnFocus;
  let currentFont;

  const loadFace = async (family) => {
    try {
      return (await document.fonts.load(`400 16px "${family}"`, 'Aa 0O 1Il 가 나')).length > 0;
    } catch {
      return false;
    }
  };
  const fontLoads = new Map(root.querySelector('[data-rp-choice-font]') ? data.fonts.map((font) => [font.id, loadFace(font.family)]) : []);
  const fontStatusText = async (font) => {
    const [loaded, koreanLoaded] = await Promise.all([
      fontLoads.get(font.id), font.supports_korean ? true : fontLoads.get('noto-sans-kr')
    ]);
    if (!loaded) return `${font.name} 로드 실패 · 대체 글꼴로 표시 중입니다.`;
    if (!koreanLoaded) return '한글 대체 글꼴 로드 실패';
    return font.supports_korean ? '' : '한글: Noto Sans KR';
  };
  root.querySelectorAll('[data-rp-font-status]').forEach(async (node) => {
    const text = await fontStatusText(fonts.get(node.dataset.rpFontStatus));
    node.textContent = text;
    node.hidden = !text.includes('실패');
  });

  function addLink(label, url) {
    const link = document.createElement('a');
    link.textContent = label;
    link.href = url;
    links.append(link);
  }

  root.querySelectorAll('[data-rp-choice-theme], [data-rp-choice-font]').forEach((button) => {
    button.addEventListener('click', () => {
      const theme = themes.get(button.dataset.rpChoiceTheme);
      const font = fonts.get(button.dataset.rpChoiceFont);
      const item = theme || font;
      returnFocus = button;
      currentFont = font?.id;
      title.textContent = item.name;
      preview.replaceChildren(button.querySelector('.rp-gallery-editor, .rp-font-paper').cloneNode(true));
      links.replaceChildren();
      focus.hidden = !font;
      focus.textContent = font ? `볼 차이: ${font.focus}` : '';
      status.hidden = !font;
      status.textContent = font ? '폰트를 불러오는 중입니다.' : '';
      if (theme) {
        meta.textContent = `${theme.variant} · ${theme.appearance === 'light' ? '라이트' : '다크'}`;
        description.textContent = families.get(theme.family).description;
        addLink('공식 테마', theme.url);
        addLink('팔레트 출처', theme.source);
      } else {
        meta.textContent = `${font.category} · ${font.supports_korean ? '한글 지원' : '한글 대체 글꼴'}`;
        if (font.group === 'code') meta.textContent += ` · ${font.ligatures ? '코드 합자 지원' : '코드 합자 없음'}`;
        description.textContent = font.description;
        addLink('폰트 정보', font.url);
        addLink('공식 특징 설명', font.source);
        fontStatusText(font).then((text) => {
          if (!dialog.open || currentFont !== font.id) return;
          status.textContent = text;
          status.hidden = !text;
        });
      }
      dialog.showModal();
      dialog.scrollTop = 0;
    });
    button.disabled = false;
  });

  dialog.addEventListener('close', () => {
    currentFont = null;
    returnFocus?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  root.querySelectorAll('[data-rp-only]').forEach((element) => { element.hidden = false; });
})();

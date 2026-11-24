(() => {
  const root = document.getElementById('resource-previews');
  if (!root) return;

  const data = JSON.parse(document.getElementById('rp-data').textContent);
  const themes = new Map(data.themes.map((theme) => [theme.id, theme]));
  const fonts = new Map(data.fonts.map((font) => [font.id, font]));
  const candidates = [null, null];
  const shared = { theme: data.themes[0].id, font: data.fonts[0].id };
  const dragType = 'application/x-resource-preview';
  let galleryKind = 'theme';
  let mode = 'theme';
  let activePanel = 0;
  let panelOpen = false;
  let returnFocus;

  const dock = root.querySelector('#rp-comparison-panel');
  const openButton = root.querySelector('#rp-open-comparison');
  const closeButton = root.querySelector('#rp-panel-close');
  const modeSelect = root.querySelector('#rp-comparison-mode');
  const sample = root.querySelector('#rp-sample');
  const size = root.querySelector('#rp-size');
  const sizeValue = root.querySelector('#rp-size-value');
  const sharedFont = root.querySelector('#rp-shared-font');
  const sharedTheme = root.querySelector('#rp-shared-theme');
  const sharedControls = root.querySelector('.rp-shared-controls');
  const sharedFontControl = root.querySelector('#rp-shared-font-control');
  const sharedThemeControl = root.querySelector('#rp-shared-theme-control');
  const modeHelp = root.querySelector('#rp-mode-help');
  const status = root.querySelector('#rp-selection-status');
  const galleryButtons = root.querySelectorAll('[data-rp-gallery]');
  const gallerySections = root.querySelectorAll('[data-rp-gallery-kind]');
  const targetButtons = root.querySelectorAll('[data-rp-target]');
  const dropZones = root.querySelectorAll('[data-rp-drop]');
  const choices = root.querySelectorAll('[data-rp-choice-theme], [data-rp-choice-font]');
  const samples = root.querySelectorAll('.rp-sample-text');
  const colorNames = {
    background: '배경', foreground: '글자', red: '빨강', green: '초록',
    yellow: '노랑', blue: '파랑', purple: '보라', cyan: '청록'
  };
  const modeDescriptions = {
    theme: '같은 폰트로 색감을 비교합니다. 견본을 A/B에 끌어놓거나, A/B 선택 후 견본을 누르세요.',
    font: '같은 배경으로 폰트를 비교합니다. 견본을 A/B에 끌어놓거나, A/B 선택 후 견본을 누르세요.',
    combination: '테마와 폰트를 각각 조합합니다. 끌어놓은 종류만 바꾸고 다른 설정은 유지합니다.'
  };
  const loadFace = async (family) => {
    try {
      return (await document.fonts.load(`400 16px "${family}"`, 'Aa 0O 1Il 가 나')).length > 0;
    } catch {
      return false;
    }
  };
  const fontLoads = new Map(data.fonts.map((font) => [font.id, loadFace(font.family)]));
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

  const panels = [...root.querySelectorAll('[data-rp-panel]')].map((panel, index) => {
    const themeSelect = panel.querySelector('[data-rp-theme]');
    const fontSelect = panel.querySelector('[data-rp-font]');
    const themeControl = panel.querySelector('[data-rp-theme-control]');
    const fontControl = panel.querySelector('[data-rp-font-control]');
    const panelName = panel.querySelector('[data-rp-panel-name]');
    const content = panel.querySelector('[data-rp-slot-content]');
    const empty = panel.querySelector('[data-rp-empty]');
    const clear = panel.querySelector('[data-rp-clear]');
    const preview = panel.querySelector('.rp-preview');
    const palette = panel.querySelector('.rp-palette');
    const themeLink = panel.querySelector('[data-rp-theme-link]');
    const sourceLink = panel.querySelector('[data-rp-source-link]');
    const fontLink = panel.querySelector('[data-rp-font-link]');
    const fontStatus = panel.querySelector('.rp-font-status');
    let lastTheme;
    let lastFont;
    let fontRequest = 0;

    themeSelect.addEventListener('change', () => {
      candidates[index].theme = themeSelect.value;
      render();
    });
    fontSelect.addEventListener('change', () => {
      candidates[index].font = fontSelect.value;
      render();
    });
    clear.addEventListener('click', () => {
      candidates[index] = null;
      activePanel = index;
      render();
      root.querySelector(`[data-rp-target="${index}"]`).focus({ preventScroll: true });
      status.textContent = `${index === 0 ? 'A' : 'B'}를 비웠습니다.`;
    });

    return () => {
      const candidate = candidates[index];
      panel.dataset.active = String(index === activePanel);
      content.hidden = !candidate;
      empty.hidden = !!candidate;
      clear.hidden = !candidate;
      if (!candidate) {
        panelName.textContent = '비어 있음';
        ++fontRequest;
        lastTheme = lastFont = null;
        return;
      }
      const themeId = mode === 'font' ? shared.theme : candidate.theme;
      const fontId = mode === 'theme' ? shared.font : candidate.font;
      const theme = themes.get(themeId);
      const font = fonts.get(fontId);
      themeControl.hidden = mode !== 'combination';
      fontControl.hidden = mode !== 'combination';
      themeSelect.value = themeId;
      fontSelect.value = fontId;
      panelName.textContent = mode === 'theme' ? theme.name
        : mode === 'font' ? font.name : `${theme.name} · ${font.name}`;

      if (themeId !== lastTheme) {
        Object.entries(theme.palette).forEach(([name, value]) => {
          preview.style.setProperty(`--rp-${name}`, value);
        });
        preview.style.colorScheme = theme.appearance;
        themeLink.href = theme.url;
        themeLink.title = `${theme.name} 공식 사이트`;
        sourceLink.href = theme.source;
        palette.replaceChildren(...Object.entries(colorNames).map(([name, label]) => {
          const value = theme.palette[name];
          const swatch = document.createElement('div');
          swatch.className = 'rp-swatch';
          swatch.title = `${label}: ${value}`;
          const color = document.createElement('span');
          color.className = 'rp-swatch-color';
          color.style.backgroundColor = value;
          color.setAttribute('aria-hidden', 'true');
          const hex = document.createElement('code');
          hex.textContent = value;
          swatch.append(color, hex);
          return swatch;
        }));
        lastTheme = themeId;
      }
      if (fontId !== lastFont) {
        const request = ++fontRequest;
        const fallback = font.supports_korean ? 'sans-serif' : '"Noto Sans KR", monospace';
        preview.style.setProperty('--rp-font', `"${font.family}", ${fallback}`);
        fontLink.href = font.url;
        fontLink.title = `${font.name} 폰트 정보`;
        fontStatus.hidden = false;
        fontStatus.textContent = '폰트를 불러오는 중입니다.';
        fontStatusText(font).then((text) => {
          if (request !== fontRequest) return;
          fontStatus.textContent = text;
          fontStatus.hidden = !text;
        });
        lastFont = fontId;
      }
    };
  });

  function render() {
    root.dataset.gallery = galleryKind;
    document.body.classList.toggle('rp-panel-open', panelOpen);
    dock.hidden = !panelOpen;
    dock.dataset.mode = mode;
    openButton.setAttribute('aria-expanded', String(panelOpen));
    galleryButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.rpGallery === galleryKind));
    });
    gallerySections.forEach((section) => {
      section.hidden = section.dataset.rpGalleryKind !== galleryKind;
    });
    modeSelect.value = mode;
    modeHelp.textContent = modeDescriptions[mode];
    targetButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.rpTarget) === activePanel));
    });
    sharedControls.hidden = mode === 'combination';
    sharedFontControl.hidden = mode !== 'theme';
    sharedThemeControl.hidden = mode !== 'font';
    sharedFont.value = shared.font;
    sharedTheme.value = shared.theme;
    panels.forEach((update) => update());
  }

  function assign(index, item) {
    const candidate = candidates[index] || { ...shared };
    candidate[item.kind] = item.id;
    candidates[index] = candidate;
    if (index === 0 || !candidates[0]) shared[item.kind] = item.id;
    if (mode !== 'combination') mode = item.kind;
    activePanel = index;
    panelOpen = true;
    render();
    const name = (item.kind === 'theme' ? themes : fonts).get(item.id).name;
    status.textContent = `${index === 0 ? 'A' : 'B'}에 ${name} 적용.`;
  }
  function closePanel() {
    panelOpen = false;
    render();
    dropZones.forEach((zone) => zone.classList.remove('rp-drop-active'));
    if (returnFocus?.getClientRects().length) returnFocus.focus({ preventScroll: true });
    else openButton.focus({ preventScroll: true });
  }
  openButton.addEventListener('click', () => {
    if (panelOpen) return closePanel();
    returnFocus = openButton;
    panelOpen = true;
    render();
    closeButton.focus({ preventScroll: true });
  });
  closeButton.addEventListener('click', closePanel);
  dock.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
    }
  });
  galleryButtons.forEach((button) => button.addEventListener('click', () => {
    galleryKind = button.dataset.rpGallery;
    render();
  }));
  choices.forEach((button) => {
    const item = button.hasAttribute('data-rp-choice-theme')
      ? { kind: 'theme', id: button.dataset.rpChoiceTheme }
      : { kind: 'font', id: button.dataset.rpChoiceFont };
    button.addEventListener('click', () => {
      returnFocus = button;
      assign(activePanel, item);
    });
    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData(dragType, JSON.stringify(item));
      event.dataTransfer.effectAllowed = 'copy';
      returnFocus = button;
      panelOpen = true;
      render();
    });
    button.addEventListener('dragend', () => {
      dropZones.forEach((zone) => zone.classList.remove('rp-drop-active'));
    });
  });
  dropZones.forEach((zone) => {
    zone.addEventListener('dragover', (event) => {
      if (!Array.from(event.dataTransfer.types).includes(dragType)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      zone.classList.add('rp-drop-active');
    });
    zone.addEventListener('dragleave', (event) => {
      if (!zone.contains(event.relatedTarget)) zone.classList.remove('rp-drop-active');
    });
    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      zone.classList.remove('rp-drop-active');
      let item;
      try { item = JSON.parse(event.dataTransfer.getData(dragType)); } catch { return; }
      const collection = item?.kind === 'theme' ? themes : item?.kind === 'font' ? fonts : null;
      if (!collection?.has(item.id)) return;
      assign(Number(zone.dataset.rpDrop), item);
    });
  });
  modeSelect.addEventListener('change', () => { mode = modeSelect.value; render(); });
  targetButtons.forEach((button) => button.addEventListener('click', () => {
    activePanel = Number(button.dataset.rpTarget);
    render();
  }));
  sharedFont.addEventListener('change', () => { shared.font = sharedFont.value; render(); });
  sharedTheme.addEventListener('change', () => { shared.theme = sharedTheme.value; render(); });
  const updateSample = () => samples.forEach((text) => { text.textContent = sample.value; });
  const updateSize = () => {
    root.style.setProperty('--rp-size', `${size.value}px`);
    sizeValue.value = `${size.value}px`;
  };
  sample.addEventListener('input', updateSample);
  size.addEventListener('input', updateSize);
  root.querySelectorAll('[data-rp-only]').forEach((element) => { element.hidden = false; });
  choices.forEach((button) => { button.disabled = false; button.draggable = true; });
  updateSample();
  updateSize();
  render();
})();

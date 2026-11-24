(() => {
  const root = document.getElementById('resource-previews');
  if (!root) return;

  const data = JSON.parse(document.getElementById('rp-data').textContent);
  const themes = new Map(data.themes.map((theme) => [theme.id, theme]));
  const fonts = new Map(data.fonts.map((font) => [font.id, font]));
  const candidates = [
    { theme: data.themes[0].id, font: data.fonts[0].id },
    { theme: data.themes[1].id, font: data.fonts[1].id }
  ];
  const shared = { ...candidates[0] };
  let galleryKind = 'theme';
  let mode = 'theme';
  let comparing = false;
  let activePanel = 0;
  let pendingPick = null;
  let returnFocus = null;

  const dialog = root.querySelector('#rp-dialog');
  const dialogTitle = root.querySelector('#rp-detail-title');
  const pickNotice = root.querySelector('#rp-pick-notice');
  const pickStatus = root.querySelector('#rp-pick-status');
  const pickCompare = root.querySelector('#rp-pick-compare');
  const stopCompare = root.querySelector('#rp-stop-compare');
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
  const selectionStatus = root.querySelector('#rp-selection-status');
  const galleryButtons = root.querySelectorAll('[data-rp-gallery]');
  const gallerySections = root.querySelectorAll('[data-rp-gallery-kind]');
  const targetButtons = root.querySelectorAll('[data-rp-target]');
  const targets = root.querySelector('.rp-dialog-targets');
  const choices = root.querySelectorAll('[data-rp-choice-theme], [data-rp-choice-font]');
  const samples = root.querySelectorAll('.rp-sample-text');
  const colorNames = {
    background: '배경',
    foreground: '글자',
    red: '빨강',
    green: '초록',
    yellow: '노랑',
    blue: '파랑',
    purple: '보라',
    cyan: '청록'
  };
  const modeDescriptions = {
    theme: '같은 폰트와 문장으로 색감만 비교합니다.',
    font: '같은 배경과 문장으로 글자 모양만 비교합니다.',
    combination: '테마와 폰트를 각각 골라 조합을 비교합니다.'
  };

  const loadFace = async (family) => {
    try {
      const faces = await document.fonts.load(`400 16px "${family}"`, 'Aa 0O 1Il 가 나');
      return faces.length > 0;
    } catch {
      return false;
    }
  };
  const fontLoads = new Map(data.fonts.map((font) => [font.id, loadFace(font.family)]));

  const fontStatusText = async (font) => {
    const [loaded, koreanLoaded] = await Promise.all([
      fontLoads.get(font.id),
      font.supports_korean ? true : fontLoads.get('noto-sans-kr')
    ]);
    if (!loaded) return `${font.name} 로드 실패 · 대체 글꼴로 표시 중입니다.`;
    if (!koreanLoaded) return '한글 대체 글꼴 로드 실패';
    return font.supports_korean ? '' : '한글: Noto Sans KR';
  };

  root.querySelectorAll('[data-rp-font-status]').forEach(async (status) => {
    const text = await fontStatusText(fonts.get(status.dataset.rpFontStatus));
    status.textContent = text;
    status.hidden = !text.includes('실패');
  });

  const panels = [...root.querySelectorAll('[data-rp-panel]')].map((panel, index) => {
    const themeSelect = panel.querySelector('[data-rp-theme]');
    const fontSelect = panel.querySelector('[data-rp-font]');
    const themeControl = panel.querySelector('[data-rp-theme-control]');
    const fontControl = panel.querySelector('[data-rp-font-control]');
    const panelName = panel.querySelector('[data-rp-panel-name]');
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
      if (!comparing) shared.theme = themeSelect.value;
      render();
    });
    fontSelect.addEventListener('change', () => {
      candidates[index].font = fontSelect.value;
      if (!comparing) shared.font = fontSelect.value;
      render();
    });

    return () => {
      const themeId = mode === 'font' ? shared.theme : candidates[index].theme;
      const fontId = mode === 'theme' ? shared.font : candidates[index].font;
      const theme = themes.get(themeId);
      const font = fonts.get(fontId);
      panel.hidden = index === 1 && !comparing;
      panel.dataset.active = String(index === activePanel);
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
    galleryButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.rpGallery === galleryKind));
    });
    gallerySections.forEach((section) => {
      section.hidden = section.dataset.rpGalleryKind !== galleryKind;
    });
    pickNotice.hidden = !pendingPick;
    if (pendingPick) {
      pickStatus.textContent = `비교할 ${galleryKind === 'theme' ? '테마' : '폰트'}를 골라주세요.`;
    }
    dialog.dataset.comparing = String(comparing);
    dialog.dataset.mode = mode;
    modeSelect.value = mode;
    modeHelp.textContent = comparing ? modeDescriptions[mode]
      : '폰트와 크기, 문장은 미리보기 설정에서 바꿀 수 있습니다.';
    pickCompare.textContent = comparing ? '비교 항목 바꾸기'
      : `다른 ${mode === 'theme' ? '테마' : mode === 'font' ? '폰트' : '조합'}와 비교`;
    stopCompare.hidden = !comparing;
    targets.hidden = !comparing;
    targetButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.rpTarget) === activePanel));
    });
    sharedControls.hidden = mode === 'combination';
    sharedFontControl.hidden = mode !== 'theme';
    sharedThemeControl.hidden = mode !== 'font';
    sharedFont.value = shared.font;
    sharedTheme.value = shared.theme;
    panels.forEach((update) => update());
    const names = [...root.querySelectorAll('[data-rp-panel-name]')].map((node) => node.textContent);
    dialogTitle.textContent = comparing ? `${names[0]} · ${names[1]}` : names[0];
  }

  galleryButtons.forEach((button) => button.addEventListener('click', () => {
    galleryKind = button.dataset.rpGallery;
    if (pendingPick && mode !== 'combination') mode = galleryKind;
    render();
  }));

  choices.forEach((button) => button.addEventListener('click', () => {
    const isTheme = button.hasAttribute('data-rp-choice-theme');
    const kind = isTheme ? 'theme' : 'font';
    const id = isTheme ? button.dataset.rpChoiceTheme : button.dataset.rpChoiceFont;
    if (pendingPick) {
      if (pendingPick.fresh) candidates[1] = { ...candidates[0] };
      candidates[1][kind] = id;
      comparing = true;
      activePanel = 1;
      pendingPick = null;
    } else {
      candidates[0][kind] = id;
      shared.theme = candidates[0].theme;
      shared.font = candidates[0].font;
      mode = kind;
      comparing = false;
      activePanel = 0;
    }
    returnFocus = button;
    render();
    dialog.showModal();
    selectionStatus.textContent = `${(isTheme ? themes : fonts).get(id).name} 미리보기`;
  }));

  pickCompare.addEventListener('click', () => {
    const kind = mode === 'combination' ? galleryKind : mode;
    pendingPick = { fresh: !comparing, mode, gallery: galleryKind };
    galleryKind = kind;
    render();
    dialog.close();
  });
  root.querySelector('#rp-pick-cancel').addEventListener('click', () => {
    mode = pendingPick.mode;
    galleryKind = pendingPick.gallery;
    pendingPick = null;
    render();
    dialog.showModal();
  });
  stopCompare.addEventListener('click', () => {
    comparing = false;
    activePanel = 0;
    render();
  });
  root.querySelector('#rp-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    if (pendingPick) {
      pickStatus.focus();
    } else if (returnFocus?.getClientRects().length) {
      returnFocus.focus({ preventScroll: true });
    } else {
      [...galleryButtons].find((button) => button.dataset.rpGallery === galleryKind).focus();
    }
  });
  modeSelect.addEventListener('change', () => {
    mode = modeSelect.value;
    render();
  });
  targetButtons.forEach((button) => button.addEventListener('click', () => {
    activePanel = Number(button.dataset.rpTarget);
    render();
  }));
  sharedFont.addEventListener('change', () => {
    shared.font = sharedFont.value;
    if (!comparing) candidates[0].font = sharedFont.value;
    render();
  });
  sharedTheme.addEventListener('change', () => {
    shared.theme = sharedTheme.value;
    if (!comparing) candidates[0].theme = sharedTheme.value;
    render();
  });
  const updateSample = () => samples.forEach((text) => { text.textContent = sample.value; });
  const updateSize = () => {
    root.style.setProperty('--rp-size', `${size.value}px`);
    sizeValue.value = `${size.value}px`;
  };
  sample.addEventListener('input', updateSample);
  size.addEventListener('input', updateSize);
  root.querySelectorAll('[data-rp-only]').forEach((element) => { element.hidden = false; });
  choices.forEach((button) => { button.disabled = false; });
  updateSample();
  updateSize();
  render();
})();

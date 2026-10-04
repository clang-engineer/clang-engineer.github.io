const browser = document.querySelector('.cheatsheet-browser');
const catalogStatus = document.querySelector('#cheatsheet-search-status');
const retry = document.querySelector('#cheatsheet-retry');
const searchInput = document.querySelector('#cheatsheet-search-input');

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function linkHtml(link) {
  if (!link?.url) return '';
  const url = new URL(link.url);
  if (!['https:', 'http:'].includes(url.protocol)) return '';
  return '<li><a href="' + escapeHtml(url.href) + '">' + escapeHtml(link.label || url.hostname) + '</a></li>';
}

function renderCatalog(data) {
  if (!Array.isArray(data.groups)) throw new Error('Invalid catalog');
  const slugs = new Set();
  let tabs = '<button type="button" class="cheatsheet-category-tab is-active" data-category-filter="all" role="tab" aria-selected="true">전체</button>';
  let list = '';
  let details = '';
  for (const [index, group] of data.groups.entries()) {
    if (typeof group.title !== 'string' || !Array.isArray(group.items)) throw new Error('Invalid group');
    const key = 'category-' + index;
    tabs += '<button type="button" class="cheatsheet-category-tab" data-category-filter="' + key + '" role="tab" aria-selected="false">' + escapeHtml(group.title) + '</button>';
    let rows = '';
    for (const item of group.items) {
      if (!/^[a-z0-9_-]+$/.test(item.slug) || slugs.has(item.slug) || typeof item.name !== 'string') throw new Error('Invalid tool');
      slugs.add(item.slug);
      const slug = item.slug;
      rows += '<li data-tool-row data-name="' + escapeHtml(item.name.toLowerCase()) + '" data-desc="' + escapeHtml((item.desc || '').toLowerCase()) + '" data-category="' + escapeHtml(group.title.toLowerCase()) + '" data-category-key="' + key + '"><button type="button" class="cheatsheet-tool" data-tool="' + slug + '" aria-controls="cheatsheet-detail-' + slug + '"><span class="cheatsheet-tool__name">' + escapeHtml(item.name) + '</span><span class="cheatsheet-tool__desc">' + escapeHtml(item.desc) + '</span></button></li>';
      const official = (item.official || []).map(linkHtml).join('');
      const custom = linkHtml(item.custom);
      details += '<article id="cheatsheet-detail-' + slug + '" class="cheatsheet-detail" data-detail="' + slug + '" data-category="' + escapeHtml(group.title) + '" data-category-key="' + key + '" hidden><header><p class="cheatsheet-detail__category">' + escapeHtml(group.title) + '</p><h2>' + escapeHtml(item.name) + '</h2><p>' + escapeHtml(item.desc) + '</p></header>' +
        '<section class="cheatsheet-resource" aria-labelledby="' + slug + '-tldr"><h3 id="' + slug + '-tldr">빠른 예시</h3>' + (item.tldr ? '<div class="tldr-box" data-tldr="' + escapeHtml(item.tldr) + '"><p class="tldr-status">불러오는 중...</p></div>' : '<p class="tldr-status">tldr 없음</p>') + '</section>' +
        '<section class="cheatsheet-resource" aria-labelledby="' + slug + '-official"><h3 id="' + slug + '-official">공식 문서</h3>' + (official ? '<ul>' + official + '</ul>' : '<p class="cheatsheet-muted">공식 문서 링크 없음</p>') + '</section>' +
        '<section class="cheatsheet-resource" aria-labelledby="' + slug + '-custom"><h3 id="' + slug + '-custom">내 치트시트</h3>' + (custom ? '<ul>' + custom + '</ul>' : '<p class="cheatsheet-muted">devkit 문서 없음</p>') + '</section></article>';
    }
    list += '<details class="cheatsheet-category" data-category-list data-category-key="' + key + '" open><summary><span>' + escapeHtml(group.title) + '</span><span class="cheatsheet-category__count">' + group.items.length + '</span></summary><ul>' + rows + '</ul></details>';
  }
  browser.querySelector('.cheatsheet-category-tabs').innerHTML = tabs;
  browser.querySelector('.cheatsheet-list').innerHTML = list + '<p class="cheatsheet-no-results" hidden>찾는 도구가 없습니다.</p>';
  browser.querySelector('.cheatsheet-details').innerHTML = '<p class="cheatsheet-detail-placeholder" id="cheatsheet-detail-placeholder">도구를 선택하면 여기에 설명과 참고 링크가 표시됩니다.</p>' + details;
}

function initializeBrowser() {
   const pageBase = window.location.pathname;
    const searchInput = document.querySelector('#cheatsheet-search-input');
    const status = document.querySelector('#cheatsheet-search-status');
    const noResults = document.querySelector('.cheatsheet-no-results');
    const rows = Array.from(document.querySelectorAll('[data-tool-row]'));
    const categories = Array.from(document.querySelectorAll('[data-category-list]'));
    const categoryTabs = Array.from(document.querySelectorAll('[data-category-filter]'));
    const tools = Array.from(document.querySelectorAll('[data-tool]'));
    let activeCategory = 'all';
    const details = Array.from(document.querySelectorAll('[data-detail]'));
    const placeholder = document.querySelector('#cheatsheet-detail-placeholder');
    const loaded = new Set();
    const tldrBaseUrl = 'https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/';

    function escapeHtml(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function renderTldr(markdown) {
      const lines = markdown.split('\n');
      const title = lines.find((line) => line.startsWith('# '));
      const description = lines.find((line) => line.startsWith('> '));
      const examples = [];

      for (let index = 0; index < lines.length; index += 1) {
        if (lines[index].startsWith('- ')) {
          const command = lines.slice(index + 1).find((line) => line.startsWith('`'));
          if (command) {
            examples.push({
              text: lines[index].replace(/^- /, '').trim(),
              command: command.replace(/^`|`$/g, '').trim()
            });
          }
        }
        if (examples.length >= 4) break;
      }

      if (examples.length === 0) return '<p class="tldr-status">tldr 예시 없음</p>';
      const heading = title ? '<p class="tldr-title">' + escapeHtml(title.replace(/^# /, '')) + '</p>' : '';
      const desc = description ? '<p class="tldr-desc">' + escapeHtml(description.replace(/^> /, '')) + '</p>' : '';
      const items = examples.map((example) => '<li><p>' + escapeHtml(example.text) + '</p><pre><code>' + escapeHtml(example.command) + '</code></pre></li>').join('');
      return heading + desc + '<ol class="tldr-examples">' + items + '</ol>';
    }

    async function loadTldr(box) {
      const page = box.dataset.tldr;
      if (!page || loaded.has(page)) return;
      loaded.add(page);
      box.innerHTML = '<p class="tldr-status">불러오는 중...</p>';

      try {
        const response = await fetch(tldrBaseUrl + page + '.md', { cache: 'force-cache' });
        if (response.status === 404) {
          box.innerHTML = '<p class="tldr-status">tldr 없음</p>';
          return;
        }
        if (!response.ok) throw new Error('tldr request failed');
        box.innerHTML = renderTldr(await response.text());
      } catch (error) {
        loaded.delete(page);
        box.innerHTML = '<p class="tldr-status">불러오기 실패 — 도구를 다시 선택하면 재시도합니다.</p>';
      }
    }

    function selectCategory(category) {
      activeCategory = category;
      categoryTabs.forEach((tab) => {
        const selected = tab.dataset.categoryFilter === category;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      details.forEach((item) => { item.hidden = true; });
      tools.forEach((item) => {
        item.classList.remove('is-selected');
        item.setAttribute('aria-pressed', 'false');
      });
      placeholder.hidden = false;
      filterTools();
    }

    function selectTool(slug, updateHash) {
      const detail = details.find((item) => item.dataset.detail === slug);
      const button = tools.find((item) => item.dataset.tool === slug);
      if (!detail || !button) return;

      if (activeCategory !== detail.dataset.categoryKey) {
        selectCategory(detail.dataset.categoryKey);
      }
      details.forEach((item) => { item.hidden = item !== detail; });
      tools.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      placeholder.hidden = true;
      if (updateHash) history.replaceState(null, '', pageBase + '#' + slug);
      const box = detail.querySelector('[data-tldr]');
      if (box) loadTldr(box);
      if (window.matchMedia('(max-width: 767px)').matches) {
        detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function filterTools() {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;

      rows.forEach((row) => {
        const categoryMatch = activeCategory === 'all' || row.dataset.categoryKey === activeCategory;
        const queryMatch = !query || [row.dataset.name, row.dataset.desc, row.dataset.category].some((value) => value.includes(query));
        const match = categoryMatch && queryMatch;
        row.hidden = !match;
        if (match) visible += 1;
      });

      categories.forEach((category) => {
        const categoryMatch = activeCategory === 'all' || category.dataset.categoryKey === activeCategory;
        const visibleRows = category.querySelectorAll('[data-tool-row]:not([hidden])').length;
        category.hidden = !categoryMatch || visibleRows === 0;
        if (categoryMatch && (query || activeCategory !== 'all')) category.open = true;
      });

      noResults.hidden = visible !== 0;
      status.textContent = query ? visible + '개 도구' : '';
    }

    categoryTabs.forEach((tab) => {
      tab.addEventListener('click', () => selectCategory(tab.dataset.categoryFilter));
    });
    tools.forEach((button) => {
      button.addEventListener('click', () => selectTool(button.dataset.tool, true));
    });
    searchInput.addEventListener('input', filterTools);

    const hash = window.location.hash.slice(1);
    if (hash && tools.some((item) => item.dataset.tool === hash)) {
      selectTool(hash, false);
    } else if (categoryTabs[1]) {
      selectCategory(categoryTabs[1].dataset.categoryFilter);
    } else {
      filterTools();
    }

}

async function loadCatalog() {
  retry.hidden = true;
  searchInput.disabled = true;
  catalogStatus.textContent = '목록을 불러오는 중...';
  try {
    const response = await fetch(browser.dataset.source, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Catalog request failed');
    renderCatalog(await response.json());
    searchInput.disabled = false;
    initializeBrowser();
  } catch {
    catalogStatus.textContent = '목록을 불러오지 못했습니다. 다시 시도해 주세요.';
    retry.hidden = false;
  }
}
retry.addEventListener('click', loadCatalog);
loadCatalog();

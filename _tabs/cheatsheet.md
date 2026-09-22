---
layout: page
icon: fas fa-book-open
order: 2
title: 치트시트
---

<p class="cheatsheet-intro">자주 쓰는 도구를 찾고, tldr·공식 문서·내 치트시트로 이어지는 참고 링크를 모아 둔 페이지다. 도구 간 관계는 <a href="{{ '/cmdtreemap/' | relative_url }}">cmdtreemap</a>에서 탐색할 수 있다.</p>

<section class="cheatsheet-browser" aria-label="치트시트 탐색">
  <label class="cheatsheet-search" for="cheatsheet-search-input">
    <span>도구 검색</span>
    <input id="cheatsheet-search-input" type="search" placeholder="git, tmux, 검색..." autocomplete="off">
  </label>

  <p class="cheatsheet-search-status" id="cheatsheet-search-status" role="status"></p>

  <div class="cheatsheet-category-tabs" role="tablist" aria-label="카테고리">
    <button type="button" class="cheatsheet-category-tab is-active" data-category-filter="all" role="tab" aria-selected="true">전체</button>
    {% for group in site.data.cheatsheets.groups %}
      <button type="button" class="cheatsheet-category-tab" data-category-filter="{{ group.title | slugify }}" role="tab" aria-selected="false">{{ group.title }}</button>
    {% endfor %}
  </div>

  <div class="cheatsheet-layout">
    <nav class="cheatsheet-list" aria-label="도구 목록">
      {% for group in site.data.cheatsheets.groups %}
        <details class="cheatsheet-category" data-category-list data-category-key="{{ group.title | slugify }}" open>
          <summary>
            <span>{{ group.title }}</span>
            <span class="cheatsheet-category__count">{{ group.items.size }}</span>
          </summary>
          <ul>
            {% for item in group.items %}
              <li data-tool-row data-name="{{ item.name | downcase }}" data-desc="{{ item.desc | downcase }}" data-category="{{ group.title | downcase }}" data-category-key="{{ group.title | slugify }}">
                <button type="button" class="cheatsheet-tool" data-tool="{{ item.slug }}" aria-controls="cheatsheet-detail-{{ item.slug }}">
                  <span class="cheatsheet-tool__name">{{ item.name }}</span>
                  <span class="cheatsheet-tool__desc">{{ item.desc }}</span>
                </button>
              </li>
            {% endfor %}
          </ul>
        </details>
      {% endfor %}
      <p class="cheatsheet-no-results" hidden>찾는 도구가 없습니다.</p>
    </nav>

    <section class="cheatsheet-details" aria-label="선택한 도구" aria-live="polite">
      <p class="cheatsheet-detail-placeholder" id="cheatsheet-detail-placeholder">도구를 선택하면 여기에 설명과 참고 링크가 표시됩니다.</p>

      {% for group in site.data.cheatsheets.groups %}
        {% for item in group.items %}
          <article id="cheatsheet-detail-{{ item.slug }}" class="cheatsheet-detail" data-detail="{{ item.slug }}" data-category="{{ group.title }}" data-category-key="{{ group.title | slugify }}" hidden>
            <header>
              <p class="cheatsheet-detail__category">{{ group.title }}</p>
              <h2>{{ item.name }}</h2>
              <p>{{ item.desc }}</p>
            </header>

            <section class="cheatsheet-resource" aria-labelledby="{{ item.slug }}-tldr">
              <h3 id="{{ item.slug }}-tldr">빠른 예시</h3>
              {% if item.tldr %}
                <div class="tldr-box" data-tldr="{{ item.tldr }}">
                  <p class="tldr-status">불러오는 중...</p>
                </div>
              {% else %}
                <p class="tldr-status">tldr 없음</p>
              {% endif %}
            </section>

            <section class="cheatsheet-resource" aria-labelledby="{{ item.slug }}-official">
              <h3 id="{{ item.slug }}-official">공식 문서</h3>
              {% if item.official and item.official.size > 0 %}
                <ul>
                  {% for link in item.official %}
                    <li><a href="{{ link.url }}">{{ link.label }}</a></li>
                  {% endfor %}
                </ul>
              {% else %}
                <p class="cheatsheet-muted">공식 문서 링크 없음</p>
              {% endif %}
            </section>

            <section class="cheatsheet-resource" aria-labelledby="{{ item.slug }}-custom">
              <h3 id="{{ item.slug }}-custom">내 치트시트</h3>
              {% if item.custom %}
                <ul>
                  <li><a href="{{ item.custom.url }}">{{ item.custom.label }}</a></li>
                </ul>
              {% else %}
                <p class="cheatsheet-muted">devkit 문서 없음</p>
              {% endif %}
            </section>
          </article>
        {% endfor %}
      {% endfor %}
    </section>
  </div>
</section>

<script>
  (function () {
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
      return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
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
        box.innerHTML = '<p class="tldr-status">불러오기 실패</p>';
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
      const detail = document.querySelector('[data-detail="' + slug + '"]');
      const button = document.querySelector('[data-tool="' + slug + '"]');
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
    if (hash && document.querySelector('[data-tool="' + hash + '"]')) {
      selectTool(hash, false);
    } else if (categoryTabs[1]) {
      selectCategory(categoryTabs[1].dataset.categoryFilter);
    } else {
      filterTools();
    }
  })();
</script>

---
layout: page
icon: fas fa-book-open
order: 2
title: 치트시트
---

<div class="cheatsheet-intro">
  <p>자주 쓰는 도구의 참고 링크를 한곳에 모았다.</p>
  <p>기본 예시는 tldr, 최신 정보는 공식 문서, 내 작업 흐름은 devkit에 둔다.</p>
</div>

<section class="cheatsheet-guide" aria-labelledby="cheatsheet-guide-title">
  <h2 id="cheatsheet-guide-title">먼저 보기</h2>
  <dl>
    <div>
      <dt>도구 사전</dt>
      <dd>도구 이름이나 역할이 기억나지 않을 때 검색·탐색, 텍스트·JSON, 시스템·네트워크, Git·TUI, 개발 도구 순서로 훑는다.</dd>
    </div>
    <div>
      <dt>Terminal TUI 지도</dt>
      <dd>터미널 안에서 파일, Git, 세션, 데이터베이스, 에디터를 다룰 때 도구를 고르는 기준을 정리한다.</dd>
    </div>
  </dl>
</section>

<section class="cheatsheet-browser" aria-label="치트시트 탐색">
  <label class="cheatsheet-search" for="cheatsheet-search-input">
    <span>도구 검색</span>
    <input id="cheatsheet-search-input" type="search" placeholder="git, tmux, 검색..." autocomplete="off">
  </label>

  <p class="cheatsheet-search-status" id="cheatsheet-search-status" role="status"></p>

  <div class="cheatsheet-layout">
    <nav class="cheatsheet-list" aria-label="도구 목록">
      {% for group in site.data.cheatsheets.groups %}
        <details class="cheatsheet-category" data-category-list open>
          <summary>
            <span>{{ group.title }}</span>
            <span class="cheatsheet-category__count">{{ group.items.size }}</span>
          </summary>
          <ul>
            {% for item in group.items %}
              <li data-tool-row data-name="{{ item.name | downcase }}" data-desc="{{ item.desc | downcase }}" data-category="{{ group.title | downcase }}">
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
          <article id="cheatsheet-detail-{{ item.slug }}" class="cheatsheet-detail" data-detail="{{ item.slug }}" data-category="{{ group.title }}" hidden>
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
    const tools = Array.from(document.querySelectorAll('[data-tool]'));
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

    function selectTool(slug, updateHash) {
      const detail = document.querySelector('[data-detail="' + slug + '"]');
      const button = document.querySelector('[data-tool="' + slug + '"]');
      if (!detail || !button) return;

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
      detail.scrollIntoView({ block: 'nearest' });
    }

    function filterTools() {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;

      rows.forEach((row) => {
        const match = !query || [row.dataset.name, row.dataset.desc, row.dataset.category].some((value) => value.includes(query));
        row.hidden = !match;
        if (match) visible += 1;
      });

      categories.forEach((category) => {
        const visibleRows = category.querySelectorAll('[data-tool-row]:not([hidden])').length;
        category.hidden = visibleRows === 0;
        if (query && visibleRows > 0) category.open = true;
      });

      noResults.hidden = visible !== 0;
      status.textContent = query ? visible + '개 도구' : '';
    }

    tools.forEach((button) => {
      button.addEventListener('click', () => selectTool(button.dataset.tool, true));
    });
    searchInput.addEventListener('input', filterTools);

    const hash = window.location.hash.slice(1);
    if (hash && document.querySelector('[data-tool="' + hash + '"]')) selectTool(hash, false);
  })();
</script>

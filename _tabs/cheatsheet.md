---
layout: page
icon: fas fa-book-open
order: 93
hidden: true
title: 치트시트
---

<p class="cheatsheet-intro">자주 쓰는 도구를 찾고, tldr·공식 문서·내 치트시트로 이어지는 참고 링크를 모아 둔 페이지다. 도구 간 관계는 <a href="{{ '/cmdtreemap/' | relative_url }}">cmdtreemap</a>에서 탐색할 수 있다.</p>

<section data-source="https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/cheatsheets/catalog.json" class="cheatsheet-browser" aria-label="치트시트 탐색">
  <label class="cheatsheet-search" for="cheatsheet-search-input">
    <span>도구 검색</span>
    <input id="cheatsheet-search-input" type="search" placeholder="git, tmux, 검색..." autocomplete="off">
  </label>

  <p class="cheatsheet-search-status" id="cheatsheet-search-status" role="status">목록을 불러오는 중...</p>
  <button type="button" id="cheatsheet-retry" hidden>다시 시도</button>
  <noscript><p>치트시트 탐색에는 JavaScript가 필요합니다. <a href="https://github.com/clang-engineer/devkit/tree/main/reference/cheatsheets">devkit 치트시트</a>에서 문서를 볼 수 있습니다.</p></noscript>

  <div class="cheatsheet-category-tabs" role="tablist" aria-label="카테고리">
    <button type="button" class="cheatsheet-category-tab is-active" data-category-filter="all" role="tab" aria-selected="true">전체</button>
  </div>

  <div class="cheatsheet-layout">
    <nav class="cheatsheet-list" aria-label="도구 목록">
      <p class="cheatsheet-no-results" hidden>찾는 도구가 없습니다.</p>
    </nav>

    <section class="cheatsheet-details" aria-label="선택한 도구" aria-live="polite">
      <p class="cheatsheet-detail-placeholder" id="cheatsheet-detail-placeholder">도구를 선택하면 여기에 설명과 참고 링크가 표시됩니다.</p>

    </section>
  </div>
</section>

<script type="module" src="{{ '/assets/js/cheatsheets.js' | relative_url }}"></script>

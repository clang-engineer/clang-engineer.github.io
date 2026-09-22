---
layout: page
icon: fas fa-sitemap
order: 3
title: Command Map
---

<p class="command-map-intro">CLI 도구가 어떤 문제를 해결하며 서로 어떤 대안·보완 관계에 있는지 탐색한다.</p>

<div class="command-map-app">
  <p id="status">데이터를 불러오는 중...</p>
  <input id="search" type="search" placeholder="도구, 관계, 문제를 검색..." autocomplete="off">

  <div class="command-map-layout">
    <nav id="tree" aria-label="명령어 관계 tree"></nav>
    <article id="detail" aria-live="polite" hidden></article>
  </div>
</div>

<script>window.CMDTREEMAP_BASE = "{{ '/cmdtreemap/' | relative_url }}";</script>
<script type="module" src="{{ '/cmdtreemap/app.js' | relative_url }}"></script>

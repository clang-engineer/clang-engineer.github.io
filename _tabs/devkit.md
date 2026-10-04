---
layout: page
icon: fas fa-toolbox
order: 3
title: Devkit
permalink: /devkit/
---

도구 사용법을 빠르게 찾거나, CLI 도구 사이의 관계를 탐색하세요.

<div class="browse-menu">
<a class="browse-entry" href="{{ '/cheatsheet/' | relative_url }}"><i class="fas fa-book-open" aria-hidden="true"></i><span><strong>치트시트</strong><small>도구별 빠른 예시·공식 문서·내 치트시트</small></span><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
<a class="browse-entry" href="{{ '/command-map/' | relative_url }}"><i class="fas fa-sitemap" aria-hidden="true"></i><span><strong>CLI 지도</strong><small>도구의 대안·대체·보완 관계와 사용법</small></span><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
</div>

<style>
.browse-menu {
  display: grid;
  gap: 0.75rem;
  margin: 1.5rem 0;
}
.browse-menu .browse-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--main-border-color);
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-color);
  text-decoration: none;
}
.browse-entry > span {
  flex: 1;
}
.browse-entry strong,
.browse-entry small {
  display: block;
}
.browse-entry small {
  margin-top: 0.25rem;
  color: var(--text-muted-color);
}
.browse-menu .browse-entry:hover,
.browse-menu .browse-entry:focus-visible {
  border-color: var(--link-color);
  color: var(--link-color);
}
.browse-entry > .fa-chevron-right {
  font-size: 0.75rem;
  color: var(--text-muted-color);
}
</style>

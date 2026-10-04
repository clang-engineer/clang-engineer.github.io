---
layout: page
icon: fas fa-compass
order: 5
title: Browse
---

글을 찾는 방법을 선택하세요.

<div class="browse-menu">
<a class="browse-entry" href="{{ '/categories/' | relative_url }}"><i class="fas fa-stream" aria-hidden="true"></i><span><strong>카테고리</strong><small>주제별로 글 찾기</small></span><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
<a class="browse-entry" href="{{ '/tags/' | relative_url }}"><i class="fas fa-tags" aria-hidden="true"></i><span><strong>태그</strong><small>키워드로 관련 글 찾기</small></span><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
<a class="browse-entry" href="{{ '/archives/' | relative_url }}"><i class="fas fa-archive" aria-hidden="true"></i><span><strong>아카이브</strong><small>작성 시점순으로 글 찾기</small></span><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
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

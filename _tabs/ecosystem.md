---
layout: page
icon: fas fa-chart-bar
order: 4
title: Ecosystem
permalink: /ecosystem/
---

개발 도구와 플러그인을 분야별로 발견하고, **GitHub Stars 변화**를 비교합니다.

<ecosystem-rankings src="{{ '/data/rankings.json' | relative_url }}"></ecosystem-rankings>

<script type="module" src="https://cdn.jsdelivr.net/gh/clang-engineer/ecosystem-rankings@99b31d4c401c0abd4b6800ff31f4c6618241a7c4/viewer/element.js"></script>

<details class="ecosystem-about">
  <summary>랭킹 안내</summary>
  <p>GitHub Topic과 저장소 이름·설명 검색으로 프로젝트를 자동 발견합니다. 주간·월간 순위는 수집된 과거 Stars와 비교하며, 기록이 부족하면 전체 누적 순위를 임시로 보여줍니다.</p>
  <p>Stars는 관심도 지표로, 품질이나 실제 사용량을 의미하지 않습니다. 검색 특성상 일부 프로젝트가 누락되거나 관련 없는 저장소가 포함될 수 있습니다.</p>
  <p><a href="https://github.com/clang-engineer/clang-engineer.github.io/blob/main/ecosystems.yml">수집 분야 설정</a> · <a href="https://github.com/clang-engineer/ecosystem-rankings">수집기 소스</a></p>
</details>

<style>
  .ecosystem-about {
    margin-top: 1.25rem;
    padding: .8rem 1rem;
    border: 1px solid var(--main-border-color);
    border-radius: .65rem;
    color: var(--text-muted-color);
    font-size: .86rem;
  }
  .ecosystem-about summary {
    cursor: pointer;
    color: var(--text-color);
    font-weight: 600;
  }
  .ecosystem-about[open] summary { margin-bottom: .75rem; }
  .ecosystem-about p { margin: .5rem 0; line-height: 1.65; }
  .ecosystem-about p:last-child { margin-bottom: 0; }
</style>

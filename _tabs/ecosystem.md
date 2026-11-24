---
layout: page
icon: fas fa-chart-bar
order: 4
title: Rankings
permalink: /rankings/
redirect_from:
  - /ecosystem/
---

개발 도구와 플러그인을 분야별로 발견하고, **GitHub Stars 변화**를 비교합니다.

<ecosystem-rankings default-period="0" src="{{ '/data/rankings.json' | relative_url }}?v=20261125-plugin-framework-coverage"></ecosystem-rankings>

<script type="module" src="https://cdn.jsdelivr.net/gh/clang-engineer/ecosystem-rankings@5ff25c37f74bc2bebcc184d839dcced29dfd1bc0/viewer/element.js?v=20261123-ranking-skeleton"></script>

<details class="ecosystem-about">
  <summary>랭킹 안내</summary>
  <p>GitHub Topic과 저장소 이름·설명 검색으로 프로젝트를 자동 발견하고, 공식·커뮤니티 목록에서 확인한 주요 저장소를 명시적 포함 목록으로 보완합니다. 목록 자체를 자동 동기화하는 방식은 아닙니다.</p>
  <p>플러그인 분야에는 해당 도구의 플러그인 매니저·설정 프레임워크도 포함합니다. 예를 들어 Oh My Fish와 Fisher는 Fish Plugins에, Oh My Zsh와 Prezto는 Zsh Plugins에 함께 표시합니다. Topic이나 설명에 “plugin”이 없어 검색에서 빠지는 주요 저장소는 포함 목록으로 보강하며, Shell Plugins와도 중복 노출될 수 있습니다. 순위에 포함된다는 것이 현재 유지보수나 설치를 권장한다는 뜻은 아닙니다.</p>
  <p>기존 분야와 Zsh Plugins, Fish Plugins, Yazi Plugins, fzf Ecosystem을 하나의 분야 선택 목록에서 탐색합니다. 같은 저장소는 관련 분야에 중복 노출될 수 있으며, 모음 저장소 안의 개별 플러그인에는 별도의 Stars를 부여하지 않습니다.</p>
  <p>주간·월간 순위는 수집된 과거 Stars와 비교하며, 기록이 부족하면 전체 누적 순위를 임시로 보여줍니다. 수집 범위와 최소 Stars 기준은 분야별로 다릅니다.</p>
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

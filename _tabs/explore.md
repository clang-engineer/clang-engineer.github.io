---
layout: page
icon: fas fa-chart-bar
order: 4
title: Explore
permalink: /explore/
---

개발 도구와 플러그인 생태계를 분야별로 탐색하는 공간입니다.

GitHub Topic 검색과 대표 저장소 직접 지정을 결합해 프로젝트를 발견하고, **누적 Stars** 기준으로 정렬합니다. 주간·월간 순위는 일별 기록이 충분히 쌓인 뒤 표시됩니다.

<ecosystem-rankings src="{{ '/data/rankings.json' | relative_url }}"></ecosystem-rankings>

<script type="module" src="https://cdn.jsdelivr.net/gh/clang-engineer/ecosystem-rankings@45b094b358bd212681b7f98caf820d6c283e7309/viewer/element.js"></script>

<small>데이터는 이 블로그 저장소의 GitHub Actions에서 수집하고 관리합니다. 수집기는 [ecosystem-rankings](https://github.com/clang-engineer/ecosystem-rankings)를 재사용합니다. 초기 수집 전에는 데이터가 표시되지 않을 수 있습니다.</small>

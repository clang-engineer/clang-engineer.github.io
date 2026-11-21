---
layout: page
icon: fas fa-chart-bar
order: 4
title: Explore
permalink: /explore/
---

개발 도구와 플러그인 생태계에서 **어떤 프로젝트가 주목받고 있는지** 살펴보는 탐색 페이지입니다. [Radar]({{ '/radar/' | relative_url }})가 기술 소식을 발견하는 곳이라면, Explore는 분야별 오픈소스 프로젝트를 비교하는 곳입니다.

<ecosystem-rankings src="{{ '/data/rankings.json' | relative_url }}"></ecosystem-rankings>

<script type="module" src="https://cdn.jsdelivr.net/gh/clang-engineer/ecosystem-rankings@b69bdcf06eb3a5f5980f936c15786c55055b0950/viewer/element.js"></script>

## 수집 분야

| 도구 | 플러그인 |
| :--- | :--- |
| Terminal File Managers | Neovim Plugins |
| Terminal Emulators | tmux Plugins |
| Terminal Multiplexers | |
| Shell Prompts | |
| Window Managers | |
| CLI Search & Navigation | |

분야별 목록은 현재는 분류 정확도를 위해 **검증된 대표 저장소 목록(curated)**을 추적합니다. GitHub Topic은 후보 발견에 참고하지만, 무관한 프로젝트가 섞이지 않도록 순위에는 자동 포함하지 않습니다. 새 분야는 [수집 설정](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/ecosystems.yml)에서 관리합니다.

## 순위 기준

- **주간(기본):** 7일 전과 비교한 GitHub Stars 증가량
- **월간:** 30일 전과 비교한 GitHub Stars 증가량
- **전체:** 현재 누적 GitHub Stars

주간·월간 순위는 실제 수집 이력이 충분히 쌓인 프로젝트만 표시합니다. 기록이 부족하면 집계 중이라고 안내하며, **0 증가량으로 간주하지 않습니다.** 이 순위는 GitHub Stars를 기준으로 한 발견 지표이지 프로젝트의 품질이나 실제 사용량 순위는 아닙니다.

데이터는 이 블로그 저장소의 GitHub Actions가 매일 수집하며 `data/rankings.json`에 저장합니다. 수집기와 Viewer는 별도 오픈소스 프로젝트인 [ecosystem-rankings](https://github.com/clang-engineer/ecosystem-rankings)를 사용합니다.

---
layout: page
icon: fas fa-chart-bar
order: 4
title: Ecosystem
permalink: /ecosystem/
---

개발 도구와 플러그인 생태계에서 **어떤 프로젝트가 주목받고 있는지** 살펴보는 탐색 페이지입니다. [Radar]({{ '/radar/' | relative_url }})가 기술 소식을 발견하는 곳이라면, Ecosystem은 분야별 오픈소스 프로젝트를 비교하는 곳입니다.

<ecosystem-rankings src="{{ '/data/rankings.json' | relative_url }}"></ecosystem-rankings>

<script type="module" src="https://cdn.jsdelivr.net/gh/clang-engineer/ecosystem-rankings@49f47b7b1f46fcd31279e55398f87653ad60239c/viewer/element.js"></script>

## 수집 분야

| 도구 | 플러그인 |
| :--- | :--- |
| Terminal File Managers | Neovim Plugins |
| Terminal Emulators | tmux Plugins |
| Terminal Multiplexers | |
| Shell Prompts | |
| Window Managers | |
| CLI Search & Navigation | |

분야별 목록은 GitHub Topic과 분야별 검색어만으로 **프로젝트를 자동 발견**합니다. 개별 저장소 목록은 지정하지 않습니다. 자동 검색 특성상 유명 프로젝트가 누락되거나 무관한 프로젝트가 섞일 수 있어 검색 품질을 지속적으로 개선합니다. 새 분야는 [수집 설정](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/ecosystems.yml)에서 관리합니다.

## 순위 기준

- **주간(기본):** 7일 전과 비교한 GitHub Stars 증가량
- **월간:** 30일 전과 비교한 GitHub Stars 증가량
- **전체:** 현재 누적 GitHub Stars

주간·월간 순위는 실제 수집 이력이 충분히 쌓인 프로젝트만 계산합니다. 기록이 전혀 부족한 분야는 **전체 누적 Stars 순위를 임시로 표시하고 이를 명시**합니다. 기록 부족을 0 증가량으로 간주하지 않습니다. 이 순위는 GitHub Stars를 기준으로 한 발견 지표이지 프로젝트의 품질이나 실제 사용량 순위는 아닙니다.

데이터는 이 블로그 저장소의 GitHub Actions가 매일 수집하며 `data/rankings.json`에 저장합니다. 수집기와 Viewer는 별도 오픈소스 프로젝트인 [ecosystem-rankings](https://github.com/clang-engineer/ecosystem-rankings)를 사용합니다.

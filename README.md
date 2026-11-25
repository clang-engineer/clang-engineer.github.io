> A technical blog by clang.engineer

# clang.engineer

코드 너머의 원리를 기록합니다.

백엔드, 시스템, 데이터베이스, 개발 도구를 직접 만들고 파고들며 배운 것을 정리합니다.  
단순한 사용법보다 **왜 그렇게 동작하는지**, 그리고 실제 개발에서 **어떻게 연결되는지**를 이해하는 데 초점을 둡니다.

https://clang-engineer.github.io

## 기술 스택

- [Jekyll](https://jekyllrb.com/) + [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 테마 (v7.4.1)
- GitHub Pages 배포 (`pages-deploy.yml` 워크플로우)
- [utterances](https://utteranc.es/) 댓글
- PWA 지원 (오프라인 캐시)

## 프로젝트 구조

```
_posts/          # 블로그 포스트 (카테고리별 하위 폴더)
_tabs/           # 사이드바 탭 및 숨김 독립 페이지
_data/           # 사이트 데이터 (로케일 등)
_includes/       # 레이아웃 조각
_layouts/        # 페이지 레이아웃
_sass/           # 스타일시트
_javascript/     # JS 소스 (rollup 번들링)
_plugins/        # Jekyll 플러그인
assets/          # 정적 파일 (이미지, CSS, JS 빌드 결과)
tools/           # 로컬 개발용 스크립트
```

### 사이트 탐색

사이드바는 홈, 로드맵, Devkit, Radar, Articles, 소개의 6개 항목으로 구성합니다.
Devkit과 Radar는 공통 헤더의 하위 메뉴로 콘텐츠를 전환하며, 선택한 화면 하나만 본문에 표시합니다.
데스크톱에서는 제목 바로 옆의 작은 아이콘으로 화면을 전환합니다. 마우스를 올리거나 키보드로 포커스하면 메뉴 이름이 툴팁으로 표시됩니다.
선택한 아이콘은 옅은 강조색 배경으로 구분합니다. 모바일과 마우스 호버가 없는 기기에서는 아이콘 옆에 이름을 항상 표시하며, 클릭 영역은 최소 44px 높이를 유지합니다.

- Devkit: 도구 탐색(`/devkit/`) · 테마·폰트(`/resources/`)
- Radar: 뉴스·커뮤니티(`/radar/`) · 오픈소스 랭킹(`/rankings/`)
- Articles(`/articles/`): 카테고리 · 태그 · 아카이브로 글 찾기

하위 메뉴는 기존 URL을 오가는 일반 링크이므로 직접 접근, 새로고침, 브라우저 뒤로 가기를 지원합니다.
하위 화면에서도 상위 사이드바 항목과 현재 하위 메뉴를 선택 상태로 표시합니다.
Devkit·Radar 화면은 오른쪽 최근 글·태그 패널을 숨깁니다. Devkit은 넓은 작업 화면을 유지합니다.
Radar는 공통 헤더와 사이트 모음 본문을 최대 1040px, 랭킹 본문을 최대 1200px로 제한하고 가운데 정렬합니다. 두 화면을 전환해도 제목과 아이콘 메뉴 위치는 유지됩니다.
그룹과 링크는 `_data/section_navigation.yml`, 페이지 소속은 front matter의 `navigation`으로 관리합니다.
기존 `/command-map/`과 `/cheatsheet/`도 Devkit 소속이며, `navigation_current`로 도구 탐색 메뉴를 선택합니다.
공통 화면 스타일은 `assets/css/section-navigation.css`에서 관리합니다.

### 개발 리소스 모음

`_tabs/resources.md`는 `/resources/`로 공개하는 개발 리소스 모음입니다.
`hidden: true`로 사이드바 탭에는 노출하지 않고, Devkit 상단의 `테마·폰트` 메뉴에서 연결합니다.
`navigation: devkit`으로 공통 탐색 레이아웃을 적용합니다.
첫 화면에서는 `테마`·`폰트` 견본 갤러리를 보여줍니다. 카드를 누르면 큰 견본, 특징, 공식 링크를 담은 상세 보기가 열립니다.
상세 보기는 브라우저 기본 `dialog`를 사용합니다. 닫기, Esc 또는 배경 클릭으로 닫으며, 선택했던 카드로 포커스를 돌려줍니다.
테마 상세에는 계열 설명·라이트/다크 구분·팔레트 출처를, 폰트 상세에는 글꼴 특징·한글과 합자 지원·관찰할 차이를 표시합니다.
별도 비교 패널, A/B 슬롯, 드래그 조작이나 비교 설정은 제공하지 않습니다.
JavaScript 없이도 전체 정적 견본과 접힌 공식 자료를 열람할 수 있습니다.
견본은 블로그나 개발 도구의 실제 설정을 변경하지 않습니다.
웹 폰트는 이 페이지에서만 Google Fonts로 불러오며, 코드용 폰트의 한글은 Noto Sans KR로 표시합니다. 로딩 실패 시 대체 글꼴 표시를 안내합니다.
테마 계열·변형·폰트 특징과 공식 근거는 `_data/resource_previews.yml`, 상세 보기 동작과 스타일은 `assets/js/resource-previews.js`와 `assets/css/resource-previews.css`에서 관리합니다.
기존 테마 사이트 링크도 유지하며, 설치법은 공식 안내로 연결합니다.

## 로컬 개발

```sh
# 의존성 설치
bundle install
npm install

# 로컬 서버 실행 (라이브 리로드 포함)
bash tools/run.sh

# production 모드로 실행
bash tools/run.sh -p
```

기본 주소는 `http://127.0.0.1:4000`입니다.

## 글 작성

`_posts/<카테고리>/` 아래에 `YYYY-MM-DD-제목.md` 형식으로 파일을 생성합니다.

```yaml
---
title: 글 제목
date: 2026-01-01 12:00:00 +0900
categories: [상위 카테고리, 하위 카테고리]
tags: [태그1, 태그2]
---

본문 내용
```

## 카테고리

AI, C++, CSS, DB, Design Pattern, Docker, Git, Gradle, Java, JavaScript, LazyVim, Linux, Network, Nginx, Security, Shell, Spring Boot, Tableau, Tmux, Vim, Windows

## 참고

- 이전 기록 이력을 유지하기 위해 테마를 fork하지 않고 파일 복사 방식으로 구성했습니다.
- 처음 시작하는 경우 [chirpy starter](https://github.com/cotes2020/chirpy-starter)를 fork해서 사용하는 것을 권장합니다.

## 관련 저장소

| 저장소 | 설명 |
|---|---|
| [dotfiles](https://github.com/clang-engineer/dotfiles) | zsh, tmux, git, nvim, claude 등 개발 환경 설정. `bootstrap.sh` 한 줄로 전체 환경 구성 |
| [devkit](https://github.com/clang-engineer/devkit) | cheatsheets·templates 등 공개 레퍼런스 모음 |

## 라이선스

[MIT](LICENSE)

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

### 개발 리소스 모음

`_tabs/resources.md`는 `/resources/`로 공개하는 개발 리소스 모음입니다.
`hidden: true`로 사이드바 탭에는 노출하지 않고, Articles(`/articles/`)에서 연결합니다.
이 페이지는 `page_class: resources-page`로 본문 폭을 넓히고 오른쪽 보조 패널을 숨깁니다. 다른 페이지의 폭은 바꾸지 않습니다.
첫 화면에서는 `테마`·`폰트`의 큰 견본 갤러리를 보여줍니다. `비교 패널`을 열고 견본을 A/B 영역에 드래그해 넣습니다.
비교 패널은 비모달이므로 갤러리를 계속 조작할 수 있습니다. 넓은 화면에서는 오른쪽, 좁은 화면에서는 하단에 표시합니다.
A/B를 선택한 뒤 견본을 누르는 방식도 지원하며, 터치와 키보드 Enter로 동일하게 적용합니다. 슬롯별 교체·비우기와 패널 재열기를 지원합니다.
폰트·크기·문장과 비교 기준은 패널의 접힌 `미리보기 설정`에서 바꿉니다.
`테마`는 공통 폰트로, `폰트`는 공통 배경으로 비교합니다. `조합`에서는 드롭한 종류만 바꾸고 나머지 설정은 유지합니다.
좁은 패널에서는 A/B 선택으로 한 후보씩 표시합니다. 패널 안에서 Esc 또는 닫기를 사용하면 갤러리로 포커스를 돌려줍니다.
JavaScript 없이도 정적 견본과 접힌 공식 자료는 열람할 수 있습니다.
비교는 페이지 내부 샘플에만 적용하고, 블로그나 개발 도구의 실제 설정은 변경하지 않습니다.
웹 폰트는 이 페이지에서만 Google Fonts로 불러오며, 코드용 폰트의 한글은 Noto Sans KR로 표시합니다.
테마 계열·변형·폰트 특징과 공식 근거는 `_data/resource_previews.yml`, 비교 동작과 스타일은 `assets/js/resource-previews.js`와 `assets/css/resource-previews.css`에서 관리합니다.
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

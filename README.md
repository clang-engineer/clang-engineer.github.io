> A personal tech blog by clang.engineer

# clang.engineer

보통 개발자의 기록을 담은 블로그입니다.

https://clang-engineer.github.io

## 기술 스택

- [Jekyll](https://jekyllrb.com/) + [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 테마 (v7.4.1)
- GitHub Pages 배포 (`pages-deploy.yml` 워크플로우)
- [utterances](https://utteranc.es/) 댓글
- PWA 지원 (오프라인 캐시)

## 프로젝트 구조

```
_posts/          # 블로그 포스트 (카테고리별 하위 폴더)
_tabs/           # 사이드바 탭 페이지
_data/           # 사이트 데이터 (로케일 등)
_includes/       # 레이아웃 조각
_layouts/        # 페이지 레이아웃
_sass/           # 스타일시트
_javascript/     # JS 소스 (rollup 번들링)
_plugins/        # Jekyll 플러그인
assets/          # 정적 파일 (이미지, CSS, JS 빌드 결과)
tools/           # 로컬 개발용 스크립트
```

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
- chirpy 테마 원본 README는 [`README_chirpy_original.md`](README_chirpy_original.md)에 보관되어 있습니다.

## 관련 저장소

| 저장소 | 설명 |
|---|---|
| [dotfiles](https://github.com/clang-engineer/dotfiles) | zsh, tmux, git, nvim, claude 등 개발 환경 설정. `bootstrap.sh` 한 줄로 전체 환경 구성 |
| [toolbox](https://github.com/clang-engineer/toolbox) | TIL, cheatsheet, 분석 노트 등 개인 유틸리티 모음. Claude Code 스킬(`/to-til`, `/to-blog` 등)과 연동 |

## 라이선스

[MIT](LICENSE)

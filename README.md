# clang.engineer

**코드 너머의 원리를 기록합니다.**

백엔드, 시스템, 데이터베이스, 개발 도구의 동작 원리와 실제 활용을 기록하는 기술 블로그입니다.

[블로그 방문](https://clang-engineer.github.io/)

## 탐색

| 페이지 | 내용 |
|---|---|
| [Roadmap](https://clang-engineer.github.io/roadmap/) | 기술별 학습 경로와 개념 구조 |
| [Devkit](https://clang-engineer.github.io/devkit/) | 도구 관계 지도와 치트시트 |
| [Radar](https://clang-engineer.github.io/radar/) | 개발 뉴스와 커뮤니티 |
| [Rankings](https://clang-engineer.github.io/rankings/) | 오픈소스 생태계 랭킹 |
| [Articles](https://clang-engineer.github.io/articles/) | 기술 글 탐색 |
| [Themes](https://clang-engineer.github.io/resources/) · [Fonts](https://clang-engineer.github.io/fonts/) | 개발 환경 리소스 견본 |

## 시스템 구성

블로그는 글을 발행하는 Jekyll 사이트이면서, 외부 저장소의 참조 데이터와 랭킹을 연결하는 탐색 공간입니다.

```text
devkit                         ecosystem-rankings
  │ catalog.json                 │ GitHub Actions 수집
  ▼                              ▼
reference-explorer             rankings.json / history.json
  │                              │ Rankings Viewer
  └──────────────┬───────────────┘
                 ▼
         clang.engineer
      Jekyll · Chirpy · GitHub Pages
```

- **Devkit**: 도구 분류와 관계, 치트시트 원본은 devkit 저장소에서 관리하고 reference-explorer가 렌더링합니다.
- **Rankings**: 이 블로그의 수집 설정과 GitHub Actions가 데이터를 갱신하며, Viewer는 생성된 JSON을 읽습니다.
- **Roadmap / Articles**: 개념의 전체 구조부터 상세 기술 글까지 연결합니다.
- **Resources**: 테마 팔레트와 폰트 견본을 비교하고 공식 자료로 이동할 수 있습니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 사이트 | Jekyll, Chirpy |
| UI | HTML, Sass, JavaScript, Web Components |
| 빌드 | Bundler, npm, Rollup |
| 배포 및 수집 | GitHub Pages, GitHub Actions |
| 댓글 | utterances |

## 프로젝트 구조

```text
_posts/          기술 글
_tabs/           주요 탐색 페이지
_data/           사이트 및 탐색 설정
_includes/       공통 UI
_layouts/        페이지 레이아웃
_sass/           스타일
_javascript/     JavaScript 소스
assets/          정적 리소스
tools/           로컬 개발 스크립트
docs/            개발 문서
```

## 로컬 개발

Jekyll + Chirpy, GitHub Pages.

```sh
bundle install
npm install
bash tools/run.sh
# production mode: bash tools/run.sh -p
```

기본 주소: `http://127.0.0.1:4000`.

새 글은 `_posts/<카테고리>/YYYY-MM-DD-제목.md`에 작성합니다. 사이트 탐색 설정, 리소스 견본, 글 작성 규칙은 [개발 및 사이트 구조](docs/development.md)를 참고하세요.

## 관련 프로젝트

[devkit](https://github.com/clang-engineer/devkit) · [reference-explorer](https://github.com/clang-engineer/reference-explorer) · [ecosystem-rankings](https://github.com/clang-engineer/ecosystem-rankings) · [dotfiles](https://github.com/clang-engineer/dotfiles)

[MIT](LICENSE)

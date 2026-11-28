---
title       : "Base16에서 Tinty까지 — 개발 환경 테마 관리의 역사와 아키텍처"
description : "Base16과 Base24의 색상 명세, Tinted Theming의 계승 과정, 빌더와 테마 관리자의 책임을 살펴보고 CLI 테마 관리 방식을 비교한다."
date        : 2026-11-28 00:00:00 +0900
categories  : [theme, "테마 관리"]
tags        : [base16, base24, tinted-theming, tinty, comparison]
pin         : false
hidden      : false
permalink   : /posts/tinted-theming-ecosystem/
---

Ghostty, Neovim, tmux, fzf의 색상을 통일하려면 같은 이름의 테마라도 도구마다 다른 설정을 준비해야 한다. 이 문제를 해결하기 위해 색상 데이터와 도구별 설정 생성을 분리해 온 대표적인 사례가 Base16 생태계다.

핵심 질문은 테마를 어디에서 가져오고, 누가 도구별 설정으로 변환하며, 누가 실제 개발 환경에 적용하는가이다.

전체 색상 모델과 다른 테마 관리 방식은 [테마 로드맵](2026-11-28-00-theme-roadmap.md)에서 확인할 수 있다.

## 왜 공통 색상 규격이 필요한가?

Ghostty의 배경색 설정은 `background`, Neovim은 `Normal` 하이라이트의 `bg`, fzf는 `--color=bg:`로 표현한다. 색상값은 같아도 설정 문법은 다르다. 테마마다 이 설정을 직접 작성하면 테마 수와 도구 수의 곱만큼 관리 대상이 늘어난다.

색상값과 도구별 설정 문법을 분리하려면 두 정의가 공유할 이름과 의미가 필요하다. Base16은 이를 16개의 공통 색상 슬롯과 스타일 지침으로 제공한다. 예를 들어 `base00`은 기본 배경, `base05`는 기본 전경에 대응한다.

**Scheme: 공통 슬롯별 색상값 (설명용 예시)**

| 공통 슬롯 | Dracula 계열 | Nord 계열 |
|---|---|---|
| base00 | #282A36 | #2E3440 |
| base05 | #F8F8F2 | #D8DEE9 |

**Template: 도구별 설정과 공통 슬롯의 대응 (설명용 예시)**

| 공통 슬롯 | Ghostty | Neovim | fzf |
|---|---|---|---|
| base00 | background | Normal.bg | bg |
| base05 | foreground | Normal.fg | fg |

위 표는 원본 Scheme 파일이나 실제 템플릿 문법을 그대로 옮긴 것이 아니다. 실제 Template은 대응 관계뿐 아니라 각 도구의 설정 문법을 포함한다.

```text
Scheme 제작자                   도구 연동 개발자
     │ 색상값 정의                   │ 설정 문법과 매핑 정의
     ▼                               ▼
   Scheme ── 공통 슬롯 (Base16) ── Template
     └──────────────┬────────────────┘
                    ▼
                 Builder
                    │ 색상값 대입
                    ▼
               도구별 테마 파일
                    │ 선택 및 적용
                    ▼
                  Tinty
```

새 도구가 등장하면 해당 도구의 Template과 필요한 적용 연동을 추가한다. 새 팔레트가 등장하면 Scheme을 추가한다. 두 변경 축을 분리했기 때문에 기존의 호환 Scheme과 Template을 재사용할 수 있다. 단, 공통 슬롯으로 표현하기 어려운 UI 요소에는 별도 매핑이 필요할 수 있다.

Base16은 이 결합을 가능하게 하는 규격이고, Tinty는 일반적인 전환 과정에서 이미 생성된 파일을 적용하는 관리자다. 두 프로젝트의 책임은 다르다.

여기서 규격은 ISO나 ECMA 같은 표준화 기관이 제정한 공식 표준을 뜻하지 않는다. Base16과 Base24는 Tinted Theming 생태계에서 사용하는 공개 색상 명세(Specification)다. 개발 환경 전체의 사실상 표준이라고 단정할 근거도 없다. Scheme과 Template이 공통 명세를 따르며, Ghostty나 Neovim 자체가 이를 구현하거나 준수해야 하는 것은 아니다.

## 1. 전체 구조

```text
[테마 제작 및 배포]
Scheme (색상 데이터) ──┐
                       ├─ Builder ──> 도구별 테마 파일
Template (변환 규칙) ──┘                    │
                                            │ 배포
[사용자 환경]                               ↓
테마 선택 ──> Manager (Tinty) ──> 파일 연결 / Hook
                                            │
                                            ↓
                              Ghostty / tmux / fzf / Neovim
```

화살표는 데이터 생성과 적용 흐름을 뜻한다. Tinted Theming은 이 전체 생태계이며 Tinty는 그중 사용자 환경에서 테마 전환을 관리하는 도구다.

## 2. 역사: Base16에서 Tinted Theming으로

| 시기 | 사건 | 의미 |
|---|---|---|
| 2010년대 초 | Chris Kempson의 Base16 등장 | 공통 색상 역할과 도구별 템플릿을 분리 |
| 2020년 | Flavours 저장소 등장 | 사용자가 팔레트와 템플릿을 조합해 일괄 적용 |
| 2020년대 초 | Base16 커뮤니티의 계승과 Tinted Theming 명칭 사용 | 원 프로젝트와 구별되는 공동 관리 체계 |
| 2024-02-06 | Tinty 0.1.0 출시 | 테마 선택과 적용을 담당하는 관리자 등장 |
| 2024-02-10 | Tinty 0.3.0 | Base24 템플릿 지원 |
| 2024-05-07 | Tinty 0.14.0 | 별도의 build 명령 추가 |
| 2024-07-03 | Tinty 0.17.0 | 이미지 기반 scheme 생성 명령 추가 |

초기 Base16과 커뮤니티 계승의 정확한 최초 날짜는 여기서 확정하지 않는다. Tinty의 출시 일자는 [CHANGELOG](https://github.com/tinted-theming/tinty/blob/main/CHANGELOG.md)를 기준으로 한다.

[Tinted Theming 조직](https://github.com/tinted-theming)은 원래 Base16 프로젝트와의 혼동을 피하기 위해 명칭을 변경했다고 설명한다. [schemes 저장소](https://github.com/tinted-theming/schemes)의 FAQ에는 분산되어 있던 팔레트를 통합한 과정도 기록되어 있다.

Tinty는 Flavours의 코드 포크라고 단정할 수 없다. 개발자는 Flavours에서 아이디어를 얻었으며 유지보수가 활발하지 않아 Tinty를 계속 개발했다고 [README](https://github.com/tinted-theming/tinty)에서 밝힌다.

## 3. Base16과 Base24

Base16은 16가지 색상에 공통 역할을 부여하는 스타일 체계다. 단순히 터미널이 표현할 수 있는 색상 수를 의미하는 것이 아니다.

| 역할 | 대표 슬롯 |
|---|---|
| 배경과 선택 영역 | base00~base02 |
| 주석과 전경 | base03~base07 |
| 변수 및 삭제 표시 | base08 |
| 문자열 | base0B |
| 함수 | base0D |
| 키워드 | base0E |

Base24는 8개 슬롯을 추가한다. 그중 6개는 밝은 ANSI 색상에, 나머지 2개는 더 어두운 배경에 대응한다. 따라서 Base16의 의미 있는 색상 배치를 유지하면서 터미널 표현을 확장할 수 있다. 자세한 매핑은 [Base24 스타일 명세](https://github.com/tinted-theming/base24/blob/main/styling.md)를 참조한다.

Tinted8처럼 팔레트 이외에 UI와 구문 역할을 더 명시적으로 기술하는 체계도 등장했다. 이들은 Tinty의 버전 번호가 아니라 서로 다른 스타일 체계다.

## 4. 팔레트와 템플릿을 분리하는 이유

예를 들어 Dracula의 배경색을 여러 도구에 적용하더라도 Ghostty에서는 배경 옵션, fzf에서는 색상 인수, 에디터에서는 하이라이트 그룹으로 표현해야 한다. 색상 자체와 도구별 문법은 다른 변경 축이다.

```text
Dracula ──┐
Nord ─────┼── 공통 색상 슬롯 ──┬── Ghostty 템플릿
Gruvbox ──┘                     ├── fzf 템플릿
                               └── tmux 템플릿
```

테마 N개와 도구 M개가 있다면 개별 포트를 모두 관리하는 경우 최대 N×M 조합을 다뤄야 한다. 공통 모델을 사용하면 팔레트 N개와 템플릿 M개로 많은 조합을 생성할 수 있다. 생성 결과와 예외 처리까지 사라지는 것은 아니며 스타일 품질은 매핑에 의존한다.

## 5. 생태계의 책임 분리

Tinted Theming은 단일 프로그램이 아니라 [GitHub 조직과 오픈소스 커뮤니티](https://github.com/tinted-theming)를 중심으로 공통 명세, 색상 데이터, 빌더, 도구별 연동 프로젝트를 발전시키는 생태계다. 조직 외부의 개발자도 호환되는 Scheme이나 Template을 제공할 수 있다.

| 구성 요소 | 책임 | 대표 저장소 |
|---|---|---|
| Scheme | 색상과 메타데이터 | [schemes](https://github.com/tinted-theming/schemes) |
| Style | 색상 역할 정의 | [home](https://github.com/tinted-theming/home), [base24](https://github.com/tinted-theming/base24) |
| Builder | 팔레트와 템플릿으로 파일 생성 | [tinted-builder-rust](https://github.com/tinted-theming/tinted-builder-rust) |
| Template | 도구별 설정 문법으로 변환 | [tinted-terminal](https://github.com/tinted-theming/tinted-terminal), [tinted-tmux](https://github.com/tinted-theming/tinted-tmux) |
| Integration | 앱에서 색상 적용 및 연동 | [tinted-nvim](https://github.com/tinted-theming/tinted-nvim), [tinted-fzf](https://github.com/tinted-theming/tinted-fzf) |
| Manager | 선택, 동기화, 적용 | [tinty](https://github.com/tinted-theming/tinty) |

Chris Kempson은 원 Base16의 창시자이며 Jamy Golden은 Tinty 및 관련 빌더 개발을 담당해 왔다. 전체 생태계는 여러 저장소의 기여자와 메인테이너가 분담하는 구조다. 개별 담당자는 조직의 공식 저장소에서 확인하는 편이 정확하다.

### 확장성: 변경 축과 유지보수 주체의 분리

| 변경 요구 | 변경 대상 |
|---|---|
| 새로운 팔레트 | Scheme |
| 새로운 도구 | Template 및 필요한 적용 연동 |
| 도구의 설정 문법 변경 | 해당 Template |
| 파일 배치 또는 Reload 방식 변경 | Tinty 설정 또는 Hook |

도구별 의존성이 사라진 것은 아니다. 각 도구의 설정 문법과 색상 역할을 분석하는 책임은 Template에, 파일 배치와 실행 중인 프로그램의 갱신은 적용 설정과 Hook에 남는다. 일반적인 연동은 Tinty의 핵심 코드를 수정하지 않고 확장할 수 있다.

이 구조는 관심사 분리(SoC), 단일 책임(SRP), 개방-폐쇄 원칙(OCP)의 관점에서 이해할 수 있다. 공통 명세를 경계로 색상 데이터와 도구별 변환 규칙을 느슨하게 결합하며, 새로운 조합을 생성할 때 기존 정의를 재사용한다.

확장성은 코드에만 국한되지 않는다. 외부 기여자가 독립적으로 템플릿과 테마 파일을 관리할 수 있으므로 유지보수 책임도 분산된다. 다만 공통 슬롯의 표현력, 명세 호환성, 도구별 Hook의 복잡성은 여전히 관리해야 한다.

## 6. Tinty가 실제로 하는 일

일반적인 적용 과정은 미리 생성된 테마 파일을 사용하는 것이다. 사용자 설정인 config.toml에 테마 공급 저장소와 적용 대상, 필요할 경우 실행할 Hook을 등록한다.

```text
tinty sync   → scheme 및 등록한 저장소 동기화
tinty apply  → 선택한 scheme의 테마 파일 확보
             → 등록한 도구마다 파일 연결 또는 Hook 실행
             → 도구별 필요에 따라 다시 읽기
```

예를 들어 Ghostty가 고정된 테마 파일 경로를 읽도록 구성하면 Tinty는 전환할 때 그 경로의 테마 파일만 바꿀 수 있다. 매번 Ghostty의 전체 설정을 다시 작성할 필요는 없다.

기본 적용 경로에서 사전 생성 파일을 이용한다는 사실과 Tinty가 별도 build 및 이미지 기반 scheme 생성 명령도 제공한다는 사실을 구분해야 한다. 세부 사용법은 [공식 사용 문서](https://github.com/tinted-theming/tinty/blob/main/USAGE.md)를 참조한다.

## 7. 다른 테마 관리자와 비교

| 도구 | 테마 원본 | 주요 적용 방식 |
|---|---|---|
| [Flavours](https://github.com/Misterio77/flavours) | Base16 등 | 템플릿 렌더링과 파일 적용 |
| Tinty | Tinted Theming schemes | 등록된 테마 파일 및 Hook |
| [recol](https://github.com/nlkli/recol) | 색상 팔레트 | 도구별 변환과 테마 적용 |

공식 포트 방식은 에디터의 플러그인별 하이라이트나 tmux 테마의 세부 동작까지 활용할 수 있다. 반면 새로운 조합마다 공식 포트의 존재, 버전, 설정 방법을 관리해야 한다.

팔레트 기반 방식은 색상의 일관성과 확장에 유리하지만 원본 테마의 모든 의미와 스타일을 재현한다고 보장할 수 없다. 어느 방식이 적합한지는 색상 통일과 원본 디자인 보존 중 무엇을 우선하는지에 달려 있다.

## 8. Dotfiles와 테마 관리자

Chezmoi처럼 설정을 배포하는 도구가 있다면 최초 연동의 비용은 여러 환경에서 재사용할 수 있다. 설정 관리와 테마 전환을 다음처럼 나누는 것이 한 가지 방법이다.

```text
Chezmoi
  └─ 고정 설정 및 Tinty 연동 정의 배포

Tinty
  └─ 선택에 따라 런타임 테마 파일 갱신

Application
  └─ 고정 설정에서 런타임 테마 파일 참조
```

두 도구가 같은 파일의 내용을 동시에 관리하지 않도록 경계를 정하는 것이 중요하다. Tinty의 등록 파일에 명시한 Hook은 실행 코드이므로 신뢰할 수 있는 출처와 동작도 확인해야 한다.

직접 테마 관리자를 만드는 경우에는 이미 존재하는 팔레트, 빌더, 템플릿 생태계가 해결한 부분을 먼저 조사하는 편이 좋다. 개인 환경에서는 기존 도구를 조합하는 것으로 충분할 수 있고, 새 프로젝트라면 실제로 남아 있는 문제를 해결하는 데 집중할 수 있다. 이 글은 문서 기반 설계 비교이며 실제 적용 품질이나 성능의 실측 결과는 아니다.

## 공식 자료

- [Tinted Theming 홈](https://github.com/tinted-theming/home)
- [원본 Base16](https://github.com/chriskempson/base16)
- [Base24 명세](https://github.com/tinted-theming/base24)
- [Tinty README](https://github.com/tinted-theming/tinty)
- [Tinty 변경 이력](https://github.com/tinted-theming/tinty/blob/main/CHANGELOG.md)

자료 확인 기준: 2026-11-28.

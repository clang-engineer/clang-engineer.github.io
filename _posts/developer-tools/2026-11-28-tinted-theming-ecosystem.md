---
title       : "Base16에서 Tinty까지 — 개발 환경 테마 관리의 역사와 아키텍처"
description : "Base16과 Base24의 색상 표준, Tinted Theming의 계승 과정, 빌더와 테마 관리자의 책임을 살펴보고 CLI 테마 관리 방식을 비교한다."
date        : 2026-11-28 00:00:00 +0900
categories  : [developer-tools, "테마 관리"]
tags        : [base16, base24, tinted-theming, tinty, comparison]
pin         : false
hidden      : false
---

Ghostty, Neovim, tmux, fzf의 색상을 통일하려면 같은 이름의 테마라도 도구마다 다른 설정을 준비해야 한다. [themeset](https://github.com/clang-engineer/themeset)을 개발하며 이 문제를 살펴보다 보면 이미 색상 데이터와 도구별 설정 생성을 분리해 온 Base16 생태계를 만나게 된다.

핵심 질문은 테마를 어디에서 가져오고, 누가 도구별 설정으로 변환하며, 누가 실제 개발 환경에 적용하는가이다.

## 테마 관리 생태계에서의 위치

Base16에서 Tinty로 이어지는 흐름은 전체 테마 관리 역사의 한 갈래다. 다른 접근 방식도 독립적으로 발전해 왔다.

```text
개발 환경 테마 관리
├─ 테마 원본과 도구별 포트 활용
│  └─ Solarized, Dracula, Catppuccin / themeset
├─ 공통 색상 역할과 템플릿 활용
│  └─ Base16, Tinted Theming / Flavours, Tinty
├─ 이미지 기반 색상 생성
│  └─ Pywal
└─ 선언형 시스템 설정
   └─ Stylix (Nix)
```

이 지도는 역사적 계승도가 아니라 대표적인 접근 방식의 분류다. 테마 자체, 색상 표준, 적용 도구는 서로 다른 역할이며 한 프로젝트가 여러 접근 방식을 조합할 수도 있다.

| 접근 방식 | 해결하려는 문제 | 대표 사례 |
|---|---|---|
| 테마별 포트 | 원본 디자인과 앱별 세부 표현 보존 | [Solarized](https://github.com/altercation/solarized) |
| 공통 팔레트 | 여러 테마와 앱의 조합을 재사용 가능한 형태로 생성 | Base16, Tinty |
| 동적 생성 | 배경화면 등 입력 이미지로부터 색상 생성 | [Pywal](https://github.com/dylanaraps/pywal) |
| 선언형 관리 | 색상뿐 아니라 폰트와 배경화면까지 시스템 설정으로 통합 | [Stylix](https://nix-community.github.io/stylix/) |

2011년 Ethan Schoonover의 Solarized는 하나의 디자인을 여러 앱에 제공한 대표적인 초기 사례다. Base16은 특정 테마 하나가 아니라 여러 팔레트에 공통 역할을 정의한다는 점에서 다르다. Pywal은 이미지에서 팔레트를 생성하는 데 초점을 두며, Stylix는 Nix 설정을 통해 적용 범위를 확장한다.

이 접근 방식들은 배타적이지 않다. Stylix는 Base16 팔레트를 사용하거나 배경화면에서 색상을 생성할 수 있으며, Tinty 역시 이미지 기반 scheme 생성 기능을 제공한다. 따라서 색상의 출처, 변환 방식, 적용 시점은 별개의 비교축이다.

이 글에서는 그중 공통 팔레트와 템플릿을 중심으로 발전한 Tinted Theming 계열을 자세히 살펴본다.

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

| 구성 요소 | 책임 | 대표 저장소 |
|---|---|---|
| Scheme | 색상과 메타데이터 | [schemes](https://github.com/tinted-theming/schemes) |
| Style | 색상 역할 정의 | [home](https://github.com/tinted-theming/home), [base24](https://github.com/tinted-theming/base24) |
| Builder | 팔레트와 템플릿으로 파일 생성 | [tinted-builder-rust](https://github.com/tinted-theming/tinted-builder-rust) |
| Template | 도구별 설정 문법으로 변환 | [tinted-terminal](https://github.com/tinted-theming/tinted-terminal), [tinted-tmux](https://github.com/tinted-theming/tinted-tmux) |
| Integration | 앱에서 색상 적용 및 연동 | [tinted-nvim](https://github.com/tinted-theming/tinted-nvim), [tinted-fzf](https://github.com/tinted-theming/tinted-fzf) |
| Manager | 선택, 동기화, 적용 | [tinty](https://github.com/tinted-theming/tinty) |

Chris Kempson은 원 Base16의 창시자이며 Jamy Golden은 Tinty 및 관련 빌더 개발을 담당해 왔다. 전체 생태계는 여러 저장소의 기여자와 메인테이너가 분담하는 구조다. 개별 담당자는 조직의 공식 저장소에서 확인하는 편이 정확하다.

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
| themeset | 도구별 네이티브 및 공식 테마 | 내장 Adapter로 탐색 및 적용 |

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

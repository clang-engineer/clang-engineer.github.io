---
title       : "Neovim을 어디서 시작할까 — Vanilla / kickstart.nvim / LazyVim 비교"
description : "Neovim 환경을 새로 만들거나 다시 익히려 할 때 선택지인 세 가지 시작점의 정체·학습 곡선·추천 맥락 비교 (2026-06 기준)"
date        : 2026-06-16 11:00:00 +0900
updated     : 2026-06-19 09:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [vim, lazyvim, kickstart, distro, nvchad, astronvim]
redirect_from:
  - /posts/neovim/2025-10-04-neovim-distribution/
  - /posts/lazyvim/2025-10-04-neovim-distribution/
pin         : false
hidden      : false
---

Neovim을 새로 시작하거나, 이미 배포판에 익숙하지만 "내부가 어떻게 돌아가는지" 다시 파악하고 싶을 때 흔히 마주치는 선택지는 세 가지다 — **Vanilla Neovim**, **kickstart.nvim**, **LazyVim**(또는 다른 배포판). 셋은 같은 축에 놓여 있지만 출발 코드량·학습 곡선·"내가 무엇을 알게 되는가"가 완전히 다르다.

## 세 가지 시작점

### 1. Vanilla Neovim — 빈 `init.lua`에서 출발

"Vanilla"는 플러그인 이름이 아니라 일반 IT 용어로 **"아무것도 안 깐 순정 상태"** 를 가리킨다 ("바닐라 아이스크림 = 기본맛"에서 온 비유). `nvim`을 설치만 하고 `~/.config/nvim/init.lua`가 비어 있거나 없는 상태에서 직접 처음부터 설정을 짜는 방식이다.

이 길은 가장 자유롭지만 가장 가파르다:

- 플러그인 매니저(lazy.nvim 등)부터 직접 선택·부트스트랩해야 한다
- LSP 설정(`vim.lsp.config()`를 직접 쓸지, `mason`을 쓸지)도 처음부터 결정
- 자동완성(blink.cmp vs nvim-cmp), Treesitter, fuzzy finder까지 모두 본인이 조립
- 표준 베스트 프랙티스가 뭔지 모르는 상태로 시작해 검색·시행착오로 익혀야 함

장점은 "진짜 모든 줄을 본인이 안다"는 점이지만, 실제로는 "**뭘 모르는지도 모르는** 상태에서 출발"하기 때문에 학습 효율이 떨어진다. 완성된 환경까지 가는 데 며칠~몇 주가 걸리고, 도중에 좌절해 다른 길로 갈아타는 경우가 많다.

### 2. kickstart.nvim — 한 파일짜리 학습용 출발 템플릿

`nvim-lua` org가 제공하는 **단일 파일(`init.lua`) 출발 템플릿**. Neovim 코어 개발자 중 한 명인 TJ DeVries가 유지보수하며, 입문자에게 사실상 공식 추천 자리를 잡았다.

오해하기 쉬운 점부터 정리하면:

- **주석만 있는 문서가 아니다.** 실제로 동작하는 완성된 설정이다.
- 코드는 약 1000줄짜리 한 파일에 평평하게 펼쳐져 있고, 각 섹션에 "이게 왜 있는지" 설명 주석이 붙어 있다.
- `nvim` 켜자마자 LSP·자동완성·Treesitter·telescope가 다 작동한다.

기본 구성:

- **lazy.nvim** (플러그인 매니저) 부트스트랩
- **mason + nvim-lspconfig** (LSP 자동 설치·연결)
- **nvim-treesitter** (구문 강조)
- **telescope** (퍼지 파인더)
- **nvim-cmp** (자동완성)
- **gitsigns**, **which-key**, **mini.nvim** 일부

핵심은 "**최소 동작 묶음 + 빽빽한 주석**"이다. LazyVim처럼 extras·distro[^distro] 추상화 없이 한 파일에 평평하게 다 있어서, 읽으면서 그대로 본인 것으로 만들 수 있는 구조다.

의도된 흐름은 "fork → `init.lua`를 본인 config로 복사 → 직접 수정하며 학습". 즉 kickstart 자체를 그대로 데일리 드라이버로 쓰기보다, **본인 dotfiles로 진화시키는 출발점**으로 쓰는 게 본래 목적이다.

### 3. LazyVim (예시 배포판) — 풀 배포판

folke가 만든 배포판. **lazy.nvim**(플러그인 매니저) 위에 plugin spec 모음·키맵 컨벤션·extras 시스템을 얹은 한 단계 위 추상화다.

특징:

- 사용자가 직접 작성하는 config는 수십~수백 줄. 본체(LazyVim core)는 수만 줄로 블랙박스화됨
- `:LazyExtras` 한 번에 언어 팩(LSP + 포맷터 + 린터 + DAP)이 통째로 켜진다
- `<leader>cc`, `<leader>ff` 같은 표준 키맵을 미리 정의해둠
- 기존 distro(NvChad·AstroNvim·LunarVim 등)와 달리 **"framework" 컨셉** — 사용자가 LazyVim 설정을 자기 dotfiles처럼 그대로 override·확장할 수 있는 구조를 지향

가장 빠르게 IDE 수준 환경을 손에 넣을 수 있지만, "내가 뭘 켜고 있는지" 감각은 가장 약하다. 익숙해질수록 `:Lazy` profile이나 `~/.local/share/nvim/lazy/LazyVim/lua/lazyvim/plugins/`를 들춰봐야 "이게 어디서 들어온 거지?"가 풀린다.

LazyVim 외에도 동일 슬롯에 **NvChad**(경량·성능 중심), **AstroNvim**(기능 풍부)이 있다. 이 distro들 간의 차이는 아래 [배포판/프레임워크 카탈로그](#배포판프레임워크-카탈로그) 절에서 정리한다.

## 비교 표

| | 시작 코드량 | 학습 효율 | 환경 완성 속도 | 추천 맥락 |
|---|---|---|---|---|
| **Vanilla** | 0줄 | 낮음 | 매우 느림 (며칠~몇 주) | 이미 Neovim 깊게 아는 사람, 미니멀리스트 |
| **kickstart.nvim** | ~1000줄 (다 주석 있음) | 매우 높음 | 빠름 (즉시) | 원리 학습 목적의 표준 선택 |
| **LazyVim** | 사용자 config 수십 줄, 본체 블랙박스 | 낮음 (편의는 최고) | 가장 빠름 | 빨리 IDE 만들고 싶을 때 |

## 어떻게 고를까

시나리오별 추천:

- **"오늘 당장 IDE처럼 쓰고 싶다"** → LazyVim. 가장 빠른 길.
- **"Neovim 설정의 원리를 처음부터 배우고 싶다"** → kickstart.nvim. r/neovim 공식 추천도 이거다.
- **"이미 LazyVim을 쓰지만 내부가 안 보이는 느낌"** → 두 갈래:
    - **점진적 인식 회복**: `:Lazy` profile, `:LazyExtras`, `~/.local/share/nvim/lazy/LazyVim/lua/lazyvim/plugins/extras/`를 직접 읽으며 "내가 뭘 켜놨는지" 파악. 작업량 대비 효과가 좋다.
    - **kickstart으로 다시 시작**: 시간은 더 들지만 "원리" 감각은 확실히 잡힌다. 1000줄을 다 읽고 본인 것으로 만들면 사실상 "vanilla로 직접 짠 것"과 같은 이해도에 훨씬 빨리 도달한다.
- **"진짜 처음부터 모든 줄을 내가 짜고 싶다"** → Vanilla. 단, "표준 베스트 프랙티스가 뭔지 모르고 출발"하는 비용을 감수해야 한다. 자주 권장되지 않는다.

요약하면 **학습 목적이면 kickstart, 편의 목적이면 LazyVim**이 합리적 디폴트다. Vanilla는 특수 상황 외엔 굳이 권하지 않는 선택이다.

## 배포판/프레임워크 카탈로그

위에서는 LazyVim 하나를 풀 배포판 예시로 봤지만, 같은 "배포판 슬롯"에는 현역 인기 배포판이 여럿 있다. 모두 **Neovim Core(C)는 그대로 두고, 그 위에 Lua 설정·플러그인 레이어를 다르게 얹는** 구조라는 점은 같고, 초점·성능·자유도에서 갈린다 (2026-06 기준).

| 이름 | GitHub Stars | 초점 | 특징 |
|------|------|------|------|
| **LazyVim** | 26.6k | 현대적 Lua 환경 | 모듈형, lazy.nvim 기반, IDE 요소 선택적. 사용자 dotfiles처럼 override·확장 가능한 "framework" 컨셉 |
| **NvChad** | 28.3k | 성능 최적화 | 경량화, 빠른 startup, Lua 모듈화. IDE 기능 최소화 중점 |
| **AstroNvim** | 14.3k | IDE 수준 환경 | LSP/Treesitter/CMP/Telescope 등 대부분 기본 활성화, 모듈형 |
| **kickstart.nvim** | 30.8k | 출발점 템플릿 | 단일 파일(`init.lua`)을 복사해서 직접 수정. Neovim 공식 진영(`nvim-lua` org) 제공, 사실상 표준 starter |

> **LunarVim**은 한때 인기 배포판이었으나 2025-06 이후 업데이트가 멈춰 현역 추천 목록에서 제외했습니다.
> **kickstart.nvim**은 엄밀히는 배포판이 아니라 "직접 수정하는 출발점"이지만, 같은 슬롯에서 자주 비교되어 포함했습니다.

### 공통점

- **Neovim Core Engine(C)은 그대로 사용**
- **Lua 기반 설정**을 사용하여 성능 최적화
- **Lazy-loading** 지원으로 필요할 때만 플러그인 로드
- **플러그인 관리 자동화** 가능 (Telescope, Treesitter, LSP, CMP 등)

### 차이점 요약

| 기준 | LazyVim | NvChad | AstroNvim | kickstart.nvim |
|------|----------|--------|-----------|----------------|
| 기본 기능 범위 | 선택적 | 최소화 | IDE 수준 대부분 활성 | 최소 (직접 추가) |
| 사용자 설정 난이도 | 쉬움 | 쉬움~중간 | 쉬움~중간 | 중간 (Lua 직접 편집) |
| 성능 최적화 | 높음 | 매우 높음 | 중간 | 사용자 책임 |
| 커뮤니티 지원 | 활발 | 활발 | 활발 | 매우 활발 |

선택은 **목적과 사용 스타일**에 따른다:

- **LazyVim**: 모듈형 + 선택적 IDE 환경, override·확장이 쉬움
- **NvChad**: 경량화 + 성능 최적화
- **AstroNvim**: 많은 기능 기본 제공 IDE 환경
- **kickstart.nvim**: 처음부터 직접 조립하고 싶을 때의 출발점

## 부록: `lazy.nvim` vs `LazyVim` — 이름 혼동 정리

이 글에서 가장 헷갈리기 쉬운 두 이름:

| 이름 | 정체 | 제작자 |
|---|---|---|
| **lazy.nvim** | 플러그인 매니저 (개별 도구) | folke |
| **LazyVim** | 배포판 (lazy.nvim 위에 올린 묶음) | folke (같은 사람) |

**같은 사람이 만들었고 이름도 비슷하지만 별개 도구다.** LazyVim이라는 이름 자체가 `lazy.nvim`에서 따온 것일 뿐.

- **kickstart.nvim**이 쓰는 건 `lazy.nvim`(플러그인 매니저). 배포판인 LazyVim은 쓰지 않는다.
- **LazyVim**(배포판) 내부에서도 `lazy.nvim`을 플러그인 매니저로 쓴다.
- 2026년 기준 `lazy.nvim`은 사실상 표준 플러그인 매니저다. 신규 distro·튜토리얼·가이드는 거의 다 이걸 권장한다. 한때 표준이던 **packer.nvim**은 2023년경 unmaintained 선언으로 흐름이 끊겼고, **vim-plug**는 Vim·Neovim 둘 다 지원해야 할 때만 살아남는다.

즉 어느 시작점을 골라도 플러그인 매니저 자리에는 거의 항상 `lazy.nvim`이 들어간다는 점을 알아두면, "왜 distro마다 같은 매니저를 쓰지?"라는 의문이 풀린다.

[^distro]: **distribution**의 줄임말. 리눅스 배포판(Ubuntu·Fedora 등)에서 온 용어로, 코어(여기서는 Neovim) 위에 설정·플러그인·키맵을 미리 조립해 배포한 묶음을 가리킨다. LazyVim·NvChad·AstroNvim이 대표적인 Neovim distro다.

## 2026-06-17 추가 — kickstart.nvim이 `vim.pack`으로 갈아탔다

위 본문에서는 kickstart.nvim이 `lazy.nvim`을 플러그인 매니저로 쓴다고 적었지만, 최근 kickstart.nvim은 **Neovim 0.12에 새로 들어온 빌트인 매니저 `vim.pack`** 으로 이전했다. 2026년 6월 기준 master의 `init.lua` SECTION 3 주석이 이를 명시한다.

> `vim.pack` is a new plugin manager built into Neovim, which provides a Lua interface for installing and managing plugins.

사용 패턴은 단순하다.

```lua
-- 단일 플러그인
vim.pack.add('https://github.com/folke/which-key.nvim')

-- 여러 개 한 번에
vim.pack.add(telescope_plugins)
```

업데이트는 `:checkhealth vim.pack`으로 상태를 확인하고 `:Pack update`로 실행한다. `lazy.nvim`이 제공하는 lazy-load 트리거(`event`/`keys`/`cmd`/`ft`), lockfile, UI 같은 기능은 아직 없다. **"git clone + runtimepath에 추가"** 만 해주는 미니멀한 매니저다.

### 왜 갈아탔나

kickstart의 철학은 "**배포판이 아니라, 한 줄씩 읽고 직접 짜는 출발점**". `init.lua` 첫 줄에 "Kickstart.nvim is *not* a distribution"이라고 박혀 있다. 이 철학상 **외부 의존성을 최소화**하는 게 자연스러운 선택이고, Neovim이 빌트인 매니저를 제공하기 시작했으니 그쪽으로 이동한 셈이다.

> "교육용 = 외부 의존성 0"이라는 방향성. 학습자가 `lazy.nvim`이라는 또 하나의 라이브러리를 먼저 배우지 않아도 되도록 한 결정.

### 실사용 구성에 미치는 함의

- **새로 시작하는 사람**: kickstart로 입문해도 좋다. `vim.pack` API는 작아서 배울 게 적고, 본인의 dotfiles로 진화시킬 때 `lazy.nvim`으로 갈아타는 것도 쉽다.
- **이미 LazyVim을 쓰는 사람**: 굳이 따라갈 이유 없다. lazy-load·lockfile·UI 같은 실사용 기능은 여전히 `lazy.nvim`이 압도적이다.
- **`lazy.nvim`이 표준 자리를 잃는가**: 단기간은 아니다. distro 생태계(LazyVim·NvChad·AstroNvim)가 전부 `lazy.nvim`에 의존하고 있고, `vim.pack`은 아직 lazy-load 같은 핵심 기능이 빠져 있다. **kickstart의 "미니멀 교육용" 슬롯에만 적합한 단계**.

### 2026년 기준 매니저 지형

| 매니저 | 위치 | 비고 |
|---|---|---|
| **lazy.nvim** | 사실상 표준. distro 전부가 이걸 씀 | lazy-load, lockfile, UI 풀세트 |
| **vim.pack** | Neovim 0.12+ 빌트인 | 외부 의존성 0. 교육용·미니멀 구성용. lazy-load 없음 |
| **packer.nvim** | 2023년경 unmaintained | 신규엔 비추천 |
| **paq-nvim** | 미니멀리스트의 대표 | `vim.pack` 등장 전 이 자리. 여전히 활발 |

`lazy.nvim`이 표준이라는 본문의 결론은 유효하지만, kickstart에 한해 **"빌트인으로 갈 수 있는 곳은 빌트인으로"** 라는 흐름이 시작됐다는 점은 짚어둘 만하다.

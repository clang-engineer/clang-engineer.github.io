---
title       : "Neovim을 어디서 시작할까 — Vanilla / kickstart.nvim / LazyVim 비교"
description : "Neovim 환경을 새로 만들거나 다시 익히려 할 때 선택지인 세 가지 시작점의 정체·학습 곡선·추천 맥락 비교 (2026-06 기준)"
date        : 2026-06-16 11:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [vim, neovim, lazyvim, kickstart, guide]
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

핵심은 "**최소 동작 묶음 + 빽빽한 주석**"이다. LazyVim처럼 extras·distro 추상화 없이 한 파일에 평평하게 다 있어서, 읽으면서 그대로 본인 것으로 만들 수 있는 구조다.

의도된 흐름은 "fork → `init.lua`를 본인 config로 복사 → 직접 수정하며 학습". 즉 kickstart 자체를 그대로 데일리 드라이버로 쓰기보다, **본인 dotfiles로 진화시키는 출발점**으로 쓰는 게 본래 목적이다.

### 3. LazyVim (예시 배포판) — 풀 배포판

folke가 만든 배포판. **lazy.nvim**(플러그인 매니저) 위에 plugin spec 모음·키맵 컨벤션·extras 시스템을 얹은 한 단계 위 추상화다.

특징:

- 사용자가 직접 작성하는 config는 수십~수백 줄. 본체(LazyVim core)는 수만 줄로 블랙박스화됨
- `:LazyExtras` 한 번에 언어 팩(LSP + 포맷터 + 린터 + DAP)이 통째로 켜진다
- `<leader>cc`, `<leader>ff` 같은 표준 키맵을 미리 정의해둠
- 기존 distro(NvChad·AstroNvim·LunarVim 등)와 달리 **"framework" 컨셉** — 사용자가 LazyVim 설정을 자기 dotfiles처럼 그대로 override·확장할 수 있는 구조를 지향

가장 빠르게 IDE 수준 환경을 손에 넣을 수 있지만, "내가 뭘 켜고 있는지" 감각은 가장 약하다. 익숙해질수록 `:Lazy` profile이나 `~/.local/share/nvim/lazy/LazyVim/lua/lazyvim/plugins/`를 들춰봐야 "이게 어디서 들어온 거지?"가 풀린다.

LazyVim 외에도 동일 슬롯에 **NvChad**(경량·성능 중심, 28.3k stars), **AstroNvim**(기능 풍부, 14.3k stars)이 있다. 자세한 distro 간 비교는 [Neovim 배포판/프레임워크 비교](/posts/lazyvim/2025-10-04-neovim-distribution/) 글 참고.

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

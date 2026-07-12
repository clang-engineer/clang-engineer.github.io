---
title       : "Telescope vs fzf — 퍼지 파인더의 경계선"
description : "fzf는 Neovim 없이도 도는 독립 Go 바이너리, Telescope는 Neovim API에 얹힌 순수 Lua 플러그인. '둘 다 파일 검색된다'는 겹치는 기능 하나일 뿐, 어디서 도느냐가 본질이다. 나아가 2026년 plenary.nvim 아카이빙과 snacks.picker 부상으로 지형이 어떻게 바뀌는지도 짚는다."
date        : 2026-07-03 09:00:00 +0900
updated     : 2026-07-12 17:30:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [telescope, fzf, picker, lua, ripgrep]
pin         : false
hidden      : false
---

Neovim 설정을 훑다 보면 파일을 퍼지 검색하는 도구로 fzf와 Telescope가 나란히 등장한다. "둘 다 파일 검색되는데 뭐가 다르지?"에서 멈추기 쉽지만, 사실 둘은 정체가 다른 물건이다. 이 글은 특정 배포판의 기본값이 아니라 **fzf와 Telescope의 아키텍처 차이**를 정리한다.

## 결론 먼저

- **fzf** — Go로 작성된 독립 실행 CLI 바이너리다. 셸(`Ctrl-R` 히스토리, 파이프 입력), Vim, tmux 어디서든 돈다. Neovim이 없어도 동작하는 게 핵심.
- **Telescope** — Neovim 전용 순수 Lua 플러그인이다. Neovim API에 깊이 통합돼서 파일뿐 아니라 LSP 심볼, diagnostics, git, buffer, treesitter 같은 **에디터 내부 데이터**를 picker로 다룬다.
- 즉 갈림길은 **어디서 도느냐(OS 전역 vs 에디터 내부)**와 **무엇을 검색 대상으로 넘기느냐**다. "파일 검색"은 겹치는 기능 하나일 뿐이다.

## 둘 다 "파일 검색 모듈"이 아니라 퍼지 매칭 엔진이다

정확히 말하면 둘 다 **fuzzy finder(퍼지 매칭 엔진)**이고, 파일 검색은 여러 용도 중 하나일 뿐이다. 핵심은 **무엇을 입력으로 넘기느냐**.

- fzf는 그냥 "줄 목록을 받아 퍼지 매칭해주는 엔진"이다. 파일 목록을 넣으면 파일 검색, 셸 히스토리를 넣으면 히스토리 검색, `git branch` 출력을 넣으면 브랜치 검색. 검색 대상이 뭐든 상관 안 한다.
- Telescope도 같은 구조인데, 대신 Neovim 안의 것들(LSP 심볼, diagnostics, buffer 등)을 검색 대상으로 쉽게 꽂을 수 있게 picker들이 미리 만들어져 있다.

> 비유하면 전기포트와 가스레인지가 둘 다 물을 끓일 수 있다고 같은 물건은 아니다. 겹치는 기능 하나로 보면 같아 보여도, fzf는 OS 전역 도구, Telescope는 에디터 내장 데이터까지 다루는 통합 도구라는 게 본질이다.
{: .prompt-info }

## 어디까지가 Neovim 내부이고 어디부터 외부 프로세스인가

Telescope가 순수 Lua라고 해서 혼자 다 하는 건 아니다. 경계가 둘로 나뉜다.

- **Lua 레벨 의존성 (Neovim 내부)** — `plenary.nvim`이 유일한 진짜 의존성이다. 비동기 처리(async/await), job 제어, 경로 처리, 파일시스템 함수 등 Telescope의 거의 모든 내부 동작이 그 위에 올라간다. 없으면 Telescope 자체가 로드되지 않는다. `nvim-web-devicons`는 아이콘용 선택 의존성.
- **런타임에 부르는 시스템 바이너리 (외부 프로세스)** — picker별로 외부 CLI를 spawn 한다. `live_grep`/`grep_string`은 **ripgrep(rg)**를 내부적으로 호출(사실상 필수급), 파일 검색은 **fd**를 빠른 대안으로, git picker는 **git**을 부른다. 이건 Lua 의존성이 아니라 시스템 도구다.

즉 Telescope는 "Lua로 짠 picker/preview 프레임워크(내부) + 무거운 검색은 외부 바이너리에 위임" 구조다. fzf가 **통째로** 외부 프로세스인 것과 대비된다.

## 핵심 트레이드오프

| 축 | fzf | Telescope |
| --- | --- | --- |
| 범위 | OS 전역 | Neovim 내부 |
| 언어/통합 | 외부 바이너리 | Lua 네이티브 |
| 속도 | 대형 저장소에서 빠른 경향(네이티브) | 상대적으로 느림 |
| 확장성 | 범용 | Neovim 생태계(LSP 등) 연동 압도적 |

## 둘을 섞는 선택지

경계를 이해하면 "둘 중 하나"가 아니라 섞는 조합도 보인다.

- **telescope-fzf-native.nvim** — Telescope의 정렬 알고리즘을 fzf의 C 구현으로 바꿔 속도를 끌어올리는 확장. C로 컴파일되므로 `make`가 필요하다. picker UI는 Telescope 그대로, 매칭만 빨라진다.
- **fzf-lua** — fzf 바이너리를 Telescope처럼 Neovim picker로 감싼 플러그인. fzf의 속도 + 에디터 통합을 둘 다 가져간다. 가볍고 빠른 쪽을 원할 때 매력적이다.

kickstart.nvim처럼 정리하는 흐름이면 Telescope + fzf-native 조합이 무난하고, plenary + fzf-native + ripgrep이 기본 조합이다. 다만 아래에서 보듯 이 "기본 조합"의 발밑이 2026년 들어 흔들리고 있다.

## 2026 지형 변화 — plenary 아카이빙과 snacks.picker

위 구조에서 Telescope의 유일한 Lua 의존성이 `plenary.nvim`이라고 했다. 그런데 **`plenary.nvim`은 더 이상 활발히 유지되지 않으며, 2026-06-30자로 아카이브**되었다(그 이후로는 보안·치명적 버그 수정만, 신규 기능은 없음). neo-tree·CopilotChat·mcphub 등 plenary에 얹혀 있던 플러그인들이 잇달아 의존성을 걷어내는 중이다. Telescope는 여전히 plenary 위에 서 있으므로, **장기 설정 관점에선 "유지되지 않는 토대"를 물고 있는 셈**이다.

그 빈자리를 채우며 부상한 게 folke의 **snacks.nvim**이다. QoL 플러그인 묶음인데, 그 안의 **snacks.picker가 LazyVim의 기본 picker 자리를 Telescope에서 넘겨받았다.** 핵심은 snacks.picker가 **plenary 의존성을 걷어내고** folke 자체의 async·레이아웃 유틸로 대체했다는 점 — 앞 절의 "plenary가 유일한 필수 의존성" 구조에서 벗어난 것이다.

정리하면 퍼지 파인더 선택지가 셋으로 갈라졌다.

| 선택지 | 성격 | 의존성 | 결 |
| --- | --- | --- | --- |
| **Telescope** | 성숙·확장 생태계 최대 | plenary(아카이브됨) | 안정적이나 토대가 유지보수 종료 |
| **snacks.picker** | LazyVim 기본, 수직 통합 | 없음(folke 자체 유틸) | 빠르게 움직임 · folke 의존 집중(SPOF) |
| **mini.pick** | echasnovski의 독립 모듈 | 없음(zero-dep) | 보수적·미니멀, 모듈 독립성 |

여기에 **fzf-lua**는 "plenary 스택도 folke 단일 의존도 피하고 속도만 취하는" 제3의 탈출구로 재조명받는다.

> 어느 하나가 "정답"은 아니다. 생태계·확장성이면 Telescope, LazyVim 기본에 얹혀 가면 snacks.picker, 의존성을 최소화하고 싶으면 mini.pick/fzf-lua다. 다만 **"plenary + Telescope가 영원한 표준"이라는 전제는 2026년부로 깨졌다**는 것만은 분명하다.
{: .prompt-warning }

## 함정 정리

1. "둘 다 파일 검색된다"로 같은 물건 취급하지 말 것 — fzf는 **OS 전역 도구**, Telescope는 **에디터 내부 데이터 통합 도구**다.
2. Telescope는 순수 Lua라도 **`ripgrep`/`fd`/`git`을 런타임에 spawn**한다. `live_grep`이 안 되면 대개 `rg` 미설치가 원인.
3. `plenary.nvim`은 선택이 아니라 **필수** 의존성이다. 없으면 Telescope가 아예 로드되지 않는다. `nvim-web-devicons`만 선택 의존성.
4. `telescope-fzf-native.nvim`은 **`make` 컴파일**이 필요하다 — 빌드가 빠지면 정렬 가속이 안 걸린다.

## 더 깊이

- fzf 공식 저장소 — 셸/Vim/tmux 통합 예시
- `telescope.nvim`, `plenary.nvim`, `telescope-fzf-native.nvim`, `fzf-lua` 각 저장소 README
- ripgrep(`rg`) / fd 문서 — Telescope가 위임하는 검색 백엔드

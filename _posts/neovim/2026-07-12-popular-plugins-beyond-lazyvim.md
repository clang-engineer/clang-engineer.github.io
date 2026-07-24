---
title       : "LazyVim 밖의 인기 Neovim 플러그인 — 기본값의 대안과 2025-2026 라이저"
description : "LazyVim이 기본으로 얹는 플러그인은 이미 문서화했다. 이 글은 그 밖 — snacks.picker↔fzf-lua, neo-tree↔oil.nvim, blink↔nvim-cmp 같은 '기본값의 대안'과, harpoon·neogit·avante 같은 기본에 없는 인기템, 그리고 blink·oil·avante로 이어지는 2025-2026 라이저를 별 개수·정착도와 함께."
date        : 2026-07-12 09:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [plugin, lazyvim, oil, harpoon, blink]
pin         : false
hidden      : false
---

> 이 글은 [Neovim 로드맵](/posts/neovim/2026-06-16-neovim-roadmap/)의 **부록 A(비교·생태계)** 다. LazyVim이 *기본으로* 켜는 플러그인의 키맵·역할은 [LazyVim 주요 플러그인 정리](/posts/lazyvim/2026-06-07-lazyvim-plugins-overview/)와 [기능 지도](/posts/lazyvim/2026-06-07-lazyvim-feature-plugin-map/)에서 다뤘다. 이 글은 그 **밖의** 인기 플러그인 — 기본값을 갈아탈 때의 대안과, 기본에 아예 없는 인기템이다.
{: .prompt-tip }

LazyVim을 쓰면 인기 플러그인 대부분이 이미 깔려 있다 — snacks·blink·neo-tree·gitsigns·flash·conform… 그래서 "인기 Neovim 플러그인" 카탈로그를 또 나열하면 대부분 이미 아는 것이다. 가치 있는 질문은 다르다: **"기본값 대신 뭘 얹나, 그리고 왜 갈아타나."** 이 글은 그 각도로 정리한다. (별 개수는 2026-07 실측, 정착도는 dotfyle의 실 사용 config 수·커뮤니티 반응 기준.)

## 결론 먼저

- **기본값이 있는 자리**는 대체로 기본값이 정답이다. 갈아타는 건 명확한 이유(속도·철학·특정 기능)가 있을 때다.
- 이 글에서 **진짜 얹을 만한 것**: `oil.nvim`(파일=버퍼), `harpoon`(파일 북마크), `neogit`/`diffview`(Git UI). 셋 다 LazyVim 기본에 없고 평판이 뚜렷하다.
- **AI 지형은 별개**다. 인기(별)와 정착이 가장 어긋나는 영역이라 따로 뗐다.

---

## A. 기본값의 대안 — "이미 X가 있는데, 왜 Y로?"

LazyVim 기본값을 대조 기준선으로 놓고 본다.

### 파일 탐색기: neo-tree(기본) ↔ **oil.nvim**

이 글에서 가장 강하게 추천하는 대안. **oil.nvim**(6.7k⭐, 활발)은 디렉토리를 **일반 버퍼처럼** 연다 — 파일 목록이 편집 가능한 텍스트고, `dd`로 삭제, 이름 바꾸고 `:w`로 저장하면 실제 파일시스템에 반영된다. Vim 편집 근육을 파일 관리에 그대로 쓰는 게 핵심이라 "다시 트리로 못 돌아간다"는 호평이 뚜렷하다(dotfyle 활성 config 최다급).

neo-tree(5.5k⭐, LazyVim 기본)와 **대체가 아니라 병용**하는 패턴이 흔하다 — 프로젝트 구조는 트리로 훑고, 매일의 파일 조작은 oil로. nvim-tree(8.6k⭐)는 별이 제일 높지만 활성 config는 oil·neo-tree보다 적은 **저무는 기득권** 신호다.

### 퍼지 파인더: snacks.picker(기본) ↔ **fzf-lua / telescope**

LazyVim의 현재 기본은 **snacks.picker**(snacks.nvim 7.8k⭐)다. 갈아탈 후보 둘:

- **fzf-lua**(4.4k⭐) — "정착해서 눌러앉는" 픽. 대형 저장소에서 가장 빠르고 백로그가 작다(open issue 한 자릿수). LazyVim도 14부터 이걸 기본으로 밀었던 흐름.
- **telescope**(19.6k⭐) — 별은 압도적이지만 사실상 **유지보수 모드**(기능보다 버그 수정). 신규 유입은 줄지만 LSP·git 등 picker 생태계는 여전히 최대.

셋의 구조 차이(OS 전역 fzf vs 에디터 내부 Lua)는 [Telescope vs fzf](/posts/neovim/2026-07-03-telescope-vs-fzf/)에서 따로 팠다. LazyVim에선 `vim.g.lazyvim_picker`로 전환한다.

### 자동완성: blink.cmp(기본) ↔ **nvim-cmp**

**blink.cmp**(6.4k⭐)가 LazyVim·AstroNvim 기본이 되면서, 오래된 표준 **nvim-cmp**(9.5k⭐)를 밀어내는 **횃불 넘김**이 진행 중이다. blink은 Rust 퍼지 매처(~6x 빠름)와 좋은 문서로 올라왔다. 단 v2 breaking change가 있어 `version = "1.*"` 고정이 안전하고, Rust 바이너리 대신 Lua 매처를 고르는 사람도 있다. nvim-cmp는 아직 아카이브는 아니지만 저자가 "취미 프로젝트"라 명시한 상태 — 신규 설정이면 blink이 기본값.

### 상태줄: lualine(기본) ↔ heirline

**lualine**(8.0k⭐, 기본)이 de-facto다. **heirline**(1.3k⭐)은 "직접 컴포넌트를 조립하는" 라이브러리 — 완전 커스텀 상태줄을 짜려는 소수 파워유저용이라, 대부분은 lualine에서 멈추는 게 맞다.

### 모션: flash(기본) ↔ leap

**flash.nvim**(4.1k⭐, 기본)은 2글자 점프 + Treesitter·검색 통합. 원조 격인 **leap.nvim**(5.0k⭐)은 더 미니멀한 2글자 점프에 집중한다. 기능이 더 필요 없으면 flash로 충분하고, 가벼운 원조 감성을 원하면 leap.

### 포맷·린트: conform+nvim-lint(기본) ↔ none-ls

LazyVim 기본은 **conform.nvim**(5.3k⭐, 포맷) + **nvim-lint**(2.8k⭐)다. 원조 **null-ls는 아카이브**됐고, 그 포크 **none-ls**(3.2k⭐)가 활발히 유지된다. 요즘 합의는 "포맷·린트는 conform+nvim-lint, 단 **code action은 none-ls로 남겨두라**"(대체가 가장 까다로운 조각).

> **별이 높다고 갈아탈 이유는 아니다.** telescope(19.6k)·nvim-cmp(9.5k)·nvim-tree(8.6k)는 별이 대안보다 훨씬 높지만 모두 **저무는 기득권**이다. 별은 누적 도달(나이 보정 안 됨)일 뿐, "지금도 정착하나"는 dotfyle 활성 config 수·커밋 속도가 더 정직하다.
{: .prompt-info }

---

## B. LazyVim 기본에 없는 인기템

여기가 **순수 추가**다. 기본값과 겹치지 않으니 얹으면 그대로 새 기능이다.

| 플러그인 | 별 | 무엇 |
|---|---|---|
| **harpoon** | 9.2k | ThePrimeagen의 파일 북마크. 자주 쓰는 4~5개 파일을 즉시 점프. 기본에 대응물 없음 |
| **neogit** | 5.5k | magit 스타일 Git UI (커밋·브랜치·리베이스를 버퍼에서) |
| **diffview.nvim** | 5.7k | diff·merge·파일 히스토리 뷰어. neogit과 짝 |
| **obsidian.nvim** | 2.0k | Obsidian 볼트를 Neovim에서 편집 (커뮤니티 포크가 유지 중) |
| **nvim-dap** | 7.2k | 디버거 코어. LazyVim은 `dap.core` extra로만 얹음 |

- **harpoon**은 이 표에서 가장 널리 쓰인다. LazyVim의 buffer/picker와 목적이 달라(전환이 아니라 *고정 북마크*) 병용 가치가 크다.
- Git은 LazyVim이 gitsigns(gutter) + lazygit(TUI)로 커버하지만([Git 플러그인 구성](/posts/lazyvim/2026-06-09-lazyvim-git-plugins/)), **에디터 안에서** magit식으로 다루고 싶으면 neogit + diffview 조합이 그 빈자리다.

---

## C. AI 지형 — 인기와 정착이 가장 어긋나는 곳

별과 실사용이 가장 벌어지는 영역이라 따로 뗐다. 블로그는 지금까지 [CopilotChat 에러](/posts/neovim/2026-06-17-copilotchat-copilot-business-model-not-found/) 정도만 다뤘다.

| 도구 | 별 | 정착 | 평가 |
|---|---|---|---|
| **avante.nvim** | 18.0k | config 224 | 별·설치는 폭발했지만 **가장 churn 심함** — 컨텍스트 한계·토큰 비용·open issue 200+. README가 불안정성을 자인 |
| **codecompanion.nvim** | 6.7k | config 259 | "하나만 깐다면 이것"으로 미는 **안정 픽**. 마이그레이션이 이쪽으로 흐름 |
| copilot.lua | 4.1k | config 669 | 인라인 완성 de-facto. "무난하나 특별하진 않음", 점점 blink 소스로 흡수 |
| supermaven-nvim | 1.5k | - | **사망 확인** — 2024-10 마지막 커밋, Cursor 인수 후 2025-11 제품 종료. "최고의 탭 완성이었다"는 애도만 남음 |

> **AI 플러그인은 별로 고르면 다친다.** avante는 별(18k)로 보면 압도적이지만 정착 config는 224로, **hype가 실사용을 앞지른** 상태다. "하나만 안정적으로"면 codecompanion, "인라인 완성만"이면 copilot.lua가 더 현실적인 선택이다. supermaven 사례(인수→종료)는 AI 플러그인 의존의 리스크를 보여준다 — 에디터 밖 터미널 에이전트(Claude Code 등)로 무게추가 옮겨가는 흐름도 함께 봐야 한다.
{: .prompt-warning }

---

## 2025-2026 라이저 — 한 줄기로

위를 관통하는 서사가 있다. 최근 1~2년 **기본값 자체가 이동**했다:

- **blink.cmp** — nvim-cmp를 밀어내고 배포판 기본으로.
- **snacks.nvim** — folke의 QoL 허브. dashboard·picker·notifier·terminal을 한 저장소로 묶어 개별 플러그인 난립을 줄이는 **anti-bloat** 흐름.
- **oil.nvim** — "파일=버퍼" 철학으로 탐색기 판을 흔듦.
- **fzf-lua** — 속도로 telescope의 기본 자리를 잠식.
- **avante / codecompanion** — 변동성 큰 AI 레이스(위 C).

방향을 한마디로: **거대 단일 플러그인(telescope·nvim-cmp) → 빠르고 모듈화된 대안(fzf-lua·blink) + folke의 통합 허브(snacks)**. LazyVim이 기본값을 이 방향으로 이미 옮겼기 때문에, LazyVim 사용자는 라이저 대부분을 **자동으로** 타고 있는 셈이다.

## 정리

- **기본값이 있는 자리**는 명확한 이유 없으면 그대로 둔다. 갈아탈 값어치가 뚜렷한 건 picker(fzf-lua, 속도)와 completion(blink, 이미 기본화) 정도.
- **순수 추가로 얹을 만한 것**: oil(파일=버퍼), harpoon(북마크), neogit+diffview(Git UI).
- **AI는 별이 아니라 정착으로** — codecompanion(안정) / copilot.lua(인라인), avante는 감안하고.
- 카탈로그 전체 탐색은 [awesome-neovim](https://github.com/rockerBOO/awesome-neovim)과 [dotfyle.com](https://dotfyle.com)(실 사용 config 랭킹)에서.

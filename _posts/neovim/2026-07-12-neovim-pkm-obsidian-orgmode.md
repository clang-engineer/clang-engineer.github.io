---
title       : "Neovim과 PKM — Obsidian·org-mode, 무엇을 왜 쓰나"
description : "org-mode가 '단일 통합 시스템'으로 독보적인 반면 Neovim은 플러그인을 조합해 PKM을 구성한다. 평문 마크다운·로컬 저장이라 Neovim과 충돌 없이 공존하는 Obsidian을 중심으로, 왜 갈아타기보다 병행이 자연스러운지 정리한다."
date        : 2026-07-12 19:40:00 +0900
updated     : 2026-07-12 19:40:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [pkm, obsidian, org-mode, markdown, notes]
pin         : false
hidden      : false
---

Neovim으로 노트·지식관리(PKM, Personal Knowledge Management)를 하려다 보면 "org-mode 대체재가 없다"는 말과 "Obsidian 깔아라"는 말이 동시에 나온다. 둘 다 반은 맞다. 갈림길을 정리한다.

## org-mode가 독보적인 건 "통합"이지 "기능"이 아니다

Emacs의 org-mode는 노트·할일·일정·아젠다·문헌·코드 실행(org-babel)까지 **하나의 몸통**으로 통합한 시스템이다. 수십 년 누적된 단일 시스템이라 이 "통합의 깊이"에선 대체재가 없다.

반면 Neovim은 철학이 다르다 — **여러 플러그인을 조합**해 PKM을 구성한다.

| | org-mode (Emacs) | Neovim PKM |
|---|---|---|
| 형태 | 단일 시스템이 전부 통합 | 플러그인 조합 |
| 깊이 | 한 몸통, 수십 년 누적 | 각 플러그인이 한 조각 |
| org만의 것 | 아젠다 뷰, org-babel, 캡처 | 부분적으로만 재현 |

즉 **"통합 시스템 하나"로 보면 org-mode가 독보적**이고, **"기능별 도구"로 보면 Neovim도 다 있다.** Vim 진영다운 조합형 사고에 익숙하면 Neovim PKM이 오히려 더 자연스럽다.

## Neovim의 PKM 플러그인

- **obsidian.nvim** — 제일 인기. Zettelkasten식 노트 ID 생성, 위키링크, 체크박스 토글, 링크 따라가기. 마크다운 기반이라 **Obsidian 앱과 같은 파일을 공유**한다.
- **nvim-orgmode** — Neovim용 org-mode 구현체. 꾸준히 크지만 "진짜" Org만큼 강력하진 않다(위 표의 격차가 여기).
- **marksman** (LSP) — 위키링크 자동완성·정의이동·참조찾기·리네임을 LSP로. LazyVim이면 `lang.markdown` extra로 바로 붙는다.
- **markview.nvim** — Obsidian처럼 버퍼 안에서 마크다운 라이브 렌더링.
- zettelkasten.nvim 등 제텔카스텐 전용 플러그인 다수.

## Obsidian — Neovim과 싸우지 않고 공존한다

Obsidian은 **로컬 마크다운 파일 기반의 PKM 앱**이다. 핵심은 Neovim 사용자에게 특히 잘 맞는다.

- **로컬-퍼스트 평문 마크다운** — 노트가 하드디스크에 평문 파일로 저장된다. 독점 포맷·벤더 락인·계정 요구가 없어, **어떤 에디터로도 열리고 git·grep·sed로 다룰 수 있다.** Neovim으로 그대로 편집 가능하다는 뜻이다.
- **양방향 링크 + 그래프 뷰** — `[[이중 대괄호]]`로 노트를 링크하면 백링크로 서로 연결되고, 그래프 뷰가 이 연결망을 노드 네트워크로 그린다.
- **방대한 플러그인** — Dataview(노트를 DB처럼 쿼리), Templater, 칸반, 간격반복 등.
- **한계** — 실시간 협업은 없다. 단일 사용자용이다.

그래서 흔한 셋업이 **양자택일이 아니라 둘 다**다.

- 노트 *작성·편집*은 Neovim(또는 Obsidian 내장 Vim 모드)으로 — 모달 근육 그대로.
- *그래프 뷰·백링크 탐색·렌더링*은 Obsidian 앱으로 — Neovim이 약한 시각화만 보완.

같은 마크다운 파일을 두 도구가 공유하니 기존 환경을 하나도 안 버린다. **Obsidian은 마크다운 파일들의 지도, Neovim은 그 파일을 깎는 칼** — 칼은 그대로 두고 지도만 얻는 셈이다.

## 시장에서의 위치 — 판이 다르다

- **Notion** — 노트·지식관리 **전체 시장**의 강자지만 주력은 *팀 협업·기업용*이다. 개인 PKM과는 결이 다르다.
- **Obsidian** — *PKM 틈새*의 사실상 표준. 평문·로컬·데이터 소유권·오프라인을 중시하는 개발자·연구자의 디폴트.
- **Logseq** — PKM 틈새에서 Obsidian의 주 대항마. 아웃라이너식(불릿·블록 단위 연결) 사고에 맞는다. 둘 다 로컬·평문이라 갈아타도 손실이 적다.

"Obsidian이 시장을 지배했나"의 답은 — **전체 시장은 Notion, PKM 틈새는 Obsidian.** 평문·로컬·git·Neovim 공존을 우선순위로 두면 바로 그 틈새가 당신의 시장이라, 그 안에선 디폴트 강자가 맞다.

## 정리

- org-mode의 강점은 **통합의 깊이**(단일 시스템). Neovim은 플러그인 **조합**으로 PKM을 짠다.
- Obsidian은 **평문 마크다운·로컬 저장**이라 Neovim과 충돌 없이 공존한다 — 편집은 Neovim, 시각화는 Obsidian.
- PKM이 당긴다면 Emacs로 전면 이주보다 **obsidian.nvim 먼저**가 진입 비용이 훨씬 낮다.

> Emacs 자체에 대한 Neovim 사용자 관점은 [Neovim 사용자가 본 Emacs](/posts/neovim/2026-07-03-neovim-user-view-of-emacs/) 참고.
{: .prompt-info }

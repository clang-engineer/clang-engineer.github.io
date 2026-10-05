---
title       : "Editor Map — Vim·Neovim·Emacs·Helix·Zed의 관계"
description : "Vim 계열, Emacs, Helix, Zed를 계보·편집 모델·확장 방식·장단점으로 비교해 에디터 지형을 한눈에 정리한다."
date        : 2026-10-05 18:50:00 +0900
updated     : 2026-10-05 18:50:00 +0900
categories  : [developer-tools, "관계도"]
tags        : [editor, vim, neovim, emacs, helix, zed, kakoune, map]
pin         : false
hidden      : false
---

에디터를 비교할 때 단축키만 보면 관계가 잘 안 보인다. **편집 모델**, **확장 방식**, **기본 통합 수준**을 같이 봐야 한다.

## 관계도

```text
vi
└─ Vim
   └─ Neovim
      ├─ Vim식 operator → motion
      ├─ Lua API / plugin ecosystem
      └─ LSP·Treesitter 등 현대 개발 기능 확장

Kakoune
└─ selection-first editing
   └─ Helix
      ├─ Kakoune의 선택 우선 모델
      └─ Neovim의 현대 개발 도구 경험에서도 영향

Emacs
└─ 별도 계보
   ├─ Elisp runtime
   ├─ programmable environment
   └─ evil-mode로 Vim식 modal editing을 얹을 수 있음

Zed
└─ 현대 GUI code editor
   ├─ native UI / 성능
   ├─ 협업·개발 기능 통합
   └─ Vim mode / Helix mode로 modal editing 제공
```

Helix는 "Neovim 다음 버전"이 아니라 **Kakoune과 Neovim에서 영향을 받은 별도 에디터**이고, Emacs는 애초에 다른 철학의 계보다. Zed 역시 Vim 계보라기보다 현대 GUI 코드 에디터 쪽에 가깝다.

## 핵심 비교

| 도구 | 중심 모델 | 강점 | 비용 |
|---|---|---|---|
| Vim | modal editing | 강력한 편집 문법, 넓은 설치 기반 | 현대 IDE 기능은 외부 구성 비중이 큼 |
| Neovim | Vim 모델 + 확장 플랫폼 | Lua/API, 큰 플러그인 생태계, 조립 자유도 | 설정과 생태계 이해 비용 |
| Emacs | Elisp runtime | 런타임 재프로그래밍, org-mode·magit 같은 깊은 통합 | 학습 곡선과 독자적 생태계 |
| Helix | selection-first modal editing | 기본 통합이 강하고 설정 부담이 작음 | Neovim보다 작은 확장 생태계 |
| Zed | native GUI editor | 빠른 GUI, 협업·개발 기능 통합 | 터미널 중심 조립형 환경과는 철학이 다름 |

## Vim/Neovim과 Helix는 무엇이 다른가

Vim 계열은 보통 **동작(operator)을 정하고 범위(motion)를 지정**한다.

```text
delete + word
change + inside + quote
```

Helix는 반대로 **먼저 범위를 선택하고 동작을 적용**하는 selection-first 모델을 쓴다.

```text
select word
→ delete / change / copy
```

그래서 겉으로는 둘 다 modal editor지만 손에 익는 문법이 다르다.

## Emacs는 왜 같은 표에 있으면서도 다른가

Emacs의 핵심은 modal editing이 아니다. **Elisp로 실행 중인 에디터 자체를 계속 확장하는 환경**에 가깝다.

Vim 사용자가 Emacs를 볼 때는 아래 글이 연결된다.

- [LazyVim 사용자가 본 Emacs — 에디터가 아니라 Elisp 런타임]({% post_url developer-tools/2026-07-03-neovim-user-view-of-emacs %})

## Zed는 어디에 놓이는가

Zed는 Neovim처럼 작은 코어에 모든 것을 플러그인으로 조립하는 방향보다, **빠른 native GUI 안에 개발 경험을 통합**하는 쪽이다.

```text
Neovim
작은 core
→ 필요한 기능 조합

Zed
native GUI
→ 개발 기능을 제품 안에서 통합
```

따라서 Zed와 Neovim은 기능 목록이 겹쳐도 설계 철학은 꽤 다르다.

## 어떻게 읽으면 좋은가

- 편집 문법의 계보가 궁금하다 → Vim / Kakoune / Helix
- 확장 플랫폼이 궁금하다 → Neovim / Emacs
- GUI 통합형 현대 편집기가 궁금하다 → Zed
- Neovim 자체를 깊게 보고 싶다 → [Neovim Roadmap]({% post_url neovim/2026-06-16-neovim-roadmap %})

이 지도는 도구를 고르는 결론보다 **왜 서로 다른 에디터가 계속 생기는지**를 이해하는 데 목적이 있다.

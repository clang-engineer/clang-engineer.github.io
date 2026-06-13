---
title       : LazyVim의 Git 플러그인 구성 — gitsigns · lazygit · snacks
description : 
date        : 2026-06-09 12:00:00 +0900
updated     : 2026-06-09 12:00:00 +0900
categories  : [lazyvim, "플러그인"]
tags        : [neovim, gitsigns, lazygit, snacks, git]
pin         : false
hidden      : false
---

## 개요

LazyVim은 git 작업을 위해 별도의 무거운 플러그인을 잔뜩 깔지 않는다. **역할이 다른 3개의 구성요소**가 한 세트로 묶여 동작한다.

| 구성요소 | 역할 | 한 줄 요약 |
|---------|------|-----------|
| `gitsigns.nvim` | 변경 추적 · hunk 조작 | 편집 중인 파일의 변경점을 줄 단위로 보고 다룸 |
| `lazygit` 연동 (snacks 경유) | 실제 git 작업 | 커밋 · 푸시 · 브랜치 등 본격 작업 |
| `snacks.nvim`의 git 기능 | 부가 조회 | blame · 파일 히스토리 · log · GitHub 열기 |

핵심은 **"보는 것(gitsigns)"과 "하는 것(lazygit)"이 분리**되어 있다는 점이다. 일상적인 부분 stage는 에디터 안에서 gitsigns로, 커밋·푸시 같은 묵직한 작업은 lazygit으로 넘긴다.

> 참고: `vim-fugitive`, `diffview.nvim` 같은 플러그인은 LazyVim 기본에 **포함되지 않는다.** 필요하면 직접 추가해야 한다.

## 핵심 구조 / 흐름

```
편집 중인 버퍼
   │
   ├─ gitsigns ──→ 사이드 컬럼에 변경 마커 표시 (│ ~ _)
   │                └─ hunk 단위 stage / reset / preview
   │
   ├─ snacks.git ─→ blame · file history · log · GitHub browse (조회 전용)
   │
   └─ <leader>gg ─→ lazygit 실행 ──→ commit / push / branch / rebase ...
```

일반적인 작업 동선은 다음과 같다.

1. 코드를 고치면 **gitsigns**가 바뀐 줄을 즉시 표시한다.
2. 원하는 부분만 `<leader>ghs`로 **hunk stage** 한다. (`git add -p`를 에디터에서 하는 셈)
3. 실제 **commit / push**는 `<leader>gg`로 **lazygit**을 열어서 처리한다.
4. 맥락이 궁금하면 **snacks**의 blame · history로 "누가 언제 왜" 바꿨는지 조회한다.

## 상세 설명

### 1. gitsigns.nvim — 변경 추적과 hunk 조작

편집 중인 파일이 git 기준(HEAD)으로 어디가 달라졌는지 사이드 컬럼(sign column)에 표시한다.

- `│` 추가된 줄
- `~` 수정된 줄
- `_` 삭제된 줄

**Hunk 이동**

| 키 | 동작 |
|----|------|
| `]h` | 다음 hunk로 이동 |
| `[h` | 이전 hunk로 이동 |

**Hunk 조작** (`<leader>gh*`)

| 키 | 동작 |
|----|------|
| `<leader>ghs` | hunk를 stage (Stage hunk) |
| `<leader>ghr` | hunk를 reset (변경 되돌리기) |
| `<leader>ghu` | stage 취소 (Undo stage hunk) |
| `<leader>ghp` | hunk 미리보기 (Preview) |
| `<leader>ghd` | diff 보기 |
| `<leader>ghb` | 현재 줄 blame 전체 보기 |

> Visual 모드에서 일부 줄을 선택한 뒤 `<leader>ghs` / `<leader>ghr`를 누르면 **선택한 범위만** stage / reset 된다. hunk 전체가 아니라 더 잘게 고를 때 유용하다.

**인라인 blame 토글**

| 키 | 동작 |
|----|------|
| `<leader>uhb` | 줄 끝에 blame 인라인 표시 on/off 토글 |

### 2. lazygit 연동 — 실제 git 작업

LazyVim은 `snacks.nvim`을 통해 외부 TUI인 [lazygit](https://github.com/jesseduffield/lazygit)을 띄운다. (lazygit 바이너리가 별도로 설치돼 있어야 한다.)

| 키 | 동작 |
|----|------|
| `<leader>gg` | 프로젝트 루트에서 LazyGit 열기 |
| `<leader>gG` | 현재 파일 위치에서 LazyGit 열기 |

커밋 메시지 작성, staging, push/pull, 브랜치 전환, rebase, stash 등 **본격적인 git 작업은 대부분 여기서** 처리한다. gitsigns가 커버하지 못하는 영역을 lazygit이 맡는 구조다.

### 3. snacks.nvim의 git 부가 기능 — 조회 전용

별도 플러그인이 아니라 LazyVim이 기본 탑재한 `snacks.nvim`에 포함된 git 기능이다. 주로 **읽기/조회**에 쓴다.

| 키 | 동작 |
|----|------|
| `<leader>gb` | 현재 줄 git blame |
| `<leader>gf` | 현재 파일의 git 히스토리 |
| `<leader>gl` | git log |
| `<leader>gB` | 브라우저에서 GitHub로 열기 (Git Browse) |

`<leader>gB`는 현재 커서 위치의 파일·줄을 그대로 GitHub URL로 열어줘서, 동료에게 특정 코드 라인을 공유할 때 편하다.

## 참고사항

- 위 키맵은 LazyVim 기본값 기준이며, 사용자 설정으로 덮어쓸 수 있다. 실제 적용된 키맵은 Neovim에서 `<leader>` 누른 뒤 `g`를 눌러 **which-key 팝업**으로 확인하는 게 가장 정확하다.
- `g` 프리픽스는 git, `gh` 프리픽스는 gitsigns hunk, `uh` 프리픽스는 git 관련 UI 토글로 묶여 있다는 규칙을 기억해두면 키맵을 외우기 쉽다.
- 기본 구성으로 부족하면 `diffview.nvim`(시각적 diff/머지)이나 `vim-fugitive`(`:Git` 커맨드 기반)를 추가 플러그인으로 도입할 수 있다.

## 참고

- [LazyVim — Keymaps](https://www.lazyvim.org/keymaps)
- [gitsigns.nvim](https://github.com/lewis6991/gitsigns.nvim)
- [lazygit](https://github.com/jesseduffield/lazygit)
- [snacks.nvim](https://github.com/folke/snacks.nvim)

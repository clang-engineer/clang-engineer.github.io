---
title       : "dotfiles 로드맵 — 설정을 코드로 재현하는 방법"
description : "dotfiles를 Git에 두는 공통 원칙에서 출발해 홈에 배치하는 방식(심링크·bare git/yadm·chezmoi), 머신별 값과 시크릿 처리, macOS 패키지 재현(Brewfile)을 서로 다른 축으로 구분한 학습 지도."
date        : 2026-07-08 12:00:00 +0900
updated     : 2026-09-06 12:45:00 +0900
categories  : [shell, "개요·인덱스"]
tags        : [roadmap, dotfiles, chezmoi, symlink]
pin         : false
hidden      : false
---

dotfiles 관리의 목적은 `~/.zshrc`나 `~/.gitconfig`를 예쁘게 모으는 것이 아니라 **설정의 원본과 변경 이력을 Git에 두고, 새 환경에서 다시 재현할 수 있게 만드는 것**이다.

여기서 세 문제를 섞지 않는 것이 중요하다.

```text
무엇을 원본으로 관리할까?
→ Git repository

원본을 Home에 어떻게 배치할까?
→ symlink / bare worktree(yadm) / render(chezmoi)

Machine마다 다른 값·Secret은 어떻게 처리할까?
→ runtime 분기 / template·data / 외부 secret

도구 설치까지 어떻게 재현할까?
→ package manifest (macOS에서는 Brewfile)
```

따라서 `심링크 → Brewfile → chezmoi`를 하나의 진화 단계로 보지 않는다. **Git 정본은 공통 기반이고, 배치 모델과 패키지 재현은 서로 다른 선택축**이다.

## 한눈에 보기

| 구역 | 핵심 질문 | 관계 |
|---|---|---|
| 1. 정본 | 어떤 설정을 Git에서 관리할까 | 공통 기반 |
| 2. 배치 모델 | Git의 파일을 Home에 어떻게 나타낼까 | 대안 비교 |
| 3. Machine 차이 | Host별 값·Secret을 언제/어디서 확정할까 | 설계 선택 |
| 4. 설치 재현 | 설정이 기대하는 Package도 어떻게 맞출까 | 보완 축 |
| Branch A | Project Directory별 환경값은 어디에 둘까 | Tool |
| Branch B | SSH 계정·Credential은 어떻게 분리할까 | 운영 |
| Runbook | 새 Mac 전체 셋업에서 dotfiles는 어디에 들어가나 | How-to |

## 1. Git을 설정의 정본으로 둔다

가장 먼저 결정할 것은 Tool이 아니라 **원본의 위치**다.

```text
Git repository
→ 변경 이력
→ review / rollback
→ 다른 Machine에서 clone
```

| 글 | 역할 |
|---|---|
| [dotfiles를 Git 저장소 + 심볼릭 링크로 관리하기](./2026-07-03-dotfiles-symlink-management.md) | 가장 단순한 구현으로 Git 정본·멱등 bootstrap·Secret 분리를 함께 이해 |

이 글은 심링크를 사용하지만, 여기서 배워야 할 공통 개념은 **Home의 파일 자체를 원본으로 두지 않는다**는 것이다.

## 2. 배치 모델 — 같은 원본을 Home에 어떻게 보이게 할까

배치 방식은 발전 단계가 아니라 대안이다.

```text
A. Link
Git 원본 ← symlink ← Home

B. Worktree
Git metadata는 별도
Home 자체가 worktree

C. Render / Apply
Git source → template/render → Home의 실제 파일
```

| 모델 | 장점 | 비용 | Zoom-in |
|---|---|---|---|
| **symlink** | 단순·즉시 반영·도구 독립적 | Host별 내용 분기가 약함 | [Git + symlink](./2026-07-03-dotfiles-symlink-management.md) |
| **bare git / yadm** | Link 없이 Home을 그대로 추적 | Git 사용 모델이 특이해짐 | [bare git repo · yadm](./2026-07-08-dotfiles-bare-git-yadm.md) |
| **chezmoi render** | Template·권한·암호화·Host별 렌더 | `apply` 계층과 도구 학습 비용 | [chezmoi vs 심링크](./2026-07-08-chezmoi-vs-symlink-dotfiles.md) |

`yadm`과 `chezmoi`를 “심링크 다음 고급 단계”로 두지 않는다. **어떤 배치 모델이 문제에 맞는지**로 고른다.

### chezmoi를 선택했다면

| 글 | 역할 |
|---|---|
| [chezmoi 사용법 — source와 apply 흐름](./2026-07-08-chezmoi-usage-source-apply.md) | source state → template/data → apply라는 실제 동작 모델과 일상 명령을 설명 |

## 3. Machine별 값과 Secret — 차이는 언제 확정할까

여러 Machine에서 같은 파일을 쓰다 보면 경로·Email·Tool·Credential이 달라진다. 여기서 중요한 비교축은 **차이를 확정하는 시점**이다.

```text
실행 시점
→ shell이 env / 별도 파일을 source
→ symlink 모델과 잘 맞음

배치 시점
→ template + host data를 render
→ chezmoi와 잘 맞음

저장소 밖
→ password manager / keychain / local secret file
→ 어떤 모델에서도 가능
```

Secret을 Git에 넣지 않는다는 원칙과, Host별 일반 설정을 분기하는 방법은 구분한다. 암호화 기능이 있다는 이유만으로 모든 Secret을 dotfiles Tool 안에 넣을 필요도 없다.

## 4. Package 설치 재현 — 설정 파일과 별개의 보완 축

설정이 복원돼도 `nvim`, `tmux`, `fzf` 자체가 없으면 환경은 재현되지 않는다. 이 문제는 **dotfile 배치 모델과 별개**다.

현재 블로그의 구현은 macOS/Homebrew 중심이다.

| 글 | 역할 |
|---|---|
| [Homebrew Brewfile로 패키지 선언적으로 관리하기](./2026-07-03-homebrew-brewfile-bundle.md) | `brew bundle`로 macOS Package 집합을 선언·검증·복원하는 How-to |

따라서 Brewfile은 모든 dotfiles 사용자의 2단계가 아니라 **macOS에서 설치 상태까지 재현하려는 경우의 보완 축**이다. Linux라면 다른 Package Manager/Bootstrap 방식이 이 자리를 대신할 수 있다.

## Branch A — Directory별 개발환경은 dotfiles와 분리한다

| 글 | 역할 |
|---|---|
| [direnv 사용법 정리](./2026-02-21-direnv.md) | Directory 진입을 Context로 `.envrc`를 적용하는 Tool |

```text
사용자·Machine 전역 설정
→ dotfiles

Repository / Directory별 환경
→ direnv

Application이 직접 읽는 환경 파일
→ dotenv 계열
```

셋은 저장 위치가 비슷해 보여도 Scope가 다르다.

## Branch B — SSH 계정과 Credential

| 글 | 역할 |
|---|---|
| [GitHub 다중 계정 관리](../git/2025-10-03-git-multiple-config.md) | `~/.ssh/config` Host alias로 개인/회사 계정을 분리하고 Key는 저장소 밖에 두는 운영 패턴 |

SSH config 자체는 dotfiles로 관리할 수 있지만 **Private Key와 Credential은 별도 보안 자산**이다.

## Runbook — 새 Mac 전체 셋업

| 글 | 역할 |
|---|---|
| [새 맥 초기 설정](../macos/2022-02-05-new-mac-initial-setup.md) | System → Package → dotfiles → Credential → 검증을 실제 순서로 수행하는 How-to |

이 Runbook의 작업 순서와 dotfiles의 개념 관계를 혼동하지 않는다. 새 Mac에서는 Brewfile이 dotfiles보다 먼저 실행될 수 있지만, 그것이 “Brewfile이 dotfiles 개념의 상위 단계”라는 뜻은 아니다.

## 다른 Roadmap과의 경계

- Shell 문법·실행·Process → [Shell](./2026-07-03-shell-roadmap.md)
- macOS System 설정과 Day-1 작업 → [macOS](../macos/2026-07-03-macos-roadmap.md)
- tmux 자체 설정·Plugin·Session workflow → [tmux](../tmux/2026-06-16-tmux-roadmap.md)
- Neovim 자체 설정 구조 → [Neovim](../neovim/2026-06-16-neovim-roadmap.md)

## 선택 기준

```text
한두 Machine, 설정 내용도 거의 같다
→ Git + symlink

Home을 별도 Link 없이 그대로 추적하고 싶다
→ bare git / yadm

Host별로 파일 내용 자체가 많이 달라진다
→ chezmoi template/render

macOS Package까지 같은 상태로 만들고 싶다
→ 위 선택과 별개로 Brewfile 추가
```

> **dotfiles의 공통 기반은 Git 정본이다. symlink·bare/yadm·chezmoi는 Home에 배치하는 대안이고, Brewfile은 Package 설치를 재현하는 별도 축이다.**

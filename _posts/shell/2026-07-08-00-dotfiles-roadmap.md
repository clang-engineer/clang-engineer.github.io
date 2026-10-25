---
title       : "dotfiles 로드맵 — 설정을 코드로 재현하는 방법"
description : "dotfiles를 Git에 두는 공통 원칙에서 출발해 홈에 배치하는 방식(심링크·bare git/yadm·chezmoi), 머신별 값과 시크릿 처리, macOS 패키지 재현(Brewfile)을 서로 다른 축으로 구분한 학습 지도."
date        : 2026-07-08 12:00:00 +0900
updated     : 2026-10-25 20:30:00 +0900
categories  : [shell, "개요·인덱스"]
tags        : [roadmap, dotfiles, chezmoi, symlink]
pin         : false
hidden      : false
permalink   : /posts/shell/2026-07-08-dotfiles-roadmap/
---

dotfiles 관리의 목적은 `~/.zshrc`나 `~/.gitconfig`를 예쁘게 모으는 것이 아니라 **설정의 원본과 변경 이력을 Git에 두고, 새 환경에서 다시 재현할 수 있게 만드는 것**이다.

서로 다른 책임을 하나의 도구 선택 문제로 묶지 않는 것이 중요하다. **현재 사용하는 도구나 작성된 게시글과 관계없이** 설정 재현의 핵심 개념군을 먼저 살펴본다.

```text
개발환경 재현 — 주요 책임
├─ 설정의 원본·변경 이력 ── Git 등 버전 관리
├─ 대상 시스템 배치
│  ├─ Symlink ── 원본 파일 참조
│  ├─ Home Worktree ── 대상 위치를 직접 추적
│  └─ Render / Apply ── 템플릿을 실제 설정으로 생성
├─ 환경별 차이 ── Host data / 조건부 설정
├─ 민감 정보 ── 별도 보관·주입 / 접근 제어
└─ 실행 환경의 재현
   ├─ Package / Tool Version
   └─ Bootstrap / 검증 / 복구

관계: 원본 → 배치 → 적용·검증
      환경별 값·Secret·Package는 별도의 횡단 책임
```

배치 모델, Machine별 값, Secret 관리, 패키지 설치는 서로 보완하는 축이다.

따라서 `심링크 → Brewfile → chezmoi`를 하나의 진화 단계로 보지 않는다. **Git 정본은 공통 기반이고, 배치 모델과 패키지 재현은 서로 다른 선택축**이다.

## 핵심 개념과 관계

### 설정 원본과 배치

설정의 정본과 변경 이력을 어디에서 관리하는지, 대상 환경에 어떻게 적용하는지는 별개의 문제다. Symlink·Home Worktree·Render/Apply는 배치 방식의 대안이지 필수적인 발전 순서가 아니다.

```text
설정 원본·변경 이력
       │
       ├─ Symlink ───────────┐
       ├─ Home Worktree ─────┼──> 대상 환경의 설정
       └─ Template / Apply ──┘
                                  │
                              적용·검증

횡단 조건: Host별 차이 / Secret / Package·Version
```

### 환경별 차이와 보안

Host별 설정은 실행 시 분기하거나 배치 시 템플릿으로 생성할 수 있다. Secret은 일반 설정과 분리해 접근을 통제해야 하며, 암호화 도구 사용 여부만으로 안전한 관리가 보장되는 것은 아니다.

### 실행 환경의 재현

설정 파일만 복원해도 필요한 프로그램·버전이 없다면 동일한 환경이 되지 않는다. Package Manifest·Bootstrap·검증·복구는 배치 모델과 별개의 책임이다. Brewfile은 macOS/Homebrew 환경에서 이 문제를 다루는 하나의 방법이다.

## 필요한 경우 더 깊이 살펴보기

[Git·Symlink](./2026-07-03-dotfiles-symlink-management.md), [bare Git·yadm](./2026-07-08-dotfiles-bare-git-yadm.md), [chezmoi](./2026-07-08-chezmoi-usage-source-apply.md), [Brewfile](./2026-07-03-homebrew-brewfile-bundle.md)을 선택적으로 참고한다. 실제 새 Mac 설정 절차는 [macOS](../macos/2026-07-03-macos-roadmap.md), Shell 동작 원리는 [Shell](./2026-07-03-00-shell-roadmap.md)의 영역이다.

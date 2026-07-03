---
title       : Homebrew Brewfile로 패키지 선언적으로 관리하기
description : "brew로 설치한 패키지를 Brewfile 하나로 선언해 관리하는 방법. dump로 현재 상태 덤프, bundle로 재설치, cleanup으로 목록에 없는 패키지 제거, check로 검증까지. Brewfile 문법과 dotfiles 버전관리도 함께 정리한다."
date        : 2026-07-03 12:00:00 +0900
updated     : 2026-07-03 12:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [homebrew, brewfile, brew-bundle, dotfiles]
pin         : false
hidden      : false
---

## Homebrew Brewfile로 패키지 선언적으로 관리하기

`brew install`을 하나씩 치다 보면, 몇 달 뒤엔 "내가 뭘 깔았는지" 아무도 모릅니다.
`brew bundle`은 설치한 패키지를 **`Brewfile` 한 파일에 선언**해 두고, 그 파일을 기준으로 설치·정리·검증하게 해줍니다.
`package.json`이나 `requirements.txt`가 프로젝트 의존성을 선언하듯, Brewfile은 **내 맥의 패키지 상태를 선언**합니다.

> 어떤 도구를 담을지(무엇을)는 [macOS CLI 개발 도구 모음](/posts/macos/2026-07-03-macos-cli-toolkit-brewfile/)에서 다룹니다. 이 글은 그 목록을 **어떻게 관리하느냐**에 집중합니다.
{: .prompt-info }

---

## 1. 현재 상태 덤프 — dump

이미 `brew`로 여러 패키지를 깔아 뒀다면, 지금 상태를 그대로 Brewfile로 뽑아낼 수 있습니다.

```sh
brew bundle dump              # 현재 디렉터리에 Brewfile 생성
brew bundle dump --force      # 기존 Brewfile 덮어쓰기
brew bundle dump --describe   # 각 패키지에 설명 주석을 함께 기록
```

`--describe`를 붙이면 패키지마다 한 줄 설명이 주석으로 달립니다. 나중에 목록을 다시 볼 때 "이건 왜 깔았지"를 줄여 줍니다.

```ruby
# Brewfile (dump 결과 예시)
tap "homebrew/bundle"
brew "git"
brew "ripgrep"   # Search tool like grep and The Silver Searcher
brew "fzf"       # Command-line fuzzy finder written in Go
```

---

## 2. 재설치 — bundle

Brewfile이 있는 디렉터리에서 `brew bundle`을 실행하면, **목록에 있는데 설치 안 된 패키지를 모두 설치**합니다.

```sh
brew bundle                        # 현재 디렉터리의 Brewfile 기준 설치
brew bundle --file=~/dotfiles/Brewfile   # 경로를 직접 지정
```

새 맥을 셋업할 때 이 명령 하나면 툴킷이 통째로 복원됩니다. 이미 설치된 건 건너뛰므로 여러 번 실행해도 안전합니다(멱등).

---

## 3. 목록에 없는 패키지 정리 — cleanup

선언적 관리의 진짜 핵심은 여기입니다. **Brewfile에 없는데 설치돼 있는 패키지를 제거**해, 실제 상태를 Brewfile에 일치시킵니다.

```sh
brew bundle cleanup           # 제거 대상만 보여주는 dry-run (실제 삭제 X)
brew bundle cleanup --force   # 실제로 제거 실행
```

> `--force` 없이 실행하면 **무엇이 지워질지 미리 보여주기만** 합니다. 먼저 dry-run으로 확인한 뒤 `--force`를 붙이는 습관이 안전합니다.
{: .prompt-warning }

이 명령 덕분에 Brewfile이 "설치 스크립트"를 넘어 **단일 진실 공급원(single source of truth)**이 됩니다. 손으로 깐 임시 패키지가 쌓여도, Brewfile만 깨끗이 유지하면 `cleanup`으로 실제 환경을 되돌릴 수 있습니다.

---

## 4. 설치 상태 검증 — check

Brewfile에 선언된 게 전부 설치돼 있는지만 빠르게 확인합니다.

```sh
brew bundle check
# The Brewfile's dependencies are satisfied.  ← 전부 설치됨
```

빠진 게 있으면 무엇이 없는지 알려주고 종료 코드가 0이 아니게 됩니다. 셋업 스크립트나 CI에서 "환경이 준비됐는지"를 판단하는 용도로 쓰기 좋습니다.

---

## 5. Brewfile 문법

Brewfile은 Ruby DSL이지만, 실제로 쓰는 키워드는 몇 개뿐입니다.

| 키워드 | 대상 | 예시 |
|---|---|---|
| `brew` | CLI 패키지(formula) | `brew "neovim"` |
| `cask` | GUI 애플리케이션 | `cask "google-chrome"` |
| `tap` | 서드파티 저장소 | `tap "homebrew/cask-fonts"` |
| `mas` | Mac App Store 앱 | `mas "Xcode", id: 497799835` |
| `vscode` | VS Code 확장 | `vscode "ms-python.python"` |

```ruby
tap "homebrew/cask-fonts"

brew "neovim"
brew "ripgrep"

cask "google-chrome"
cask "raycast"

# Mac App Store 앱은 mas CLI가 필요합니다: brew "mas"
mas "Xcode", id: 497799835
```

> `mas`로 App Store 앱을 관리하려면 `brew "mas"`로 mas CLI를 먼저 설치해야 합니다. App Store에 로그인된 상태여야 동작합니다.
{: .prompt-tip }

주석(`#`)으로 패키지를 그룹으로 묶어 두면 목록이 길어져도 관리가 쉽습니다.

```ruby
# 핵심 도구
brew "git"
brew "neovim"

# 상황에 따라 선택
brew "git-lfs"   # 대용량 파일 저장소 쓸 때만
```

---

## 6. dotfiles로 버전관리

Brewfile은 dotfiles 저장소에 함께 넣어 버전관리하는 것이 정석입니다. 그러면 패키지 목록의 변경 이력이 git에 남고, 새 기기에서 clone 후 `brew bundle` 한 번이면 됩니다.

```sh
# dotfiles 저장소 안에 Brewfile을 두고
brew bundle --file=~/dotfiles/Brewfile
```

Brewfile을 `~/.Brewfile`로 두면 위치를 매번 지정하지 않고 `--global`로 쓸 수도 있습니다.

```sh
brew bundle --global    # ~/.Brewfile 사용
```

---

## 마무리

`brew bundle`은 명령 몇 개로 맥의 패키지 상태를 선언적으로 다루게 해줍니다.

- `dump --describe` — 현재 상태를 설명 주석과 함께 Brewfile로 추출
- `bundle` — Brewfile 기준으로 빠진 패키지 설치(멱등)
- `cleanup --force` — Brewfile에 없는 패키지 제거(단일 진실 공급원 유지)
- `check` — 설치 상태 검증

Brewfile을 dotfiles에 넣어 두면, 새 맥 셋업이 "clone → `brew bundle`" 두 줄로 끝납니다. 이 셋업 전체 흐름은 [새 맥 초기 설정](/posts/macos/2022-02-05-new-mac-initial-setup/)에서 다룹니다.

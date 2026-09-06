---
title       : "chezmoi vs 심링크 dotfiles — Link와 Render는 무엇이 다른가"
description : "Git에 둔 dotfiles를 Home에 배치하는 두 모델인 symlink와 chezmoi render/apply를 비교한다. 파일의 정체, 반영 시점, host별 분기, drift, secret 처리라는 비교축을 먼저 잡고 bare git/yadm은 별도 worktree 모델로 경계를 명시한다."
date        : 2026-07-08 10:00:00 +0900
updated     : 2026-09-06 14:25:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [dotfiles, chezmoi, symlink, stow]
pin         : false
hidden      : false
---

> 전체 선택지는 [dotfiles 로드맵](./2026-07-08-dotfiles-roadmap.md)에서 먼저 본다. 이 글은 그중 **Git source를 Home에 Link하는 모델과 Render/Apply하는 모델**만 비교한다. Home 자체를 Git worktree로 쓰는 [bare git/yadm](./2026-07-08-dotfiles-bare-git-yadm.md)은 제3의 배치 모델이다.

`symlink`와 `chezmoi`를 비교할 때 “어느 Tool이 더 고급인가”부터 물으면 관계가 흐려진다. 먼저 **Home에 있는 파일의 정체가 무엇인가**를 본다.

```text
Symlink model
Git source file
← Home의 symbolic link가 가리킴

Chezmoi model
Chezmoi source state
→ template / transform / metadata
→ apply
→ Home의 target file
```

둘 다 Git으로 설정을 관리할 수 있지만, **source와 target의 관계를 유지하는 방식이 다르다.**

## 비교축

| 비교축 | Symlink | chezmoi |
|---|---|---|
| Home의 대상 | Git source를 가리키는 symbolic link | source state에서 apply한 target file |
| source 변경 반영 | link target을 직접 편집하면 즉시 보임 | target 반영에는 `chezmoi apply` 필요 |
| Home에서 직접 수정 | source를 편집한 것이 아니라면 별도 target이 없음 | source state와 target이 달라질 수 있어 `diff`/`status`로 비교 |
| Host별 내용 | source 내부 조건·include·별도 local file 등 사용자가 설계 | template/data로 apply 시점에 내용 생성 가능 |
| permission/attribute | bootstrap script 등으로 별도 관리 | source naming/metadata로 선언 가능 |
| secret | Git 밖 local file·password manager 등과 조합 | 외부 secret manager·encrypted source 등 여러 방식 지원 |
| Tool dependency | Git + link/bootstrap 방식 | chezmoi command와 source-state model |

핵심은 **분기를 언제 한다** 하나로만 환원하지 않는다. 차이는 source→target 배치 모델 전체에 있다.

## Symlink — Source와 Home을 하나의 편집 흐름으로

예를 들어 repository의 `.zshrc`를 Home에서 가리킨다.

```bash
ln -s ~/dotfiles/zsh/.zshrc ~/.zshrc
```

Home의 symlink를 통해 파일을 열어 수정하면 실제로는 Git source target을 수정한다.

```text
~/.zshrc (symlink)
        ↓
~/dotfiles/zsh/.zshrc (source)
```

따라서 chezmoi처럼 source state와 별도 target copy 사이의 “apply 안 함” 상태는 생기지 않는다. 다만 이것을 “symlink와 source가 같은 inode”라고 표현하지는 않는다. **symlink 자체는 별도 filesystem object이고, 접근 시 target을 따라간다.**

Host 차이를 처리하는 방식은 symlink가 자동 결정하지 않는다. 예를 들어 shell config라면:

```bash
[[ -f ~/.zshrc.local ]] && source ~/.zshrc.local
```

처럼 local file을 읽게 만들 수 있고, hostname/OS 조건문을 둘 수도 있다. JSON·TOML처럼 runtime include가 없는 format에서는 이런 전략이 불편해진다.

### Symlink가 잘 맞는 경우

- source file을 직접 편집하는 단순한 mental model이 좋다.
- Machine 사이의 config 내용 차이가 작다.
- Host별 값은 environment/local include로 충분하다.
- 별도의 apply lifecycle을 만들고 싶지 않다.

심링크 bootstrap 자체는 [Git + symbolic link 관리](./2026-07-03-dotfiles-symlink-management.md)에서 다룬다.

## chezmoi — Source State에서 Target을 생성한다

chezmoi는 source state와 실제 Home target을 구분한다.

```text
source state
→ template / data / attributes
→ chezmoi apply
→ target state in $HOME
```

예를 들어 host에 따라 `.gitconfig` 내용 자체가 달라져야 하면 template에서 target 내용을 생성할 수 있다.

이 구조 덕분에 다음 기능이 자연스럽다.

- Host/OS별 template rendering
- file permission과 private attribute 표현
- source에 저장하기 곤란한 값과 secret manager 연동
- apply 전 `diff`로 변경 예측
- 여러 Machine에 동일한 source state를 적용

대신 source를 바꾼 뒤 target에 적용하는 lifecycle을 이해해야 한다.

```bash
chezmoi edit ~/.gitconfig
chezmoi diff
chezmoi apply
```

일상 사용은 [chezmoi source와 apply 흐름](./2026-07-08-chezmoi-usage-source-apply.md)에서 Zoom-in한다.

## “Drift”의 의미

Symlink와 chezmoi의 차이를 “chezmoi는 복사라 항상 drift가 난다”로 설명하면 과하다.

chezmoi가 source state와 target state를 의도적으로 분리하기 때문에 **둘의 차이를 관찰하고 조정할 필요가 생긴다.** 그래서 `chezmoi diff`, `status`, `re-add` 같은 workflow가 존재한다.

반대로 symlink는 별도 target copy가 없으므로 source-vs-target 차이라는 종류의 drift가 없다. 하지만 repository 밖 local file, generated file, package version까지 자동으로 일치한다는 뜻은 아니다.

## Host별 분기 — Runtime과 Apply-time은 선택 기준 중 하나

두 모델의 실전 차이가 크게 드러나는 곳이다.

```text
Runtime branching
→ shell condition
→ local include
→ environment variable

Apply-time rendering
→ host/OS data
→ template condition
→ target content 생성
```

Shell config처럼 runtime 분기가 자연스러운 format은 symlink 방식으로도 충분하다. 반대로 `.gitconfig`, JSON, application config 등 **파일 내용 자체를 Machine별로 생성해야 하는 경우** chezmoi template가 더 읽기 쉬울 수 있다.

하지만 symlink도 bootstrap에서 file을 생성할 수 있고 chezmoi target도 runtime local include를 사용할 수 있다. 둘을 절대적인 기능 한계로 보지 않고 **주로 사용하는 설계 중심이 어디에 있는가**로 판단한다.

## Secret은 별도의 보안 축이다

“chezmoi를 쓰면 secret을 Git에 넣어도 된다”가 아니다.

```text
Dotfile deployment
→ source를 Home에 어떻게 배치할지

Secret management
→ 민감 값을 어디에 저장하고 어떻게 주입할지
```

둘은 다른 질문이다.

- local untracked file
- OS keychain
- password manager
- encrypted source
- chezmoi secret integration

등을 threat model과 운영 방식에 맞게 고른다. Private key 자체는 단순히 dotfiles repository에 평문으로 넣지 않는다.

## 제3의 모델 — bare Git / yadm

Link도 Render도 쓰지 않고 Home 자체를 Git worktree로 두는 방법도 있다.

```text
Git metadata elsewhere
+
$HOME = worktree
```

이 모델은 [bare git/yadm](./2026-07-08-dotfiles-bare-git-yadm.md)에서 별도로 다룬다. 따라서 전체 선택을 다음처럼 본다.

```text
Source file을 바로 가리킨다
→ symlink / stow 계열

Home 자체를 Git worktree로 쓴다
→ bare Git / yadm 계열

Source state에서 target을 생성한다
→ chezmoi
```

`yadm`은 추가 template/alternate/encryption 기능을 제공하므로 단순 bare Git과 완전히 같은 기능 범위도 아니다.

## 선택 기준

```text
단순한 source=실제 편집 대상 모델이 좋다
→ symlink

Home 파일을 link 없이 Git이 직접 추적하게 하고 싶다
→ bare Git / yadm 검토

Host별 target 내용·attribute를 선언적으로 생성하고 싶다
→ chezmoi
```

Package 설치 재현(Brewfile 등)은 이 비교와 별도 축이다.

## 결론

`symlink vs chezmoi`는 “가벼운 Tool vs 고급 Tool”의 대결이 아니다.

> **Symlink는 Git source를 Home에서 직접 참조하는 모델이고, chezmoi는 source state에서 Home target을 생성·적용하는 모델이다. Host 분기·permission·secret workflow가 복잡해질수록 render/apply 모델의 가치가 커지고, 단순한 환경에서는 link 모델의 투명성이 강점이다.**

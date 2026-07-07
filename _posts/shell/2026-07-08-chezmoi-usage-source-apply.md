---
title       : "chezmoi 사용법 — 소스 표현과 apply 흐름"
description : "chezmoi가 dotfiles를 어떻게 표현하고 적용하는지: 소스 디렉토리(git repo), 파일명에 인코딩된 메타(dot_·private_·executable_·.tmpl), 템플릿 데이터(.chezmoi.hostname·.os), 그리고 init→add→chattr→diff→apply로 이어지는 명령 흐름까지 한 장으로."
date        : 2026-07-08 11:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [dotfiles, chezmoi, template, guide]
pin         : false
hidden      : false
---

chezmoi를 쓰기로 했다면(그 선택 기준은 [chezmoi vs 심링크](/posts/shell/2026-07-08-chezmoi-vs-symlink-dotfiles/) 참고), 실제로 알아야 할 건 두 가지다 — **dotfiles를 어떻게 표현하나**(소스), 그리고 **어떻게 적용하나**(apply). 이 글은 그 메커니즘과 명령 흐름을 정리한다.

## 소스 표현 — 파일이 어디에, 어떤 이름으로 사는가

chezmoi의 모든 것은 하나의 **소스 디렉토리**에서 시작한다.

- 소스 디렉토리: `~/.local/share/chezmoi` — 그냥 git 저장소다. 여기 있는 파일들이 홈 디렉토리로 렌더된다.
- 파일명이 **메타데이터를 인코딩**한다. 홈에 그대로 두면 숨김 파일이라 다루기 불편한 것들을, 소스에서는 접두어로 표현한다:
  - `dot_zshrc` → `~/.zshrc` (`dot_`이 앞의 `.`을 대신)
  - `private_` / `executable_` / `readonly_` → 렌더된 파일의 퍼미션
  - `.tmpl` 확장자 → 이 파일은 템플릿이니 렌더가 필요하다는 표시
- 템플릿 데이터: `.tmpl` 파일 안에서 `{{ .chezmoi.hostname }}`, `{{ .chezmoi.os }}`, `{{ .chezmoi.arch }}` 같은 내장 변수를 쓸 수 있고, `chezmoi.toml`에 커스텀 값을 정의해 끌어 쓸 수도 있다.

즉 `~/.local/share/chezmoi/dot_zshrc.tmpl`은 "머신별로 렌더될 `~/.zshrc`의 원본"이라는 뜻을 파일명만으로 담는다.

## 명령 흐름 — init에서 apply까지

```sh
chezmoi init                 # 소스 repo 생성
chezmoi add ~/.zshrc         # 기존 파일을 관리 대상으로 편입 (dot_zshrc로 저장)
chezmoi chattr +template ~/.zshrc   # 이 파일을 템플릿으로 전환 (.tmpl 부여)
chezmoi diff                 # apply하면 무엇이 바뀌는지 미리보기
chezmoi apply                # 템플릿을 렌더해 홈에 실제로 씀
```

흐름을 말로 풀면 이렇다.

1. `chezmoi init` — 소스 저장소를 만든다. 이후 모든 편집은 이 저장소 안에서 일어난다.
2. `chezmoi add ~/.zshrc` — 지금 홈에 있는 실파일을 소스로 가져온다. chezmoi가 알아서 `dot_zshrc`라는 이름으로 저장한다.
3. `chezmoi chattr +template ~/.zshrc` — 머신별로 내용이 갈려야 하는 파일을 템플릿으로 승격한다. 이제 그 파일 안에서 `{{ .chezmoi.hostname }}` 같은 분기를 쓸 수 있다.
4. `chezmoi diff` — apply를 실행하면 홈 파일이 어떻게 바뀌는지 **미리** 보여준다. 복사 방식이라 원본과 어긋날(drift) 수 있는 chezmoi에서, 이 미리보기가 안전장치다.
5. `chezmoi apply` — 템플릿을 이 머신용으로 렌더해 홈에 실제로 쓴다. 편집→반영이 즉시가 아니라 이 단계를 거친다는 점이 심링크 방식과 결정적으로 다른 지점이다.

## 핵심 한 방 — init --apply

chezmoi를 쓰는 진짜 이유에 가장 가까운 명령은 이것 하나다.

```sh
chezmoi init --apply <repo>  # 클론 + 렌더 + 적용을 한 번에
```

새 머신에서 이 한 줄이면 저장소를 클론하고, 이 머신용으로 템플릿을 렌더하고, 홈에 적용하는 것까지 끝난다. "남이 클론해 자기 머신에서 그대로 돌리게" 하는 공유 경험 — 심링크 방식으로는 주기 어려운 이 지점이 chezmoi의 대표 기능이다.

## 정리

- 소스는 `~/.local/share/chezmoi`(git repo) 하나. 파일명 접두어(`dot_`·`private_`·`executable_`)와 `.tmpl`이 메타를 담는다.
- 편집은 소스에서 하고, `chezmoi apply`로 렌더해 홈에 반영한다. `diff`로 먼저 확인하는 습관이 drift를 막는다.
- 공유의 핵심은 `chezmoi init --apply <repo>` — 클론·렌더·적용 한 방.

chezmoi를 아직 쓸지 말지 고민 중이라면, 심링크와의 선택 기준은 [chezmoi vs 심링크 dotfiles](/posts/shell/2026-07-08-chezmoi-vs-symlink-dotfiles/)에 정리해 두었다.

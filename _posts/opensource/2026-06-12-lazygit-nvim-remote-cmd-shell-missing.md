---
title       : "lazygit nvim-remote preset의 cmd 분기 부재 — 본체로 거슬러 올라가 이슈 제기"
description : "snacks.nvim 워크어라운드에서 시작해 lazygit 본체 editor_presets.go까지 추적, OSS 이슈로 정리한 기록"
date        : 2026-06-12 19:45:00 +0900
updated     : 2026-06-12 19:45:00 +0900
categories  : [opensource, "Lazygit"]
tags        : [lazygit, snacks, neovim, windows, oss-contrib]
pin         : false
hidden      : false
---

> 워크어라운드만 다룬 글은 [Windows에서 Neovim 내 Lazygit 'e' 키 에러 해결](/posts/lazyvim/2026-03-13-lazygit-nvim-windows-edit-error/)에 따로 있다. 이 글은 같은 버그의 **원인을 본체까지 거슬러 올라가 OSS 이슈로 정리한 기록**이다.

## 출발점

내 dotfiles에 11줄짜리 코멘트가 있었다.

```lua
-- snacks.nvim lazygit: Windows에서 editPreset "nvim-remote"가
-- bash 문법([)을 사용하여 cmd.exe에서 에러 발생 → 비활성화
```

워크어라운드로는 충분하지만, 다음 두 질문이 남았다.

1. 진짜 버그는 어느 프로젝트에 있나?
2. 본체에 기여할 만한가?

## 추적

### snacks.nvim에서 시작

`lua/snacks/lazygit.lua:37`에서 `editPreset = "nvim-remote"`를 **기본값**으로 박는다. 사용자가 명시 안 하면 자동으로 켜진다. 여기서 끝일 수도 있지만, snacks가 만든 preset이 아니라 **lazygit이 정의한 preset의 이름을 참조**하는 구조다. 그렇다면 cmd.exe에서 깨지는 명령은 어디서 만들어질까.

### lazygit 본체로

`pkg/config/editor_presets.go:56-86`에 `nvim-remote` preset 정의가 있다. 셸별로 세 갈래 분기:

```go
if (strings.HasSuffix(shell, "fish")) || (os.Getenv("FISH_VERSION") != "") {
    // fish: begin; if test -z "$NVIM"; ...; end; end
} else if strings.HasSuffix(shell, "nu") || ... {
    // nushell: if ($env | get -i NVIM | is-empty) { ... }
} else {
    // 그 외: [ -z "$NVIM" ] && (...) || (...)   ← POSIX sh
}
```

cmd.exe를 위한 분기가 **없다**. fish와 nushell만 신경 쓰고, "그 외"는 무조건 POSIX sh로 가정한다.

### Windows lazygit의 기본 셸

`pkg/commands/oscommands/os_windows.go:13` 한 줄에 답이 있다.

```go
func GetPlatform() *Platform {
    return &Platform{
        OS:       "windows",
        Shell:    "cmd",
        ShellArg: "/c",
    }
}
```

Windows에서 lazygit은 `cmd /c`로 명령을 던진다. 그런데 `nvim-remote` preset이 cmd 분기 없이 POSIX sh 문법을 떨궈주니, cmd.exe가 `[`를 인식 못 해서 깨진다. 인과 끝.

### 책임 분리

- **snacks.nvim**: lazygit이 정의한 preset 이름만 참조함. 잘못한 건 없음. 다만 Windows에서 기본값이 깨진다는 사실을 모른 채 사용자에게 노출시킴.
- **lazygit**: 자기가 만든 preset이 자기 기본 셸에서 안 도는 게 진짜 버그.

## 기여 시도

### 이슈 vs PR 선택

처음엔 PR을 떠올렸지만 접었다. 솔직히:

- cmd 셸 문법(`if defined NVIM`, `%NVIM%` 확장 타이밍, `^&` escape, 괄호 블록 안 변수 확장)은 실제로 돌려보지 않으면 함정에 빠지기 쉽다.
- 내 머신은 macOS, Windows 검증 환경이 없다.
- 검증 못 한 cmd 스크립트를 PR로 던지는 건 메인테이너 입장에서 노이즈에 가깝다. "fish 안 써본 사람이 fish 분기 짠 PR"과 같은 인상이 된다.
- 결정권을 lazygit 쪽에 넘기는 게 낫다. "cmd 분기 추가가 맞다" vs "Windows 기본 셸을 pwsh로 바꿔라" vs "wontfix, 사용자가 명시 설정해라" 중 무엇이 그쪽 방향과 맞는지는 그쪽이 판단할 영역이다.

### 이슈 본문에서 신경 쓴 것

- **재현 단계**: snacks.nvim 사용자가 무심코 마주치는 경로를 그대로 적었다 ("nvim 안에서 lazygit 실행 → `e` 누르기").
- **소스 링크**: `editor_presets.go:67-71`과 `os_windows.go:13`를 직접 가리켜 메인테이너가 같은 추적을 처음부터 할 필요가 없게 했다.
- **cmd 템플릿 sketch**: 미검증임을 명시한 채 토론용으로 한 줄만 제시.
- **워크어라운드의 한계**: snacks 사용자가 흔히 쓰는 우회법(`shell: bash` 명시)이 Git Bash가 PATH에 있어야만 동작한다는 점을 적어, 진짜 픽스의 필요성을 짚었다.

[lazygit#5696](https://github.com/jesseduffield/lazygit/issues/5696)로 올렸다.

## 회고

### 무엇이 좋았나

- **dotfiles의 11줄짜리 코멘트가 본체 이슈 추적의 출발점**이 됐다. 일상적으로 적어두는 워크어라운드 코멘트가 이렇게 쓰일 수 있다는 게 수확.
- 두 프로젝트 사이의 책임 분리(누가 트리거고 누가 빈 칸인가)를 명확히 나눈 뒤에 보고하니, 이슈 본문이 훨씬 짧고 깔끔해졌다.

### 무엇이 아쉬웠나

- Windows 검증 환경이 없어 PR까지 못 갔다. OSS 기여를 진지하게 하려면 검증 가능한 플랫폼 셋업이 선행되어야 한다는 걸 새삼.
- 사용자가 좁은 교집합(Windows + cmd + snacks + nvim-remote)이라, 머지돼도 임팩트는 크지 않다. 다만 임팩트로만 기여를 재면 시작 자체가 어려워지니, 추적의 즐거움 자체를 보상으로 본다.

### 다음 행동

- 메인테이너 반응 1주 정도 기다린다.
- 픽스 방향이 잡히고 검증 도움받을 수 있으면 후속 PR 검토.
- "wontfix / docs only"면 snacks.nvim 쪽에 docs PR 한 줄로 마무리.
- 결과 나오면 이 글 후속편으로 정리.

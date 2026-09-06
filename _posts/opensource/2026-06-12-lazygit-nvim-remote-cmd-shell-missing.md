---
title       : "lazygit nvim-remote preset의 cmd 분기 부재 — 본체로 거슬러 올라가 이슈 제기"
description : "snacks.nvim 워크어라운드에서 시작해 lazygit 본체 editor_presets.go까지 추적하고, 책임 경계를 좁혀 OSS 이슈로 제기한 과정을 기록한다."
date        : 2026-06-12 19:45:00 +0900
updated     : 2026-09-06 10:12:00 +0900
categories  : [opensource, "Lazygit"]
tags        : [lazygit, snacks, neovim, windows, oss-contrib]
pin         : false
hidden      : false
---

> 워크어라운드 자체는 [Windows에서 Neovim 내 Lazygit 'e' 키 에러 해결](../neovim/2026-03-13-lazygit-nvim-windows-edit-error.md)에서 다룬다. 이 글은 해결 명령보다 **문제가 어느 프로젝트의 어느 경계에서 생겼는지 본체까지 추적해 OSS 이슈로 만든 기록**이다.

## 출발점 — 워크어라운드 뒤에 남은 질문

내 dotfiles에 다음 코멘트가 있었다.

```lua
-- snacks.nvim lazygit: Windows에서 editPreset "nvim-remote"가
-- bash 문법([)을 사용하여 cmd.exe에서 에러 발생 → 비활성화
```

로컬에서 우회하는 데는 충분하지만 두 질문은 남는다.

```text
이 증상을 누가 만든 걸까?
        ↓
snacks.nvim?
lazygit?
Windows shell 환경?
        ↓
본체에 보고할 문제인가?
```

이 글의 핵심은 바로 이 **책임 경계를 좁히는 과정**이다.

## 1. 호출 경로를 위에서 아래로 따라간다

### snacks.nvim — preset을 선택한다

`lua/snacks/lazygit.lua`에서 `editPreset = "nvim-remote"`를 기본값으로 사용한다. 하지만 snacks가 shell command 자체를 만드는 것은 아니다. lazygit이 제공하는 preset 이름을 선택하는 역할이다.

```text
snacks.nvim
→ nvim-remote preset 선택
        ↓
lazygit
→ 실제 editor command 생성
```

따라서 shell 문법이 깨진다면 한 단계 아래인 lazygit 구현을 볼 필요가 있다.

### lazygit — preset의 실제 command를 만든다

`pkg/config/editor_presets.go`의 `nvim-remote` preset은 shell 종류에 따라 command를 나눈다.

```go
if (strings.HasSuffix(shell, "fish")) || (os.Getenv("FISH_VERSION") != "") {
    // fish
} else if strings.HasSuffix(shell, "nu") || ... {
    // nushell
} else {
    // POSIX sh 형태
}
```

문제는 `cmd.exe`를 위한 분기가 없다는 점이었다. fish와 nushell이 아니면 POSIX shell 문법을 사용하는 fallback으로 내려간다.

### Windows — lazygit의 실행 shell을 확인한다

당시 확인한 `pkg/commands/oscommands/os_windows.go`에서는 Windows platform의 shell이 다음처럼 구성되어 있었다.

```go
Shell:    "cmd",
ShellArg: "/c",
```

따라서 당시 관찰한 실행 경로는 다음처럼 연결됐다.

```text
Windows Neovim
   ↓
snacks.nvim
   ↓ nvim-remote preset 요청
lazygit
   ↓ POSIX 형태 command 생성
cmd /c
   ↓
`[` 같은 shell 문법 해석 실패
```

이 지점에서 단순히 "snacks에서 e 키가 안 된다"가 아니라 **lazygit이 선택한 command template과 Windows 실행 shell의 조합 문제**로 범위를 좁힐 수 있었다.

> 이 글은 2026년 6월 당시 소스 상태를 추적한 기록이다. upstream 구현은 이후 바뀔 수 있으므로 현재 동작을 판단할 때는 최신 lazygit 소스를 다시 확인한다.

## 2. 책임을 분리한다

문제가 여러 프로젝트를 통과할 때는 "어디에서 증상이 보였는가"와 "어디에서 잘못된 가정이 만들어졌는가"를 나눈다.

| 계층 | 당시 역할 | 판단 |
|---|---|---|
| snacks.nvim | `nvim-remote` preset 선택 | 증상을 노출하는 쪽 |
| lazygit | shell별 editor command 생성 | shell 가정이 만들어지는 쪽 |
| Windows / cmd | 전달된 command 실행 | POSIX 문법을 해석하지 못하는 실행 환경 |

따라서 당시에는 lazygit 본체가 가장 적절한 최초 보고 지점이라고 판단했다.

이 구분이 중요한 이유는 단순하다.

```text
증상이 보이는 프로젝트
≠ 항상 원인을 고쳐야 할 프로젝트
```

## 3. 이슈와 PR 중 무엇을 선택할까

처음에는 PR까지 생각했지만 이슈를 선택했다.

이유는 **원인은 충분히 좁혔지만 수정안을 검증할 환경은 없었기 때문**이다.

- `cmd.exe`에는 `%VAR%` 확장, 괄호 block, escape 등 별도 문법 경계가 있다.
- 당시 작업 환경은 macOS였고 실제 Windows 검증 환경이 없었다.
- 미검증 command를 본체 PR로 제안하면 원인 보고보다 오히려 검토 비용을 늘릴 수 있다.
- `cmd` 분기를 추가할지, PowerShell을 사용할지, preset 정책을 바꿀지는 maintainer의 설계 판단 영역이기도 했다.

그래서 기여 수준을 다음처럼 잘랐다.

```text
원인 재현 가능
+ 책임 위치 확인 가능
+ 수정안 검증 불가
        ↓
Issue로 근거 제공

수정안 구현 가능
+ Target 환경 검증 가능
        ↓
PR 검토
```

## 4. 이슈에는 메인테이너의 재조사 비용을 줄이는 정보를 넣는다

[lazygit#5696](https://github.com/jesseduffield/lazygit/issues/5696)으로 이슈를 제기했다.

당시 본문에는 다음 정보를 우선했다.

- **사용자 재현 경로** — Neovim 안에서 lazygit을 열고 edit 동작 수행
- **호출 주체** — snacks.nvim이 `nvim-remote` preset을 기본 선택하는 경로
- **원인 후보 소스** — lazygit의 editor preset과 Windows platform shell 구현
- **실패 이유** — POSIX shell 형태 command가 `cmd /c`로 전달되는 조합
- **워크어라운드의 한계** — 사용자 로컬 설정만으로는 기본 preset의 플랫폼 가정을 해결하지 못함
- **수정 sketch의 검증 상태** — Windows에서 검증하지 못한 제안임을 명시

OSS 이슈의 가치는 설명을 길게 쓰는 데 있지 않고 **maintainer가 같은 추적을 처음부터 반복하지 않아도 되게 만드는 것**에 있다.

## 5. 이 기록에서 남길 수 있는 재사용 가능한 진단법

이 사례의 가치가 lazygit 하나에만 있지는 않다. Plugin/Wrapper가 외부 CLI를 호출할 때 같은 방식으로 볼 수 있다.

```text
UI에서 증상 발생
   ↓
누가 외부 기능을 호출했나
   ↓
실제 command/config를 누가 생성했나
   ↓
어떤 runtime/shell이 실행했나
   ↓
깨진 가정은 어느 경계에 있나
```

즉 wrapper 계층에서 보이는 오류를 바로 wrapper의 버그로 단정하지 않고 **호출 경로를 실제 command가 만들어지는 지점까지 내려가서 확인한다.**

## 회고

좋았던 점은 dotfiles의 짧은 workaround comment가 본체 추적의 출발점이 되었다는 것이다. 임시 해결책에도 "왜 필요한가"를 남겨두면 나중에 원인을 다시 파고들 수 있다.

또 하나는 PR을 만드는 것 자체를 기여의 목표로 두지 않았다는 점이다. 내가 검증할 수 있는 범위는 재현과 원인 추적까지였고, 그 경계에서는 **근거가 잘 정리된 Issue가 미검증 PR보다 나은 산출물**이었다.

아쉬운 점은 Windows 검증 환경이 없어 실제 수정까지 이어갈 수 없었다는 것이다. 반대로 이 경험 덕분에 다중 플랫폼 OSS 기여에서 **Target 환경 검증 가능성도 기여 범위를 결정하는 조건**이라는 점이 분명해졌다.

## 정리

이 사례를 한 줄로 압축하면:

```text
워크어라운드 발견
→ 호출 경로 추적
→ 책임 프로젝트 분리
→ 실제 실행 환경과 가정 비교
→ 내가 검증할 수 있는 범위까지 Issue로 전달
```

문제를 해결하는 것과 upstream에 좋은 보고를 만드는 것은 조금 다른 작업이다. **좋은 OSS 이슈는 증상을 설명하는 문서가 아니라, 실패가 발생하는 경계를 최대한 좁혀 놓은 조사 결과**에 가깝다.

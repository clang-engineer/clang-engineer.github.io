---
title       : "AeroSpace + Hammerspoon — 창을 한 번에 제자리로 재정렬하기"
description : "macOS 타일링 WM AeroSpace와 자동화 런타임 Hammerspoon을 URL scheme으로 엮어, 손으로 잘못 옮긴 창들을 단축키 하나로 각자 지정 워크스페이스에 되돌리는 스크립트를 만든다. 두 도구의 분업 구조와 bash 3.2 함정까지."
date        : 2026-07-03 16:00:00 +0900
updated     : 2026-11-16 10:15:00 +0900
categories  : [macos, "창 관리"]
tags        : [aerospace, hammerspoon, macos, tiling, window-manager, bash, guide]
pin         : false
hidden      : false
---

> **[macOS 로드맵](./2026-07-03-00-macos-roadmap.md)** — 창 관리(AeroSpace × Hammerspoon) 갈래
> 1. **연계 & 창 재정렬** (현재 글)
> 2. [Rectangle 대체 — 화면 내 창 분할](./2026-07-03-hammerspoon-window-tiling-rectangle.md)
> 3. [워크스페이스 정보 오버레이](./2026-07-03-aerospace-workspace-overlay.md)
{: .prompt-info }

macOS에서 타일링 윈도우 매니저 [AeroSpace](https://github.com/nikitabobko/AeroSpace)를 쓰다 보면, 앱마다 지정 워크스페이스를 정해두고 자동 배치하게 된다. 그런데 창을 손으로 잘못 옮기면 그 자리에 그대로 남아버린다. 이 글은 **"열린 창 전부를 각자 지정 워크스페이스로 한 번에 재정렬"**하는 단축키를 만들면서, AeroSpace와 Hammerspoon을 어떻게 엮는지 정리한다.

## 문제: 자동 배치 규칙은 "한 번만" 발동한다

AeroSpace는 `on-window-detected` 규칙으로 앱을 워크스페이스에 자동 배치한다.

```toml
# ~/.aerospace.toml
[[on-window-detected]]
if.app-id = 'com.mitchellh.ghostty'
run = 'move-node-to-workspace 2:Terminal'

[[on-window-detected]]
if.app-id = 'com.jetbrains.intellij'
run = ['move-node-to-workspace 4:JetBrains', 'layout floating']
```

핵심은 이 규칙이 **창이 처음 생길 때 딱 한 번만** 발동한다는 점이다. 이미 만들어진 창을 나중에 `move-node-to-workspace`(예: `alt-shift-4`)로 잘못 옮기면, 규칙이 다시 돌지 않아 창은 엉뚱한 워크스페이스에 남는다. 하나씩 손으로 되돌리는 건 번거롭다.

이 글을 처음 쓸 때는 "모든 창에 규칙을 다시 적용"하는 명령이 없어 별도 스크립트로 풀었다. **현재 AeroSpace 문서에는** `aerospace run-callback --for-every-window on-window-detected`가 있다([명령 문서](https://nikitabobko.github.io/AeroSpace/commands#run-callback)). 새 규칙을 기존 창에 다시 적용하는 간단한 용도라면 이 명령부터 고려하자. 아래 스크립트는 설정의 앱별 *이동 규칙만* 골라 실행하고, 실제 이동 건수를 Hammerspoon에 전달하던 방식이다.

## 두 도구의 분업 — 강점이 겹치지 않는다

| | 강점 | 약점 |
|---|---|---|
| **AeroSpace** | 타일링·워크스페이스·창 이동/포커스 | 알림 UI, 이벤트 반응형 스크립팅 |
| **Hammerspoon** | Lua 스크립팅, 알림(`hs.alert`), 키바인딩, 앱/화면 이벤트 | 자체 타일링 (직접 다 짜야 함) |

**AeroSpace가 창을 옮기고, Hammerspoon이 그 결과를 보기 좋게 알려준다.** 서로의 약점을 상대의 강점으로 덮는 구조라 궁합이 좋다.

## 연결 지점(seam) — URL scheme 하나

두 도구를 잇는 접착제는 단 하나, Hammerspoon의 URL scheme이다.

```sh
# 보내는 쪽 (AeroSpace 설정 또는 셸 스크립트)
open -g "hammerspoon://<이벤트이름>?<파라미터>"
```

```lua
-- 받는 쪽 (Hammerspoon)
hs.urlevent.bind("<이벤트이름>", function(_, params)
  -- params.파라미터 로 값 접근
end)
```

`open -g`의 `-g`는 Hammerspoon 창으로 포커스가 튀지 않게 백그라운드로 여는 옵션이다. 이 단방향·느슨한 결합 덕분에 한쪽 설정을 바꿔도 다른 쪽이 잘 깨지지 않는다.

예를 들어 AeroSpace 설정에 워크스페이스 전환 훅을 걸어두면:

```toml
# ~/.aerospace.toml
exec-on-workspace-change = [
  '/bin/bash', '-c',
  'open -g hammerspoon://aerospace-workspace-changed',
]
```

Hammerspoon이 이 이벤트를 받아 현재 워크스페이스의 앱 목록을 알림으로 띄우는 식이다.

## 실전: 모든 창 재정렬 스크립트

이제 본론. 열린 창을 순회하며 각자 home 워크스페이스로 되돌리는 스크립트를 만든다.

### 1. 필요한 CLI 능력 확인

```sh
aerospace list-windows --help
aerospace move-node-to-workspace --help
```

두 가지가 핵심이다.

- `move-node-to-workspace --window-id <id> <ws>` — 포커스와 무관하게 **특정 창**을 지정 워크스페이스로 이동
- `list-windows --all --format '%{window-id}|%{app-bundle-id}'` — 모든 창의 ID와 번들 ID를 한 줄씩 출력

### 2. 매핑은 설정 파일에서 읽는다 (단일 출처)

앱↔워크스페이스 매핑은 이미 `~/.aerospace.toml`에 `on-window-detected` 규칙으로 존재한다. 스크립트에 다시 하드코딩하면 규칙을 바꿀 때마다 두 곳을 고쳐야 한다. 그래서 **toml을 파싱해서 매핑을 얻는다.**

```bash
#!/bin/bash
# aerospace-reflow.sh — 모든 창을 지정 워크스페이스로 재정렬
AERO=/opt/homebrew/bin/aerospace
TOML=~/.aerospace.toml

# on-window-detected 블록에서 "bundle-id|workspace" 매핑 추출
MAP=""
app=""
while IFS= read -r line; do
  case "$line" in
    '[[on-window-detected]]'*) app="" ;;
    'if.app-id'*) app="${line#*\'}"; app="${app%%\'*}" ;;
    'run'*)
      if [[ "$line" == *move-node-to-workspace* && -n "$app" ]]; then
        ws="${line#*move-node-to-workspace }"; ws="${ws%%\'*}"
        MAP="${MAP}${app}|${ws}"$'\n'
      fi
      app="" ;;
  esac
done < "$TOML"
```

`${line#*\'}`(앞에서 첫 따옴표까지 제거)와 `${app%%\'*}`(뒤 따옴표부터 제거)로 `if.app-id = 'com.google.Chrome'`에서 번들 ID만 뽑아낸다. `run` 줄에서는 `move-node-to-workspace ` 뒤부터 다음 따옴표 전까지가 워크스페이스 이름(`2:Terminal`)이다.

> 이 파서는 당시 사용한 `if.app-id`와 한 줄짜리 `run` 형식을 전제로 한다. 현재 공식 가이드는 `if.app-id`를 지원하지만 새 설정에는 `if = 'test %{app-bundle-id} = …'` 형식을 권장한다([변경 안내](https://nikitabobko.github.io/AeroSpace/guide#legacy-on-window-detected-syntax)). 그 형식에는 이 텍스트 파서를 그대로 적용할 수 없으므로, 새 설정에서는 위의 `run-callback`을 우선 살펴보자.
{: .prompt-warning }

### 3. 창을 순회하며 제자리로 이동

```bash
moved=0
while IFS='|' read -r wid bid; do
  target=$(printf '%s' "$MAP" | awk -F'|' -v b="$bid" '$1==b{print $2; exit}')
  [ -z "$target" ] && continue
  if "$AERO" move-node-to-workspace --window-id "$wid" --fail-if-noop "$target" 2>/dev/null; then
    moved=$((moved + 1))
  fi
done < <("$AERO" list-windows --all --format '%{window-id}|%{app-bundle-id}')

# Hammerspoon에 완료 알림
open -g "hammerspoon://aerospace-reflowed?moved=${moved}"
```

`--fail-if-noop`이 포인트다. 이미 제자리에 있는 창은 아무 동작도 하지 않고(그래서 불필요한 이동·포커스 변화가 없다) 종료 코드만 실패로 반환한다. `2>/dev/null`로 그 노이즈를 삼키고, 실제로 옮긴 창만 카운트한다.

### 4. 단축키 등록

```toml
# ~/.aerospace.toml — [mode.main.binding]
alt-shift-0 = ['exec-and-forget ~/.hammerspoon/modules/aerospace-reflow.sh']  # re-home all windows
```

> `[mode.main.binding]`은 기본 키맵을 병합하지 않고 대체한다. 기본 키까지 함께 나열해야 한다는 점은 [AeroSpace 기본](./2026-07-03-aerospace-basics.md)과 [서비스 모드 글](./2026-07-14-aerospace-service-mode.md)에 정리했다.
{: .prompt-tip }

설정 반영:

```sh
aerospace reload-config
```

## 완료 알림을 Hammerspoon으로

스크립트 끝의 `open -g "hammerspoon://aerospace-reflowed?..."`를 Hammerspoon이 받아 알림을 띄운다.

```lua
-- ~/.hammerspoon/modules/aerospace-windows.lua
hs.urlevent.bind("aerospace-reflowed", function(_, params)
  local moved = params and params.moved or "0"
  hs.alert.show("Reflowed · " .. moved .. " moved")
end)
```

이제 `alt-shift-0`을 누르면 스크립트가 창 이동을 시도하고 "Reflowed · N moved" 알림을 보낸다.

### 일부러 오배치해 끝까지 확인하기

알림은 `open -g`로 보낸 **이동 건수 메시지**이지, 모든 창이 올바른 곳에 있다는 검증 결과가 아니다. URL 핸들러가 뜨지 않아 알림만 빠질 수도 있고, 위 스크립트는 실패한 이동의 오류도 숨긴다. 또한 `hs` CLI/`hs.ipc`는 아래의 *원격 reload* 용도이며 `hs.urlevent` 알림의 필수 조건이 아니다. 결과는 AeroSpace의 창 목록에서 직접 확인한다.

```sh
# 규칙에 있는 앱의 열린 창 하나를 골라 일부러 엉뚱한 공간으로 옮긴다.
wid=$(aerospace list-windows --all --format '%{window-id}|%{app-bundle-id}' |
  awk -F'|' '$2=="com.mitchellh.ghostty"{print $1; exit}')
aerospace move-node-to-workspace --window-id "$wid" 4:JetBrains
# 이때 실제로 4:JetBrains에 있는지 먼저 확인한다.
aerospace list-windows --all --format '%{window-id}|%{workspace}' |
  awk -F'|' -v id="$wid" '$1==id{print $2}'
# 기존 스크립트를 실행한 다음 같은 창의 워크스페이스를 다시 확인한다.
~/.hammerspoon/modules/aerospace-reflow.sh
aerospace list-windows --all --format '%{window-id}|%{workspace}' |
  awk -F'|' -v id="$wid" '$1==id{print $2}'
```

첫 조회는 `4:JetBrains`, 마지막 조회는 규칙에 적힌 `2:Terminal`이어야 한다. 알림이 안 뜨더라도 마지막 값이 돌아왔다면 재정렬과 알림 경로를 분리해 진단할 수 있다.

## 자주 만나는 함정

### macOS 기본 bash는 3.2다

스크립트를 대화형 셸(zsh나 Homebrew bash 5)에서 테스트하면 잘 되는데, `#!/bin/bash` 셔뱅으로 실행하면 터지는 경우가 있다. macOS의 `/bin/bash`는 라이선스 문제로 **버전 3.2에 묶여 있고, 연관 배열(`declare -A`)을 지원하지 않는다.**

```
declare: -A: invalid option
```

그래서 위 스크립트는 연관 배열 대신 `"bid|ws"` 텍스트 맵 + `awk` 조회로 짰다. macOS용 셸 스크립트는 항상 3.2 호환을 염두에 두는 게 안전하다. (정 필요하면 셔뱅을 `#!/opt/homebrew/bin/bash`로 바꿔 bash 5를 쓰는 방법도 있다.)

### 스크립트가 있는데도 파일을 못 찾는다면

`exec-and-forget`가 `no such file`을 내면 바인딩 경로뿐 아니라 **실제 파일명**을 살핀다. 예컨대 다운로드·이름 변경 과정에서 `aerospace-reflow.sh)`처럼 끝에 `)`가 붙어 있으면 겉보기에는 비슷해도 다른 파일이다.

```sh
for f in "$HOME/.hammerspoon/modules"/aerospace-reflow*; do
  [ -e "$f" ] && printf '[%s]\n' "${f##*/}"
done
```

출력된 정확한 이름을 확인하고, 특수문자가 섞였다면 양쪽 경로를 따옴표로 감싸 `mv`로 바로잡는다. 그 뒤 다시 위의 **오배치 → 실행 → 워크스페이스 조회**로 확인한다.

### Hammerspoon 원격 reload는 ipc 모듈이 필요

Lua 핸들러를 새로 추가하면 Hammerspoon을 reload해야 반영된다. CLI로 reload하려면 `hs` 명령이 필요한데, 이건 기본으로 설치되지 않는다.

```lua
-- ~/.hammerspoon/init.lua 맨 위
hs.ipc.cliInstall() -- `hs` CLI 활성화
```

단, 이 줄 자체도 최초 한 번은 메뉴바에서 수동 reload를 해야 적용된다(닭-달걀 문제). 그 뒤로는 `hs -c "hs.reload()"`로 원격 reload가 가능하다.

## 정리

- AeroSpace의 `on-window-detected`는 창 생성 시 한 번만 발동 → "재정렬" 명령은 직접 만들어야 한다.
- **AeroSpace(창 배치) + Hammerspoon(UI·자동화)**를 `open -g hammerspoon://` URL scheme으로 느슨하게 결합한다.
- 매핑은 `~/.aerospace.toml`에서 파싱해 **단일 출처**로 유지한다.
- macOS 셸 스크립트는 **bash 3.2 호환**(연관 배열 금지)을 기본으로 둔다.

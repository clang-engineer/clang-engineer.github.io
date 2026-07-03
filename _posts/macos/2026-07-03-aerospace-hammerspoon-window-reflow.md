---
title       : "AeroSpace + Hammerspoon — 창을 한 번에 제자리로 재정렬하기"
description : "macOS 타일링 WM AeroSpace와 자동화 런타임 Hammerspoon을 URL scheme으로 엮어, 손으로 잘못 옮긴 창들을 단축키 하나로 각자 지정 워크스페이스에 되돌리는 스크립트를 만든다. 두 도구의 분업 구조와 bash 3.2 함정까지."
date        : 2026-07-03 16:00:00 +0900
updated     : 2026-07-03 16:00:00 +0900
categories  : [macos, "창 관리"]
tags        : [aerospace, hammerspoon, macos, tiling, window-manager, bash, guide]
pin         : false
hidden      : false
---

> **[macOS 로드맵](/posts/macos/2026-07-03-macos-roadmap/)** — 창 관리(AeroSpace × Hammerspoon) 갈래
> 1. **연계 & 창 재정렬** (현재 글)
> 2. [Rectangle 대체 — 화면 내 창 분할](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/)
> 3. [워크스페이스 정보 오버레이](/posts/macos/2026-07-03-aerospace-workspace-overlay/)
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

AeroSpace에는 "모든 창을 규칙대로 다시 배치" 같은 명령이 없다. 그래서 별도 스크립트가 필요하고, 여기서 Hammerspoon과의 분업이 자연스럽게 등장한다.

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

> `[mode.main.binding]`은 AeroSpace의 **기본 키맵을 전부 덮어쓴다.** 그래서 `alt-h`(focus left) 같은 기본 키도 직접 나열해야 하고, 반대로 기본에 없던 `alt-shift-0`은 충돌 없이 자유롭게 쓸 수 있다. (AeroSpace 기본은 `alt-shift-1`~`9`만 잡는다.)
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

이제 `alt-shift-0`을 누르면 창들이 제자리로 정렬되고 "Reflowed · N moved" 알림이 뜬다.

## 함정 두 가지

### macOS 기본 bash는 3.2다

스크립트를 대화형 셸(zsh나 Homebrew bash 5)에서 테스트하면 잘 되는데, `#!/bin/bash` 셔뱅으로 실행하면 터지는 경우가 있다. macOS의 `/bin/bash`는 라이선스 문제로 **버전 3.2에 묶여 있고, 연관 배열(`declare -A`)을 지원하지 않는다.**

```
declare: -A: invalid option
```

그래서 위 스크립트는 연관 배열 대신 `"bid|ws"` 텍스트 맵 + `awk` 조회로 짰다. macOS용 셸 스크립트는 항상 3.2 호환을 염두에 두는 게 안전하다. (정 필요하면 셔뱅을 `#!/opt/homebrew/bin/bash`로 바꿔 bash 5를 쓰는 방법도 있다.)

### Hammerspoon 원격 reload는 ipc 모듈이 필요

Lua 핸들러를 새로 추가하면 Hammerspoon을 reload해야 반영된다. CLI로 reload하려면 `hs` 명령이 필요한데, 이건 기본으로 설치되지 않는다.

```lua
-- ~/.hammerspoon/init.lua 맨 위
hs.ipc.cliInstall() -- `hs` CLI 활성화
```

단, 이 줄 자체도 최초 한 번은 메뉴바에서 수동 reload를 해야 적용된다(닭-달걀 문제). 그 뒤로는 `hs -c "hs.reload()"`로 원격 reload가 가능하다.

## AeroSpace를 고른 이유 — yabai와의 비교

같은 목적의 대안은 **yabai + skhd** 조합이다. 짚고 넘어갈 만한 트레이드오프:

- **yabai**: 진짜 BSP 트리 기반이라 타일링이 더 강력하지만, 일부 기능에 **SIP(System Integrity Protection) 비활성화**가 필요하고 macOS 업데이트마다 깨지기 쉽다.
- **AeroSpace**: **SIP를 건드리지 않는 것**이 핵심 철학이다. 자체 가상 워크스페이스를 구현해 macOS의 네이티브 Spaces를 우회하므로, OS 업데이트에 강하고 설정이 안정적이다.

강력함보다 안정성·유지보수성을 택한다면 AeroSpace가 합리적이고, 여기에 Hammerspoon을 알림·자동화 레이어로 얹으면 각 도구의 강점만 쓰는 조합이 된다.

## 정리

- AeroSpace의 `on-window-detected`는 창 생성 시 한 번만 발동 → "재정렬" 명령은 직접 만들어야 한다.
- **AeroSpace(창 배치) + Hammerspoon(UI·자동화)**를 `open -g hammerspoon://` URL scheme으로 느슨하게 결합한다.
- 매핑은 `~/.aerospace.toml`에서 파싱해 **단일 출처**로 유지한다.
- macOS 셸 스크립트는 **bash 3.2 호환**(연관 배열 금지)을 기본으로 둔다.

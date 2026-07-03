---
title       : "AeroSpace 워크스페이스에 정보 오버레이 붙이기 — Hammerspoon 비동기 알림"
description : "AeroSpace 워크스페이스를 전환할 때 현재 공간과 그 안의 앱 목록을 Hammerspoon 알림으로 띄운다. exec-on-workspace-change 훅, 중첩 hs.task 비동기 연쇄, 알림 스타일 커스터마이즈까지."
date        : 2026-07-03 17:00:00 +0900
updated     : 2026-07-03 17:00:00 +0900
categories  : [macos, "창 관리"]
tags        : [aerospace, hammerspoon, macos, window-manager, lua, async, guide]
pin         : false
hidden      : false
---

> **[macOS 창 관리 로드맵](/posts/macos/2026-07-03-macos-window-management-roadmap/)** — AeroSpace × Hammerspoon 시리즈
> 1. [연계 & 창 재정렬](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/)
> 2. [Rectangle 대체 — 화면 내 창 분할](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/)
> 3. **워크스페이스 정보 오버레이** (현재 글)
{: .prompt-info }

[AeroSpace](https://github.com/nikitabobko/AeroSpace)의 가상 워크스페이스는 macOS 네이티브 Spaces와 달리 전환 애니메이션이 없어 빠르지만, 그만큼 **"지금 몇 번 공간이지? 여기 뭐가 열려 있지?"**가 헷갈릴 수 있다. Hammerspoon으로 전환 순간 화면에 정보 오버레이(HUD)를 띄워 이 문제를 해결한다.

이 글은 [1편](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/)에서 소개한 `open -g hammerspoon://` 연동 seam을 심화한다. 핵심은 **AeroSpace CLI를 비동기로 두 번 연쇄 호출**하는 부분이다.

## 전체 흐름

```
AeroSpace 워크스페이스 전환
  → exec-on-workspace-change 훅 발동
  → open -g "hammerspoon://aerospace-workspace-changed"
  → Hammerspoon urlevent 핸들러
  → aerospace list-workspaces --focused   (비동기)
  → aerospace list-windows --workspace X   (비동기, 첫 결과에 의존)
  → hs.alert 오버레이 표시
```

## 1. AeroSpace 훅 — 전환 시 Hammerspoon 호출

```toml
# ~/.aerospace.toml
exec-on-workspace-change = [
  '/bin/bash', '-c',
  'open -g hammerspoon://aerospace-workspace-changed',
]
```

워크스페이스가 바뀔 때마다 AeroSpace가 이 명령을 실행한다. `open -g`의 `-g`는 Hammerspoon으로 포커스가 튀지 않게 백그라운드로 URL을 여는 옵션이다.

## 2. 중첩 hs.task — 비동기 연쇄가 필요한 이유

받는 쪽 Hammerspoon. 여기가 이 글의 핵심이다.

현재 워크스페이스 이름을 알아야(`list-workspaces --focused`), 그 이름으로 앱 목록을 조회(`list-windows --workspace <이름>`)할 수 있다. **두 번째 호출이 첫 번째 결과에 의존**한다.

`hs.task.new`는 외부 프로세스를 **논블로킹**으로 실행하고 완료 시 콜백을 부른다. 그래서 두 호출을 콜백 안에 중첩해서 연쇄한다.

```lua
local aero = "/opt/homebrew/bin/aerospace"

local function showWorkspaceApps()
  -- ① 현재 워크스페이스 이름 조회
  hs.task.new(aero, function(_, focusedRaw, _)
    local focused = focusedRaw:gsub("%s+$", "")   -- 개행 제거

    -- ② 그 이름으로 앱 목록 조회 (①의 결과에 의존 → 콜백 안에 중첩)
    hs.task.new(aero, function(_, winOutput, _)
      local apps, seen = {}, {}
      for app in winOutput:gmatch("[^\r\n]+") do   -- 줄 단위 파싱
        app = app:gsub("^%s+", ""):gsub("%s+$", "")
        if app ~= "" and not seen[app] then         -- 중복 제거
          seen[app] = true
          table.insert(apps, app)
        end
      end

      local icon = "워크스페이스: " .. focused
      local text = #apps > 0 and (icon .. "\n" .. table.concat(apps, "  ·  "))
                             or  (icon .. "\n(비어 있음)")
      showAlert(text)
    end, {"list-windows", "--workspace", focused, "--format", "%{app-name}"}):start()

  end, {"list-workspaces", "--focused"}):start()
end
```

포인트 정리:

- **`hs.task.new(경로, 콜백, {인자들})`** — 콜백 시그니처는 `(exitCode, stdout, stderr)`. `:start()`를 호출해야 실제 실행된다.
- **중첩 = 순차 의존** — `hs.task`는 비동기라 그냥 나란히 두면 순서가 보장 안 된다. 첫 결과가 둘째 입력이므로 콜백 안에 넣어 연쇄한다.
- **출력 파싱** — CLI stdout은 문자열이므로 `gmatch("[^\r\n]+")`로 줄 단위 분해, `gsub`로 공백 트림, `seen` 테이블로 중복 앱 제거.

## 3. urlevent 바인딩

AeroSpace가 부른 URL을 이 함수에 연결한다.

```lua
hs.urlevent.bind("aerospace-workspace-changed", function()
  showWorkspaceApps()
end)
```

`hammerspoon://aerospace-workspace-changed` → 이 핸들러다. URL의 host 부분이 이벤트 이름이 된다.

## 4. 알림 스타일 커스터마이즈

기본 `hs.alert`는 밋밋하다. 스타일 테이블로 반투명 다크 HUD를 만든다.

```lua
local alertStyle = {
  textSize = 14,
  textColor = {white = 1, alpha = 0.7},
  fillColor = {white = 0.1, alpha = 0.4},   -- 반투명 어두운 배경
  strokeWidth = 0,
  radius = 8,
  padding = 12,
  fadeInDuration = 0.1,
  fadeOutDuration = 0.5,
}

local function showAlert(text)
  hs.alert.closeAll()   -- 이전 알림 즉시 제거 (겹침 방지)
  hs.alert.show(text, alertStyle, hs.screen.mainScreen(), 1.5)  -- 1.5초 표시
end
```

`hs.alert.closeAll()`을 먼저 부르는 게 중요하다. 워크스페이스를 빠르게 연달아 전환하면 알림이 쌓이는데, 이걸로 이전 걸 지우고 최신만 남긴다.

## 응용 — 창 이동 시에도 알림

같은 패턴으로 "창을 옮겼을 때"도 피드백을 줄 수 있다. 이동 명령을 셸 스크립트로 감싸, 이동할 앱 이름을 먼저 캡처한 뒤 알림 URL을 쏜다.

```bash
#!/bin/bash
# aerospace-move-node.sh <workspace>
WS="$1"
APP=$(aerospace list-windows --focused --format '%{app-name}')
aerospace move-node-to-workspace "$WS"
open -g "hammerspoon://aerospace-node-moved?ws=${WS}&app=${APP// /%20}"
```

```lua
hs.urlevent.bind("aerospace-node-moved", function(_, params)
  local app = params and params.app or ""
  local ws  = params and params.ws or ""
  showAlert(app .. " → " .. ws)
end)
```

URL 쿼리스트링(`?ws=...&app=...`)으로 파라미터를 넘기고, 핸들러에서 `params` 테이블로 받는다. 앱 이름의 공백은 `${APP// /%20}`로 URL 인코딩한다.

## 정리

- **`exec-on-workspace-change` 훅 → `open -g hammerspoon://`**로 AeroSpace 이벤트를 Hammerspoon에 전달.
- **`hs.task` 비동기 연쇄** — 앞 명령 결과가 뒤 명령 입력이면 콜백 안에 중첩한다.
- CLI stdout은 **문자열 파싱**(`gmatch`·`gsub`·중복 제거)으로 구조화.
- **`hs.alert.closeAll()`**로 알림 겹침을 방지하고, 스타일 테이블로 HUD 외형을 다듬는다.

이렇게 AeroSpace(창 배치)와 Hammerspoon(정보·자동화)을 URL scheme으로 느슨하게 엮으면, 각 도구의 강점만 골라 쓰는 조합이 완성된다.

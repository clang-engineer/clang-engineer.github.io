---
title       : "Karabiner-Elements — macOS 소프트웨어 키맵 레이어"
description : "QMK·ZMK가 보드에 올리는 하드웨어 키맵이라면, Karabiner-Elements는 macOS 자체에 얹는 소프트웨어 키맵이다. Caps→Ctrl/Esc 같은 단순 리맵부터 hold-tap·Hyper 키까지, karabiner.json을 dotfiles로 관리하는 법과 설치 시 권한 함정을 정리한다."
date        : 2026-07-03 18:30:00 +0900
updated     : 2026-07-03 18:30:00 +0900
categories  : [etc, "keyboard"]
tags        : [keyboard, karabiner, macos, keymap]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/etc/2026-07-03-keyboard-roadmap/) · [키보드 펌웨어 지형도](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) · [키맵 용어집](/posts/etc/2026-07-03-keymap-terms-glossary/)

QMK·ZMK는 **키맵을 보드 펌웨어에 굽는다**. 강력하지만 두 가지 한계가 있다 — 맥북 **내장 키보드**엔 못 올리고, 리플래시할 수 없는 **기성 키보드**도 손댈 수 없다. 이 빈틈을 macOS 쪽에서 메우는 게 [Karabiner-Elements](https://karabiner-elements.pqrs.org/)다. **무료·오픈소스**이고, 어떤 키보드가 물려 있든 **OS 레벨에서 키 입력을 가로채 재매핑**한다. 펌웨어가 "판때기의 키맵"이라면 Karabiner는 "맥의 키맵"이다.

## 언제 Karabiner를 쓰나

- **맥북 내장 키보드**나 리플래시 불가한 키보드를 리맵하고 싶을 때.
- 여러 키보드를 오가며 **맥에서 항상 동일한 키 동작**을 원할 때 (기기별 프로파일 지원).
- 펌웨어까지 갈 것 없이 `Caps Lock → Ctrl/Esc` 정도만 빠르게 바꾸고 싶을 때.

반대로 **어느 컴퓨터에 꽂아도 같아야 하는** 키맵이면 하드웨어 펌웨어(QMK/ZMK)가 맞다. 판단 기준은 [펌웨어 지형도](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) 참고. 둘은 배타적이지 않다 — 커스텀 보드엔 펌웨어, 맥북 내장 키보드엔 Karabiner처럼 **겹쳐 쓰는** 게 흔하다.

## 두 층위 — Simple vs Complex Modifications

Karabiner의 리맵은 두 갈래다.

**Simple Modifications** — 키 1:1 치환. `Caps Lock → Left Control`처럼 GUI에서 클릭 몇 번이면 끝. 기기(Devices)별로 따로 걸 수 있어, "이 외장 키보드에서만" 같은 조건도 가능하다.

**Complex Modifications** — JSON 규칙으로 **조건·다중 동작**을 표현. [키맵 용어집](/posts/etc/2026-07-03-keymap-terms-glossary/)의 hold-tap·mod-tap이 여기서 나온다. 대표 예가 **dual-role Caps** — 단독으로 누르면 `Esc`, 누르고 있으면 `Ctrl`:

```json
{
  "description": "Caps Lock → Esc(단독) / Control(누름)",
  "manipulators": [
    {
      "type": "basic",
      "from": { "key_code": "caps_lock" },
      "to": [{ "key_code": "left_control" }],
      "to_if_alone": [{ "key_code": "escape" }]
    }
  ]
}
```

`to`(누르고 있을 때)와 `to_if_alone`(단독 탭)의 조합이 QMK의 `MT`/ZMK의 hold-tap과 같은 개념이다. home-row mods, **Hyper 키**(한 키를 `Cmd+Ctrl+Opt+Shift`로 만들어 단축키 충돌 없는 전용 모디파이어로) 같은 고급 패턴도 전부 Complex 규칙으로 짠다.

직접 JSON을 안 짜고 싶으면 공식 [Complex Modifications 규칙 저장소](https://ke-complex-modifications.pqrs.org/)에서 브라우저로 바로 import할 수 있다.

## 설치 함정 — 권한과 드라이버 확장

Karabiner는 키 입력을 가로채므로 macOS 보안 승인이 **여러 단계** 필요하다. 처음 깔면 여기서 막히는 사람이 많다.

- **입력 모니터링(Input Monitoring)** 권한 — `karabiner_grabber`·`karabiner_observer`에 부여.
- **드라이버 확장(System/Driver Extension)** 허용 — 시스템 설정에서 승인 후, 경우에 따라 재부팅.
- 위 승인이 하나라도 빠지면 **키가 아예 안 먹거나 리맵만 안 된다.**

이 앱 권한 승인 흐름 자체는 [macOS 시스템 설정 — 앱 권한](/posts/macos/2026-07-03-macos-system-settings/) 쪽과 같은 맥락이다. 안 되면 거기부터 점검하면 된다.

> 진단 팁: 어떤 키가 무슨 코드로 잡히는지 모를 땐 함께 깔리는 **Karabiner-EventViewer**로 실제 `key_code`를 확인하고 규칙에 쓴다.
{: .prompt-tip }

## 설정을 dotfiles로 관리

Karabiner의 모든 설정은 `~/.config/karabiner/karabiner.json` **한 파일**에 모인다. 즉 이 파일만 버전관리하면 새 맥에서 키맵이 그대로 재현된다.

```bash
# dotfiles 저장소로 옮기고 심볼릭 링크
mv ~/.config/karabiner/karabiner.json ~/dotfiles/karabiner/
ln -sf ~/dotfiles/karabiner/karabiner.json ~/.config/karabiner/karabiner.json
```

심볼릭 링크로 dotfiles와 엮는 구조는 [dotfiles를 git 저장소 + 심볼릭 링크로 관리하기](/posts/shell/2026-07-03-dotfiles-symlink-management/)에 정리해 뒀다. 펌웨어 키맵은 각 보드의 config 저장소에, macOS 키맵은 dotfiles에 — **양쪽을 git으로 남겨 두면** 어느 환경이든 손버릇이 따라온다.

## 정리

- **하드웨어 못 미치는 곳**(맥북 내장·기성 키보드)을 덮는 macOS 소프트웨어 키맵 레이어.
- **Simple**은 GUI 1:1 치환, **Complex**는 JSON으로 hold-tap·Hyper 같은 고급 매핑.
- 설치는 **입력 모니터링 + 드라이버 확장 권한**이 관문 — 안 먹으면 여기부터.
- 설정은 `karabiner.json` 하나 → **dotfiles로 버전관리**하면 새 맥에서 즉시 재현.

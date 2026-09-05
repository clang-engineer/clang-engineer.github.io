---
title       : "Karabiner-Elements — macOS 소프트웨어 키맵 레이어"
description : "QMK·ZMK가 보드에 올리는 하드웨어 키맵이라면, Karabiner-Elements는 macOS 자체에 얹는 소프트웨어 키맵이다. Caps→Ctrl/Esc 같은 단순 리맵부터 hold-tap·Hyper 키까지, karabiner.json을 dotfiles로 관리하는 법과 설치 시 권한 함정을 정리한다."
date        : 2026-07-03 18:30:00 +0900
updated     : 2026-09-05 21:14:00 +0900
categories  : [keyboard, "OS 레벨 리맵"]
tags        : [keyboard, karabiner, macos, keymap]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/keyboard/2026-07-03-keyboard-roadmap/) · [키보드 펌웨어 지형도](/posts/keyboard/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) · [키맵 용어집](/posts/keyboard/2026-07-03-keymap-terms-glossary/)

QMK·ZMK는 **키맵을 보드 펌웨어에 굽는다**. 강력하지만 두 가지 한계가 있다 — 맥북 **내장 키보드**엔 못 올리고, 리플래시할 수 없는 **기성 키보드**도 손댈 수 없다. 이 빈틈을 macOS 쪽에서 메우는 게 [Karabiner-Elements](https://karabiner-elements.pqrs.org/)다. 어떤 키보드가 물려 있든 **OS 레벨에서 키 입력을 가로채 재매핑**한다. 펌웨어가 "판때기의 키맵"이라면 Karabiner는 "맥의 키맵"이다.

## 언제 Karabiner를 쓰나

- **맥북 내장 키보드**나 리플래시 불가한 키보드를 리맵하고 싶을 때.
- 여러 키보드를 오가며 **맥에서 항상 동일한 키 동작**을 원할 때.
- 펌웨어까지 갈 것 없이 `Caps Lock → Ctrl/Esc` 정도만 빠르게 바꾸고 싶을 때.

반대로 **어느 컴퓨터에 꽂아도 같아야 하는** 키맵이면 하드웨어 펌웨어(QMK/ZMK)가 맞다. 판단 기준은 [펌웨어 지형도](/posts/keyboard/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) 참고. 둘은 배타적이지 않다 — 커스텀 보드엔 펌웨어, 맥북 내장 키보드엔 Karabiner처럼 겹쳐 쓸 수 있다.

## 두 층위 — Simple vs Complex Modifications

Karabiner의 리맵은 두 갈래다.

**Simple Modifications**는 키 1:1 치환이다. `Caps Lock → Left Control`처럼 GUI에서 바로 지정한다.

**Complex Modifications**는 JSON 규칙으로 조건과 다중 동작을 표현한다. [키맵 용어집](/posts/keyboard/2026-07-03-keymap-terms-glossary/)의 hold-tap·mod-tap과 같은 문제를 OS 레벨에서 풀 수 있다. 대표 예가 dual-role Caps다.

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

`to`와 `to_if_alone`을 조합하면 한 키에 홀드/탭 역할을 나눌 수 있다. Hyper 키처럼 여러 modifier를 묶는 패턴도 Complex 규칙으로 표현한다.

## 설치 함정 — 권한과 확장 승인

Karabiner는 키 입력을 가로채므로 macOS 보안 승인이 필요하다. 설치 후 동작하지 않으면 단순 JSON 오류보다 먼저 권한 계층을 본다.

- 입력 모니터링 관련 권한
- Karabiner가 요구하는 시스템/드라이버 확장 승인
- 앱 재시작 또는 시스템이 요구하는 재로그인·재부팅 여부

macOS 버전에 따라 설정 화면과 승인 방식은 달라질 수 있으므로 현재 Karabiner 안내와 시스템 설정을 기준으로 확인한다.

> 어떤 키가 어떤 코드로 들어오는지 모를 땐 **Karabiner-EventViewer**로 실제 `key_code`를 확인한다.
{: .prompt-tip }

## 설정을 dotfiles로 관리

Karabiner 설정은 `~/.config/karabiner/karabiner.json`에 저장된다. 이 파일을 버전관리하면 새 Mac에서도 키맵을 재현하기 쉽다.

```bash
mv ~/.config/karabiner/karabiner.json ~/dotfiles/karabiner/
ln -sf ~/dotfiles/karabiner/karabiner.json ~/.config/karabiner/karabiner.json
```

심볼릭 링크 기반 dotfiles 관리 구조는 [dotfiles를 git 저장소 + 심볼릭 링크로 관리하기](/posts/shell/2026-07-03-dotfiles-symlink-management/)에 정리해 뒀다.

```text
보드별 키맵
→ QMK / ZMK config 저장소

macOS 전역 키맵
→ Karabiner config / dotfiles
```

둘을 분리해 버전관리하면 하드웨어와 OS 레벨의 책임도 명확해진다.

## 정리

- Karabiner는 **macOS OS 레벨 키맵**이다.
- 펌웨어를 바꿀 수 없는 내장·기성 키보드까지 리맵할 수 있다.
- Simple은 1:1 치환, Complex는 조건·dual-role·Hyper 같은 고급 동작에 적합하다.
- 동작하지 않으면 JSON보다 먼저 macOS 권한과 확장 승인 상태를 확인한다.
- `karabiner.json`을 dotfiles로 관리하면 설정을 재현하기 쉽다.

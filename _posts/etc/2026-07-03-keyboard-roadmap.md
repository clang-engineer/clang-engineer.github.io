---
title       : "키보드 로드맵 — 세벌식·HHKB에서 커스텀 키맵까지"
description : "한글 자판(세벌식 390)과 미니멀 키보드(HHKB)의 배경을 잡고, 그 손버릇을 40% 커스텀 키보드 키맵으로 옮기는 흐름까지 — 키보드 글을 어떤 순서로 읽으면 좋은지 정리한 인덱스."
date        : 2026-07-03 15:00:00 +0900
updated     : 2026-07-03 17:30:00 +0900
categories  : [etc, "keyboard"]
tags        : [roadmap, keyboard, hhkb, sebeolsik, zmk, qmk, via]
pin         : false
hidden      : false
---

"내가 편한 키보드"를 파고들다 보면 결국 **자판 배열(어떻게 글자를 치는가)**과 **물리 키보드(어떤 판때기를 쓰는가)**, 그리고 **커스텀 키맵(그걸 내 손에 맞게 재배치)** 세 갈래가 얽힌다. 이 인덱스는 그 세 갈래를 "배경 → 실전" 순서로 읽도록 묶은 것이다.

## 1단계 — 배경 잡기

먼저 "무엇을, 왜"부터. 자판·하드웨어·도구 이야기라 관심 가는 쪽부터 읽어도 된다.

| 글 | 핵심 |
|---|---|
| [세벌식 390 입문](/posts/etc/2026-07-03-sebeolsik-390-intro/) | 세벌식이 두벌식과 뭐가 다른지(도깨비불 현상), 390 vs 최종, 그리고 **숫자를 넘패드처럼 치는** 390만의 기능. macOS 기본 지원 |
| [HHKB 입문](/posts/etc/2026-07-03-hhkb-intro/) | 미니멀 배열의 철학, **Ctrl이 Caps 자리**·Fn 방향키·삭제키 위치, Topre 스위치, 프로그래머에게 인기인 이유 |
| [키보드 펌웨어 지형도](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) | QMK vs ZMK(유선/무선), 그 위에 얹는 **VIA·VIAL·ZMK Studio**가 어디에 끼는지 — "어떤 스택을 고를까" |
| [키맵 용어집](/posts/etc/2026-07-03-keymap-terms-glossary/) | combo·hold-tap·momentary·layer-tap·mod-tap·tap-dance·one-shot… 키매핑 용어를 QMK·ZMK 표기와 함께 정리 |

## 2단계 — 실전: 커스텀 키맵으로 옮기기

배경에서 익힌 손버릇(세벌식의 넘패드 감각, HHKB의 Ctrl·Fn 방향키)을 실제 커스텀 키보드 키맵에 녹이는 단계. 펌웨어별로 "올리는 법 → 설계"로 읽으면 된다.

| 글 | 핵심 |
|---|---|
| [ZMK 키매핑 가이드](/posts/etc/2026-07-03-zmk-keymap-editor-build-flash/) | 판매자 config **포크 → 웹 키맵 에디터 → GitHub Actions 빌드 → 플래싱**. 일단 내 키맵을 보드에 올리는 4단계 |
| [ZMK 키맵 설계기 — HHKB + 40% + 세벌식 390](/posts/etc/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/) | 입력기 특성이 레이어를 강제하는 과정, 손버릇을 레이어로 재현, 위험한 키를 **hold-tap으로 실수 방지**, ZMK 레이어 인덱스 함정. **"40%에서 세벌식 390"은 선례가 드문 조합** |
| [QMK로 키맵 짜기](/posts/etc/2026-07-03-qmk-keymap-build/) | `keymap.c` 레이어 배열, `MO`·`LT`·`MT` 키코드, `qmk compile`/`flash`까지 QMK 쪽 워크플로우 |
| [VIA·VIAL 실전](/posts/etc/2026-07-03-via-vial-gui-remap/) | 컴파일 없이 **GUI로 실시간 리맵**. VIA vs VIAL 선택, ZMK는 ZMK Studio |

## 읽는 순서 정리

- **자판이 궁금하면** → 세벌식 390 입문부터.
- **키보드 하드웨어가 궁금하면** → HHKB 입문부터.
- **어떤 펌웨어·도구를 쓸지 모르겠으면** → 펌웨어 지형도로 지도를 먼저 그린다. 용어가 낯설면 용어집을 옆에 둔다.
- **ZMK로 키맵을 짜려면** → 키매핑 가이드로 올리는 법을 익히고 → 설계기로 "왜 이렇게 배치하나"까지.
- **QMK 쪽이면** → QMK로 키맵 짜기. 컴파일이 번거로우면 VIA·VIAL 실전으로 GUI 리맵.

앞으로 키보드 관련 글이 늘면 이 로드맵에 단계를 추가할 예정이다.

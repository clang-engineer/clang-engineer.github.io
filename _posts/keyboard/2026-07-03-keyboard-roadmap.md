---
title       : "키보드 로드맵 — 손버릇에서 Firmware·Keymap까지"
description : "세벌식·HHKB라는 개인 입력 배경에서 출발해 Keymap 용어를 잡고, Firmware(QMK·ZMK), Runtime Configurator(VIA·Vial·ZMK Studio), OS Remap(Karabiner)을 서로 다른 계층으로 구분한 뒤 ZMK 40% 키맵 구현으로 Zoom-in하는 학습 지도."
date        : 2026-07-03 15:00:00 +0900
updated     : 2026-09-06 12:55:00 +0900
categories  : [keyboard, "개요·인덱스"]
tags        : [roadmap, keyboard, hhkb, sebeolsik, zmk, qmk, via, vial, karabiner]
pin         : false
hidden      : false
---

이 로드맵은 커스텀 키보드 하드웨어 전체를 다루지 않는다. **내가 이미 가진 입력 습관을 Keymap으로 어떻게 표현하고 어느 계층에서 바꿀 것인가**가 범위다.

먼저 서로 다른 세 계층을 구분한다.

```text
Keyboard Firmware
→ QMK / ZMK
→ Scan·Keymap·Layer·Behavior를 장치에서 처리

Runtime Configurator
→ VIA / Vial / ZMK Studio
→ 지원 Firmware가 노출한 Dynamic Keymap을 GUI에서 변경

OS Remap
→ Karabiner-Elements
→ 장치 Firmware를 건드리지 않고 macOS에서 입력을 변환
```

즉 **QMK와 VIA는 같은 종류의 대안이 아니다.** QMK는 Firmware이고 VIA/Vial은 주로 QMK 계열 Firmware가 제공하는 Dynamic Keymap 기능을 설정하는 상위 도구다. ZMK와 ZMK Studio도 같은 관계로 본다.

## 한눈에 보기

| 구역 | 핵심 질문 | 관계 |
|---|---|---|
| 배경 | 어떤 입력 습관을 재현하려는가 | 개인 Context |
| 개념 지도 | Layer·hold-tap·combo 같은 말은 무엇인가 | 공통 기반 |
| Firmware 선택 | 장치에서 Keymap을 어느 Firmware가 처리하나 | QMK ↔ ZMK |
| ZMK 구현 | 무선 40% 보드에서 내 Keymap을 어떻게 구현하나 | 현재 주 경로 |
| Runtime 설정 | Compile 없이 지원 범위 안에서 바꿀 수 있나 | VIA/Vial/ZMK Studio |
| OS Remap | Firmware를 바꿀 수 없는 장치라면 어디서 바꾸나 | Karabiner |

## 1. 배경 — 무엇을 재현하려는가

세벌식 390과 HHKB는 모든 독자의 선행지식이 아니라 **현재 Keymap 설계를 만든 개인 Context**다. 둘은 독립적으로 읽어도 된다.

| 글 | 역할 |
|---|---|
| [세벌식 390 입문](./2026-07-03-sebeolsik-390-intro.md) | 두벌식과 다른 입력 특성·숫자 배열 등 뒤의 Layer 설계에 영향을 준 입력 Context |
| [HHKB 입문](./2026-07-03-hhkb-intro.md) | Caps 위치의 Ctrl·Fn Layer 등 익숙한 물리 배열과 손버릇을 설명 |

## 2. 공통 개념 — Firmware 이름보다 Keymap 언어를 먼저

Firmware가 달라도 Layer·combo·dual-role 같은 문제는 반복된다.

| 글 | 역할 |
|---|---|
| [키맵 용어집](./2026-07-03-keymap-terms-glossary.md) | combo·hold-tap·momentary·layer-tap·mod-tap·tap-dance·one-shot의 공통 좌표 |

이 문서는 Reference 성격이므로 순서대로 암기하지 않고, 구현 글을 읽다가 낯선 용어를 찾는 용도로 둔다.

## 3. Firmware 지형 — QMK와 ZMK

| 글 | 역할 |
|---|---|
| [키보드 Firmware 지형도](./2026-07-03-keyboard-firmware-qmk-zmk-via-vial.md) | QMK·ZMK의 실행 환경과 장치 범위를 비교하고 VIA/Vial/ZMK Studio가 어느 상위 계층에 놓이는지 지도화 |

핵심 비교축은 UI 유무가 아니라 **Firmware가 실행되는 장치와 지원 모델**이다.

```text
유선 MCU·거대한 보드 생태계
→ QMK

Bluetooth / split / Zephyr 기반 무선 보드
→ ZMK
```

실제 지원 여부는 보드 Firmware와 Vendor 구성에 따라 달라지므로 “유선=무조건 QMK, 무선=무조건 ZMK”라는 규칙으로 등치하지 않는다.

## 4. 주 경로 — ZMK에서 내 Keymap 구현

현재 문서셋이 가장 깊게 다루는 구현 경로다.

```text
Board의 기존 ZMK config 확보
→ Keymap 수정
→ GitHub Actions / local build
→ Firmware flash
→ 실제 사용에서 Layer·Behavior 보정
```

| 글 | 역할 |
|---|---|
| [ZMK 키매핑 가이드](./2026-07-03-zmk-keymap-editor-build-flash.md) | Config fork → 편집 → Build → Flash의 실제 How-to |
| [ZMK 키맵 설계기 — HHKB + 40% + 세벌식 390](./2026-07-03-zmk-keymap-hhkb-sebeolsik-40.md) | 입력 습관을 Layer·hold-tap으로 번역한 설계 Record/Analysis |

첫 글은 **작업 수행**, 둘째 글은 **왜 그런 배치를 선택했는지**가 중심이라 역할을 구분한다.

## Branch A — QMK 구현

ZMK의 다음 단계가 아니라 다른 Firmware를 쓰는 보드의 대안 경로다.

| 글 | 역할 |
|---|---|
| [QMK로 키맵 짜기](./2026-07-03-qmk-keymap-build.md) | `keymap.c`, Layer keycode, compile/flash를 QMK 방식으로 수행하는 How-to |

Layer 분리나 dual-role 설계 원칙은 공유할 수 있지만 ZMK Behavior와 QMK Keycode의 세부 의미를 그대로 등치하지 않는다.

## Branch B — Runtime Configurator

Firmware를 다시 Compile/Flash하지 않고 **Firmware가 허용한 Dynamic Keymap 범위**를 바꾸는 계층이다.

| 글 | 역할 |
|---|---|
| [VIA·Vial 실전](./2026-07-03-via-vial-gui-remap.md) | VIA/Vial의 GUI Keymap 변경과 지원 조건, ZMK Studio와의 계층적 대응을 설명 |

```text
QMK 계열 Firmware + Dynamic Keymap 지원
→ VIA / Vial

ZMK + Studio 지원 구성
→ ZMK Studio
```

Configurator는 Firmware를 대체하지 않는다. 보드가 해당 기능을 포함해 빌드되어 있어야 한다.

## Branch C — Firmware를 못 바꾸면 OS에서 Remap

| 글 | 역할 |
|---|---|
| [Karabiner-Elements — macOS 소프트웨어 Keymap](./2026-07-03-karabiner-elements-macos-keymap.md) | macOS Input Event 계층에서 key remap·dual-role·Hyper key를 구현하는 Tool/How-to |

```text
장치 자체 Behavior를 바꾼다
→ QMK / ZMK

장치는 그대로 두고 macOS에 들어온 Key Event를 바꾼다
→ Karabiner
```

따라서 Karabiner는 “쉬운 QMK”가 아니라 **제어 지점 자체가 다른 대안**이다.

## 다른 Roadmap과의 경계

- macOS 단축키·Window Tool과의 충돌/역할 → [macOS](../macos/2026-07-03-macos-roadmap.md)
- Karabiner 설정 파일을 여러 Machine에 배포 → [dotfiles](../shell/2026-07-08-dotfiles-roadmap.md)
- Terminal/Neovim/tmux 자체 Key Binding 체계 → 각 도구 Roadmap

이 로드맵은 Switch·Keycap·PCB·Case·Mount 방식 같은 **물리 커스텀 키보드 제작**은 다루지 않는다.

## 어디서 시작할까

```text
용어가 헷갈린다
→ Keymap 용어집

내 보드가 어떤 Firmware 계열인지 모르겠다
→ Firmware 지형도

ZMK 보드에 직접 올리고 싶다
→ ZMK Guide → ZMK 설계기

QMK 보드다
→ QMK How-to

지원되는 GUI로 Keymap만 빠르게 바꾸고 싶다
→ VIA/Vial 또는 ZMK Studio

Firmware를 바꿀 수 없는 macOS Keyboard다
→ Karabiner
```

> **Firmware(QMK·ZMK), Runtime Configurator(VIA·Vial·ZMK Studio), OS Remap(Karabiner)은 서로 다른 계층이다. 먼저 제어 지점을 정한 뒤 그 계층의 Tool로 Zoom-in한다.**

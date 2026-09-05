---
title       : "VIA·VIAL 실전 — 컴파일 없이 GUI로 키맵 바꾸기"
description : "VIA와 VIAL로 펌웨어 재빌드 없이 실시간으로 키를 리맵하는 법 — 지원 조건, 키 리맵·레이어·매크로, 그리고 VIA와 VIAL 중 무엇을 쓸지 정리합니다."
date        : 2026-07-03 17:20:00 +0900
updated     : 2026-09-05 21:14:00 +0900
categories  : [keyboard, "펌웨어·키맵"]
tags        : [keyboard, via, vial, qmk, guide]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/keyboard/2026-07-03-keyboard-roadmap/) · [키보드 펌웨어 지형도](/posts/keyboard/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) · [QMK로 키맵 짜기](/posts/keyboard/2026-07-03-qmk-keymap-build/)

QMK 키맵을 [매번 컴파일](/posts/keyboard/2026-07-03-qmk-keymap-build/)하는 건 번거롭다. **VIA·VIAL**은 지원 펌웨어가 올라간 키보드의 키맵을 GUI에서 바꾸는 도구다. 이 글은 펌웨어와 설정 도구의 경계를 잡고 실제 리맵 흐름을 정리한다.

## 전제 — 펌웨어가 VIA/VIAL을 지원해야 한다

VIA·VIAL은 아무 키보드에나 붙는 범용 리매퍼가 아니다. 키보드 펌웨어가 해당 프로토콜과 설정 저장 방식을 지원해야 한다.

- **VIA**: VIA 지원이 활성화된 QMK 펌웨어를 사용한다.
- **VIAL**: Vial용 QMK 계열 펌웨어를 사용한다.

즉 VIA/VIAL은 [QMK 위에 얹는 설정 도구](/posts/keyboard/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/)다. ZMK 계열에는 별도의 ZMK Studio가 있다.

## 기본 리맵 흐름

지원되는 앱 또는 웹 인터페이스에서 키보드를 연결하면 현재 레이어와 키 배치를 확인할 수 있다.

일반적인 흐름은 다음과 같다.

1. 키보드를 연결한다.
2. 바꿀 물리 키를 선택한다.
3. 새 키코드나 동작을 지정한다.
4. 필요한 경우 다른 레이어에서도 같은 방식으로 수정한다.
5. 실제 입력으로 결과를 검증한다.

지원 펌웨어에서는 설정이 키보드 쪽 비휘발성 저장소에 기록되어 재연결 후에도 유지될 수 있다. 정확한 저장 방식과 지원 범위는 보드와 펌웨어 구현에 따라 확인한다.

## 레이어·매크로·라이팅

GUI가 제공하는 범위 안에서는 다음과 같은 항목을 편집할 수 있다.

- **레이어**: 레이어별 키 배치와 레이어 전환 키
- **매크로**: 여러 입력을 하나의 동작으로 묶기
- **라이팅**: 지원 보드의 RGB·백라이트 설정
- **고급 동작**: 도구와 펌웨어에 따라 combo·tap dance 등 추가 기능

코드에서 직접 정의할 수 있는 모든 QMK 기능이 GUI에 그대로 노출되는 것은 아니다. **GUI의 편의성과 펌웨어 코드의 표현력은 별개의 축**으로 보는 편이 정확하다.

## VIA와 VIAL 중 무엇을 쓰나

| 기준 | VIA | VIAL |
|---|---|---|
| 주 사용 맥락 | VIA 지원 완제품·보드 | Vial 지원 펌웨어·DIY 보드 |
| 기본 리맵 | 지원 | 지원 |
| 레이어·매크로 | 지원 범위 내 제공 | 지원 범위 내 제공 |
| 고급 기능 | 보드·정의에 따라 다름 | Vial 기능으로 더 넓게 노출되는 경우가 많음 |
| 선택 기준 | 보드가 공식적으로 VIA를 지원 | Vial 펌웨어와 고급 GUI 설정을 사용하고 싶음 |

따라서 도구 이름부터 고르는 것보다 **현재 키보드에 어떤 펌웨어가 올라가 있고 무엇을 지원하는지**를 먼저 확인한다.

## ZMK는 별도 계열 — ZMK Studio

VIA/VIAL은 QMK 계열의 설정 도구다. ZMK에서는 같은 문제를 ZMK Studio가 담당한다.

```text
QMK firmware
├─ 직접 keymap.c 수정
├─ VIA
└─ VIAL

ZMK firmware
├─ .keymap 직접 수정
└─ ZMK Studio
```

ZMK의 포크 → 키맵 편집 → GitHub Actions 빌드 → 플래싱 흐름은 [ZMK 키매핑 가이드](/posts/keyboard/2026-07-03-zmk-keymap-editor-build-flash/)에서 다룬다.

## 정리

- VIA·VIAL은 QMK 계열 펌웨어의 **설정 도구 층**이다.
- 먼저 키보드와 펌웨어가 해당 도구를 지원하는지 확인한다.
- 간단한 리맵은 GUI가 편하고, GUI가 표현하지 못하는 동작은 QMK 코드로 내려간다.
- ZMK에서는 별도 계열인 ZMK Studio를 사용한다.

## 참고

- [VIA](https://caniusevia.com/)
- [Vial](https://get.vial.today/)

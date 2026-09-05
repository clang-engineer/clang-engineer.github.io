---
title       : "키보드 펌웨어 지형도 — QMK·ZMK와 그 위의 VIA·VIAL"
description : "커스텀 키보드에 발 들이면 쏟아지는 QMK·ZMK·VIA·VIAL을 '펌웨어 층'과 '설정 도구 층' 두 갈래로 나눠 정리합니다. 유선이냐 무선이냐, 컴파일하느냐 GUI로 바꾸느냐로 선택이 갈립니다."
date        : 2026-07-03 16:00:00 +0900
updated     : 2026-09-05 21:16:00 +0900
categories  : [keyboard, "키맵·펌웨어"]
tags        : [keyboard, qmk, zmk, via, vial, firmware]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/keyboard/2026-07-03-keyboard-roadmap/) · [키맵 용어집](/posts/keyboard/2026-07-03-keymap-terms-glossary/) · [ZMK 키매핑 가이드](/posts/keyboard/2026-07-03-zmk-keymap-editor-build-flash/)

커스텀 키보드에 발을 들이면 **QMK, ZMK, VIA, VIAL** 같은 이름이 한꺼번에 쏟아진다. 처음엔 다 비슷해 보이는데, **두 층으로 나누면** 깔끔하게 정리된다.

- **펌웨어 층** — 키보드 안에서 도는 프로그램. `QMK`, `ZMK`.
- **설정 도구 층** — 그 펌웨어의 키맵을 바꾸는 도구. `VIA`, `VIAL`, `ZMK Studio`.

즉 QMK/ZMK와 VIA/VIAL은 경쟁 관계가 아니다. **VIA·VIAL은 QMK 위에 얹는 GUI**고, ZMK에는 그 자리에 ZMK Studio가 있다. 이 글은 그 지형도를 그린다.

## 펌웨어 층 — QMK vs ZMK

| | QMK | ZMK |
|---|---|---|
| 태생 | 오래된 표준(유선 중심) | 무선(BLE) 우선으로 설계 |
| 기반 | C, 컴파일타임 | Zephyr RTOS, devicetree |
| 키맵 정의 | `keymap.c` (C 배열) | `.keymap` (devicetree) |
| 라이선스 | GPL | MIT |
| 하드웨어 | AVR + ARM 계열 | nRF52·RP2040 등 32bit MCU 중심 |
| 강점 | 방대한 기능과 성숙한 생태계 | 무선·저전력·split 키보드 |
| 무선 | 보드/구성에 따라 별도 구현 | BLE를 핵심 사용 사례로 설계 |

한 줄로 가르면 이렇다.

- **유선이고 기능을 최대로 쓰고 싶다** → QMK. 오래된 만큼 지원 보드·자료가 많다.
- **무선·split·저전력이 중요하다** → ZMK. 무선 split 키보드에서 특히 강하다.

레이어·매크로·combo·tap-hold 계열 같은 타이핑 기능은 둘 다 충분히 강력하다. 갈리는 건 주로 하드웨어·무선 구조·설정 방식이다.

## 설정 도구 층 — 컴파일 없이 키맵 바꾸기

펌웨어를 직접 고쳐 빌드하는 건 진입장벽이 있다. 키 하나 바꾸자고 매번 컴파일하고 플래싱하긴 번거롭다. 그래서 **GUI로 실시간 리맵**하는 도구가 있다.

| | VIA | VIAL | ZMK Studio |
|---|---|---|---|
| 대상 | VIA 지원 QMK 펌웨어 | Vial-QMK | ZMK |
| 역할 | GUI 리맵 | GUI 리맵 + 고급 기능 | ZMK 런타임 키맵 편집 |
| 키보드 인식 | 키보드 정의/지원 필요 | 정의를 펌웨어에 포함 | Studio 지원 펌웨어 필요 |
| 특징 | 완제품 지원이 넓음 | combo·tap dance 등 고급 편집에 강함 | ZMK 생태계의 대응 도구 |

- **VIA**: QMK 펌웨어에 VIA 지원을 넣으면 앱에서 키를 실시간 리맵할 수 있다. 완제품 상당수가 기본 지원한다.
- **VIAL**: Vial-QMK 기반으로 더 많은 고급 기능을 GUI에서 다룰 수 있고 자작 보드에 특히 편하다.
- **ZMK Studio**: ZMK 쪽에서 런타임 키맵 편집을 담당한다. 직접 `.keymap`을 수정하지 않고도 지원 범위 안에서 키를 바꿀 수 있다.

## 그래서 뭘 고르나

- **무선 split 자작** → ZMK. 간단한 수정은 ZMK Studio, 세밀한 설계는 `.keymap` 직접 편집([ZMK 키매핑 가이드](/posts/keyboard/2026-07-03-zmk-keymap-editor-build-flash/)).
- **유선인데 GUI로 편하게** → QMK + VIA/VIAL.
- **완제품이 VIA를 지원** → 기본 리맵·레이어·매크로 목적이면 VIA부터.
- **기능을 코드로 직접 제어** → QMK를 직접 빌드([QMK로 키맵 짜기](/posts/keyboard/2026-07-03-qmk-keymap-build/)).

## 정리

- QMK/ZMK는 **펌웨어**, VIA/VIAL/ZMK Studio는 그 위의 **설정 도구**다. 경쟁이 아니라 층이 다르다.
- **QMK = 성숙한 유선 중심 생태계**, **ZMK = 무선·split·저전력에 강한 생태계**로 보면 출발점이 잡힌다.
- 컴파일이 번거로우면 QMK에서는 VIA/VIAL, ZMK에서는 ZMK Studio를 쓸 수 있다.
- 키맵 설계 원칙 자체는 도구보다 상위 개념이라 QMK와 ZMK 사이에서도 상당 부분 재사용된다.

## 참고

- [Introduction to ZMK — ZMK Firmware](https://zmk.dev/docs)
- [QMK Firmware Documentation](https://docs.qmk.fm/)
- [VIA](https://www.caniusevia.com/)
- [Vial](https://get.vial.today/)
- [ZMK Studio](https://zmk.dev/docs/features/studio)

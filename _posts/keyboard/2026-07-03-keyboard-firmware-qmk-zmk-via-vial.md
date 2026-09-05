---
title       : "키보드 펌웨어 지형도 — QMK·ZMK와 그 위의 VIA·VIAL"
description : "커스텀 키보드에 발 들이면 쏟아지는 QMK·ZMK·VIA·VIAL을 '펌웨어 층'과 '설정 도구 층' 두 갈래로 나눠 정리합니다. 유선이냐 무선이냐, 컴파일하느냐 GUI로 바꾸느냐로 선택이 갈립니다."
date        : 2026-07-03 16:00:00 +0900
updated     : 2026-07-03 16:00:00 +0900
categories  : [etc, "keyboard"]
tags        : [keyboard, qmk, zmk, via, vial, firmware]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/etc/2026-07-03-keyboard-roadmap/) · [키맵 용어집](/posts/etc/2026-07-03-keymap-terms-glossary/) · [ZMK 키매핑 가이드](/posts/etc/2026-07-03-zmk-keymap-editor-build-flash/)

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
| 라이선스 | GPL | MIT (독점 BLE 드라이버 얹기 쉬움) |
| 하드웨어 | AVR(8bit) + ARM | nRF52840·RP2040 등 32bit |
| 강점 | 방대한 기능(OLED·오디오·RGB), 성숙한 생태계 | 무선·저전력·split 키보드 |
| 무선 | 실험적, 배터리 효율 약함 | 처음부터 BLE 최적화 |

한 줄로 가르면 이렇다.

- **유선이고 기능을 최대로 쓰고 싶다** → QMK. 오래된 만큼 지원 보드·자료가 압도적이다.
- **무선·split·저전력이 중요하다** → ZMK. 두 쪽이 BLE로 통신하는 무선 split은 사실상 ZMK가 표준이다.

타이핑 관련 기능(레이어·매크로·tap dance·combo 등)은 **둘이 사실상 대등**하다. 갈리는 건 주로 유선/무선과 하드웨어다.

## 설정 도구 층 — 컴파일 없이 키맵 바꾸기

펌웨어를 직접 고쳐 빌드하는 건 진입장벽이 있다. 키 하나 바꾸자고 매번 컴파일하고 플래싱하긴 번거롭다. 그래서 **GUI로 실시간 리맵**하는 도구가 있다.

| | VIA | VIAL | ZMK Studio |
|---|---|---|---|
| 대상 펌웨어 | QMK | QMK 포크(vial-qmk) | ZMK |
| 오픈소스 | 제한적 | 완전 오픈소스 | 오픈소스 |
| 키보드 인식 | 정의 등록 필요(v3부터 커스텀 로드 가능) | 정의를 펌웨어에 내장, 자동 인식 | ZMK 펌웨어에 Studio 지원 빌드 |
| 고급 기능 | 기본 리맵·레이어·매크로 중심 | tap dance·combo·매크로까지 GUI | MVP 단계라 편집 범위 제한 |
| 성숙도 | 안정적 | 안정적 | 2024.11 MVP GA |

- **VIA**: QMK에 VIA 지원을 켜서 빌드하면, VIA 앱으로 키를 실시간 리맵하고 그 설정이 키보드에 저장된다. 완제품(키크론 등) 상당수가 기본 지원한다. 대신 tap dance·combo 같은 고급 동작은 GUI에서 약하고, 기본 레이어 수도 넉넉하지 않다.
- **VIAL**: VIA의 오픈소스 포크. 키보드 정의를 펌웨어에 내장해 **중앙 등록 없이 자동 인식**되고, **오프라인**에서 동작하며, tap dance·combo·매크로까지 GUI로 만진다. DIY·자작 보드에 특히 강하다.
- **ZMK Studio**: VIA/VIAL은 QMK 전용이다. ZMK 진영에서 대응하는 게 ZMK Studio로, 2024년 11월 MVP가 GA됐다. 브라우저와 데스크톱 앱에서 플래싱 없이 키맵을 바꾼다. 아직 MVP라 손댈 수 있는 범위는 제한적이다.

## 그래서 뭘 고르나

- **무선 split 자작** → ZMK. 간단한 수정은 ZMK Studio, 세밀한 설계는 `.keymap` 직접 편집([ZMK 키매핑 가이드](/posts/etc/2026-07-03-zmk-keymap-editor-build-flash/)).
- **유선인데 GUI로 편하게** → QMK + VIAL. 고급 기능까지 컴파일 없이.
- **완제품이 VIA를 지원** → 그냥 VIA로 충분. 기본 리맵·레이어·매크로면 대부분 해결된다.
- **기능을 극한까지 코드로 제어** → QMK를 직접 빌드([QMK로 키맵 짜기](/posts/etc/2026-07-03-qmk-keymap-build/)).

## 정리

- QMK/ZMK는 **펌웨어**, VIA/VIAL/ZMK Studio는 그 위의 **설정 도구**다. 경쟁이 아니라 층이 다르다.
- **QMK = 유선·기능·성숙**, **ZMK = 무선·split·저전력**. 타이핑 기능 자체는 대등하다.
- 컴파일이 번거로우면 **QMK엔 VIA/VIAL**, **ZMK엔 ZMK Studio**로 GUI 리맵.
- VIA는 완제품·기본 용도, VIAL은 오픈소스·고급 기능, ZMK Studio는 아직 MVP.

## 참고

- [Introduction to ZMK — ZMK Firmware](https://zmk.dev/docs)
- [QMK vs. ZMK: Wireless Firmware Comparison — KeebsForAll](https://keebsforall.com/blogs/mechanical-keyboards-101/qmk-vs-zmk-wireless-firmware-comparison)
- [A Detailed Overview of QMK, VIA, and Vial — Max Zsol](https://maxzsol.com/a-detailed-overview-of-qmk-via-and-vial-visual-configurators-for-mechanical-keyboards/)
- [ZMK Studio MVP General Availability](https://zmk.dev/blog/2024/11/11/zmk-studio-mvp-ga)
</content>
</invoke>

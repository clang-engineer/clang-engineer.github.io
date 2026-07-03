---
title       : "VIA·VIAL 실전 — 컴파일 없이 GUI로 키맵 바꾸기"
description : "VIA와 VIAL로 펌웨어 재빌드 없이 실시간으로 키를 리맵하는 법 — 지원 조건, 앱 접속, 키 리맵·레이어·매크로, 그리고 VIA와 VIAL 중 무엇을 쓸지 정리합니다."
date        : 2026-07-03 17:20:00 +0900
updated     : 2026-07-03 17:20:00 +0900
categories  : [etc, "keyboard"]
tags        : [keyboard, via, vial, qmk, guide]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/etc/2026-07-03-keyboard-roadmap/) · [키보드 펌웨어 지형도](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) · [QMK로 키맵 짜기](/posts/etc/2026-07-03-qmk-keymap-build/)

QMK 키맵을 [매번 컴파일](/posts/etc/2026-07-03-qmk-keymap-build/)하는 건 번거롭다. **VIA·VIAL**은 그 부담을 없앤다 — GUI에서 키를 클릭해 바꾸면 **즉시 반영되고 키보드에 저장**된다. 재빌드도, 플래싱도 없다. 이 글은 그 실전 흐름이다.

## 전제 — 펌웨어가 VIA/VIAL을 지원해야 한다

VIA·VIAL은 아무 키보드에나 되는 게 아니다. **그 기능이 켜진 펌웨어**여야 한다.

- **VIA**: QMK에 VIA 지원을 켜서 빌드한 펌웨어. 완제품(키크론 등) **상당수가 기본 지원**한다.
- **VIAL**: `vial-qmk`로 빌드한 펌웨어. 키보드 정의가 펌웨어에 내장돼 **자동 인식**된다.

즉 VIA/VIAL은 [QMK 위에 얹는 GUI](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/)다. (ZMK는 대신 ZMK Studio를 쓴다 — 아래 참고.)

## 앱 접속

둘 다 브라우저에서 **WebHID**로 키보드에 직접 붙는다. Chrome·Edge에서 동작한다(데스크톱 앱도 있다).

- **VIA**: [usevia.app](https://usevia.app) 접속 → 키보드 연결 허용.
- **VIAL**: [get.vial.today](https://get.vial.today) 데스크톱 앱, 또는 웹 버전.

연결하면 현재 키맵이 화면에 그려진다.

## 키 리맵하기

1. 화면에서 **바꿀 키를 클릭**한다.
2. 아래 키코드 목록에서 **새 키를 클릭**한다.
3. 끝. 변경은 **즉시 반영**되고 키보드에 저장돼, 뽑았다 꽂아도 유지된다.

레이어 탭에서 레이어별로 같은 작업을 반복하면 된다.

## 레이어·매크로·라이팅

- **레이어**: 레이어 번호를 오가며 각 층을 따로 매핑. `MO`·`LT` 같은 레이어 키도 GUI에서 지정.
- **매크로**: 여러 키 입력 시퀀스를 녹화해 한 키에 할당.
- **라이팅**: RGB 밝기·효과 조절(지원 보드 한정).

## VIA vs VIAL — 뭘 쓰나

| | VIA | VIAL |
|---|---|---|
| 성격 | 완제품 친화, 안정적 | 오픈소스, 오프라인 |
| 인식 | 정의 등록 필요(v3부터 커스텀 로드) | 펌웨어 내장, 자동 인식 |
| 고급 기능 | 기본 리맵·레이어·매크로 | tap dance·combo·매크로·QMK settings까지 |
| 잘 맞는 곳 | VIA 지원 완제품 | 자작·DIY, 고급 커스터마이징 |

- **완제품이 VIA를 지원하고, 기본 리맵·레이어·매크로면 충분** → VIA. 별도 준비 없이 바로 쓴다.
- **자작 보드거나 tap dance·combo까지 GUI로 만지고 싶다** → VIAL. 오프라인에서 고급 기능까지 커버한다.

## ZMK는? — ZMK Studio

VIA·VIAL은 **QMK 전용**이다. ZMK 키보드라면 대응 도구는 **ZMK Studio**다(2024.11 MVP GA). 브라우저·데스크톱에서 플래싱 없이 키맵을 바꾸지만, 아직 MVP라 편집 범위는 제한적이다. ZMK 쪽 전체 흐름은 [ZMK 키매핑 가이드](/posts/etc/2026-07-03-zmk-keymap-editor-build-flash/)를 보면 된다.

## 정리

- VIA·VIAL은 **QMK 위의 GUI**로, 컴파일 없이 실시간 리맵하고 키보드에 저장한다.
- 쓰려면 **펌웨어가 VIA/VIAL 지원**이어야 한다. 완제품 다수는 VIA 기본 지원.
- **VIA = 완제품·기본 용도**, **VIAL = 오픈소스·오프라인·고급 기능(tap dance·combo)**.
- ZMK에는 VIA/VIAL 대신 **ZMK Studio**가 대응한다.

## 참고

- [VIA](https://caniusevia.com/)
- [Vial](https://get.vial.today/)
- [A Detailed Overview of QMK, VIA, and Vial — Max Zsol](https://maxzsol.com/a-detailed-overview-of-qmk-via-and-vial-visual-configurators-for-mechanical-keyboards/)
</content>

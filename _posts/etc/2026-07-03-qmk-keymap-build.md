---
title       : "QMK로 키맵 짜기 — keymap.c와 빌드 환경"
description : "QMK 펌웨어로 커스텀 키맵을 만드는 실전 흐름 — QMK CLI 개발 환경, keymap.c의 레이어 배열, MO·LT·MT 같은 키코드, 그리고 컴파일과 플래싱까지 정리합니다."
date        : 2026-07-03 17:00:00 +0900
updated     : 2026-07-03 17:00:00 +0900
categories  : [etc, "keyboard"]
tags        : [keyboard, qmk, keymap, guide]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/etc/2026-07-03-keyboard-roadmap/) · [키보드 펌웨어 지형도](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) · [VIA·VIAL 실전](/posts/etc/2026-07-03-via-vial-gui-remap/)

[지형도](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/)에서 봤듯 **QMK는 유선·기능 중심의 성숙한 펌웨어**다. ZMK가 devicetree로 키맵을 정의한다면, QMK는 **C 소스(`keymap.c`)를 컴파일**한다. 이 글은 QMK로 키맵을 직접 짜서 빌드·플래싱하는 실전 흐름이다.

## QMK를 언제 고르나

- 유선이고, OLED·RGB·오디오·tap dance 같은 **기능을 폭넓게** 쓰고 싶을 때.
- 지원 보드·키맵 예제가 압도적으로 많은 **성숙한 생태계**가 필요할 때.

무선 split이 목적이면 QMK 대신 ZMK가 맞다. 판단 기준은 [펌웨어 지형도](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/)에 정리해 뒀다.

## 개발 환경 — qmk_firmware + QMK CLI

QMK는 로컬에서 컴파일한다. 공식 CLI가 저장소 클론부터 툴체인 설치까지 해 준다.

```bash
# QMK CLI 설치(macOS 예: Homebrew)
brew install qmk/qmk/qmk

# 저장소 클론 + 툴체인 준비
qmk setup
```

`qmk setup`이 `qmk_firmware`를 받아오고 컴파일에 필요한 툴체인을 깔아 준다.

## 키맵은 keymap.c — 레이어 배열

키맵은 `keyboards/<보드>/keymaps/<이름>/keymap.c`에 있다. 핵심은 **레이어별로 키코드를 나열한 2차원 배열**이다.

```c
enum layers { BASE, NUM, SYM };

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    [BASE] = LAYOUT(
        KC_Q, KC_W, KC_E, KC_R, /* ... */
        MO(NUM) /* 홀드하면 NUM 레이어 */
    ),
    [NUM] = LAYOUT(
        KC_1, KC_2, KC_3, KC_4, /* ... */
    ),
};
```

`LAYOUT(...)`은 보드마다 정의된 매크로로, 물리 키 위치 순서에 맞춰 키코드를 받는다. `KC_A` 같은 게 키코드다.

## 자주 쓰는 키코드 — MO·LT·MT

40% 키맵의 뼈대가 되는 레이어·탭홀드 키코드는 이렇게 쓴다. (개념은 [키맵 용어집](/posts/etc/2026-07-03-keymap-terms-glossary/) 참고)

```c
MO(NUM)              // 홀드하는 동안 NUM 레이어(momentary)
TG(SYM)              // 눌렀다 떼면 SYM 레이어 토글
LT(NUM, KC_SPC)      // 탭 = Space, 홀드 = NUM 레이어(layer-tap)
MT(MOD_LCTL, KC_A)   // 탭 = A, 홀드 = 왼쪽 Ctrl(mod-tap)
```

더 복잡한 동작(매크로, 커스텀 키)은 `process_record_user()`에서 직접 처리하지만, 시작 단계에선 위 네 개로 대부분 커버된다.

## 빌드 & 플래싱

```bash
# 컴파일(보드/키맵 지정)
qmk compile -kb <보드> -km <키맵>

# 부트로더 진입 후 플래싱
qmk flash -kb <보드> -km <키맵>
```

`qmk flash`는 컴파일 후 보드가 **부트로더로 진입하길 기다렸다가** 펌웨어를 올린다. 부트로더 진입법(리셋 버튼 등)은 보드마다 다르니 문서를 확인한다.

## 매번 컴파일하기 싫으면 — VIA/VIAL

키 하나 바꿀 때마다 컴파일·플래싱하는 게 번거로우면, **VIA 지원을 켜서 빌드**한 뒤 GUI로 실시간 리맵하는 길이 있다. 그 실전은 [VIA·VIAL 실전](/posts/etc/2026-07-03-via-vial-gui-remap/)에서 다룬다.

## 정리

- QMK 키맵은 **`keymap.c`의 레이어 배열**을 컴파일하는 방식이다.
- 환경은 **`qmk setup`** 한 방으로. 편집은 `keyboards/.../keymap.c`.
- 레이어·탭홀드는 **`MO`·`TG`·`LT`·`MT`** 네 키코드가 기본기.
- 빌드·플래싱은 **`qmk compile` / `qmk flash`**. 컴파일이 번거로우면 VIA/VIAL로.

## 참고

- [QMK Firmware Docs](https://docs.qmk.fm/)
- [Keycodes — QMK Firmware](https://docs.qmk.fm/keycodes)
- [Keymap Overview — QMK Firmware](https://docs.qmk.fm/keymap)
</content>

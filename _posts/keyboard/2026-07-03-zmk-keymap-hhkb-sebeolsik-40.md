---
title       : "ZMK 키맵 설계기 — HHKB + 40% + 세벌식 390, 그리고 실수로 안 눌리게 만들기"
description : "40% 키보드 키맵을 세벌식 390과 HHKB 손버릇에 맞춰 설계하고, 부트로더·화면 슬립처럼 위험한 키를 hold-tap으로 실수 방지하는 방법을 정리합니다."
date        : 2026-07-03 12:00:00 +0900
updated     : 2026-09-05 21:14:00 +0900
categories  : [keyboard, "ZMK"]
tags        : [zmk, keyboard, keymap, guide]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/keyboard/2026-07-03-keyboard-roadmap/) · [키맵 용어집](/posts/keyboard/2026-07-03-keymap-terms-glossary/) · [ZMK 키매핑 가이드](/posts/keyboard/2026-07-03-zmk-keymap-editor-build-flash/) · [HHKB 입문](/posts/keyboard/2026-07-03-hhkb-intro/)

ZMK로 40% 키보드 키맵을 짜다 보면 결국 "왜 이 키를 여기에 뒀는가"가 전부다. 물리 키가 적으니 레이어와 배치 하나하나가 손버릇·입력기·용도에 맞물린다. 이 글은 **HHKB 손버릇 + 40% 물리 배열 + 세벌식 390 입력**이라는 세 제약을 키맵에 녹인 과정과, 부트로더처럼 눌리면 곤란한 키를 **hold-tap으로 실수 방지**하는 기법을 정리한다.

예시는 ZMK 기준이지만 레이어 설계와 hold-tap 아이디어는 다른 펌웨어에도 옮겨갈 수 있다.

## 설계 제약 세 가지

- **HHKB**: `Ctrl`을 Caps 자리에 두고 방향키는 Fn 레이어로 쓰는 손버릇.
- **40%**: 숫자·기호·방향키를 물리 키가 아니라 레이어로 분리해야 한다.
- **세벌식 390**: 숫자열을 한글 입력에 사용하므로 숫자를 다시 꺼낼 별도 경로가 필요하다.

이 세 제약이 맞물리면서 키맵의 구조가 자연스럽게 결정됐다.

## 세벌식 390이 숫자 레이어를 강제한다

세벌식 390은 숫자열을 한글 자모 입력에 사용한다. 따라서 40% 키보드에서는 숫자 전용 레이어가 사실상 필수다.

```text
number 레이어
Tab   1    2    3    4    5      6    7    8    9    0
Caps  ·    ·    ·    ·    ·      ·    4    5    6    ·
▽     ·    ·    ·    ·    ·      0    1    2    3    ▽
```

오른손에는 넘패드처럼 숫자를 겹쳐 뒀다. 세벌식 390의 숫자 입력 감각을 레이어 위에서 그대로 재현한 것이다.

### 접근키를 두 곳에 둔다

숫자를 자주 꺼내야 하므로 number 레이어 진입키도 접근성이 좋아야 한다.

- 왼쪽 Space를 layer-tap으로: 탭은 Space, 홀드는 number 레이어.
- HHKB의 Fn 자리에는 momentary 레이어 전환키.

```dts
&lt 1 SPACE
```

```text
세벌식이 숫자열을 사용
→ 숫자 레이어 필요
→ 자주 쓰므로 빠른 진입키 필요
```

하나의 제약이 다음 설계 선택을 연쇄적으로 만든 셈이다.

## 기호는 기존 손버릇을 따라 배치한다

특수문자 레이어에서는 `-`, `=`, `[`, `]`, `;`, `'`, `,`, `.`, `/`처럼 원래 오른손으로 치던 기호를 오른쪽에 몰았다.

```text
special 레이어
▽    ·    ·    ·    ·    ·      ·    ·    ·    ·    [    ]
▽    ·    ·    ·    ·    ·      ·    ·    ·    ;    '
▽    ·    ·    ·    ·    ·      ·    ,    .    /
```

작은 키보드일수록 새 배열을 처음부터 외우기보다 **손이 이미 아는 위치 관계를 레이어 위에 재현하는 것**이 학습 비용을 줄인다.

## 위험한 키는 hold-tap으로 감싼다

화면 슬립이나 부트로더 진입처럼 실수로 눌리면 곤란한 키를 단순 바인딩하면 레이어를 쓰다가 스치기만 해도 실행될 수 있다.

그래서 짧게 누르면 아무 일도 없고 일정 시간 이상 누를 때만 실행하도록 behavior를 한 겹 감쌌다.

```dts
behaviors {
    screen_sleep_hold: screen_sleep_hold {
        compatible = "zmk,behavior-hold-tap";
        #binding-cells = <2>;
        flavor = "tap-preferred";
        tapping-term-ms = <300>;
        bindings = <&screen_sleep>, <&none>;
    };

    bootloader_hold: bootloader_hold {
        compatible = "zmk,behavior-hold-tap";
        #binding-cells = <2>;
        flavor = "tap-preferred";
        tapping-term-ms = <300>;
        bindings = <&bootloader>, <&none>;
    };
};
```

키맵에서는 다음처럼 쓴다.

```dts
&screen_sleep_hold 0 0
&bootloader_hold 0 0
```

동작은 단순하다.

```text
짧게 탭
→ &none
→ 무시

300ms 이상 홀드
→ 실제 동작
```

`tapping-term-ms`는 사용 습관에 맞춰 조정할 수 있다.

### 왜 `0 0`이 붙나

hold-tap behavior는 hold와 tap 쪽에 전달할 두 개의 파라미터를 받는다. 그런데 `&bootloader`나 별도 매크로처럼 파라미터를 받지 않는 behavior를 감쌀 때는 전달할 값이 없으므로 더미 값 `0 0`을 둔다.

## 드문 키는 접근성보다 니모닉

시스템 키처럼 자주 쓰지 않는 동작은 손이 가장 가까운 위치보다 **기억하기 쉬운 위치**가 낫다.

- `Z` → 화면 슬립: zzz
- `B` → Bootloader

hold-tap 가드가 있으므로 실수 입력 위험도 낮다.

## 함정 — 레이어 순서가 곧 인덱스다

ZMK에서 레이어의 나열 순서를 바꾸면 인덱스도 달라진다. 따라서 레이어 블록만 옮기고 `&mo`, `&lt`, `&to` 같은 참조 번호를 그대로 두면 엉뚱한 레이어를 가리킨다.

```dts
// arrow가 index 4에서 2로 이동했다면
bindings = <&mo 2>;
```

즉:

```text
레이어 블록 재배치
+
참조 번호 remap
=
한 작업
```

가독성을 위해 순서를 바꾸는 실익이 크지 않다면 그대로 두는 편이 안전하다.

## 정리

40% 키맵 설계에서 남은 원칙은 다음과 같다.

- **입력기 특성이 레이어를 강제할 수 있다.** 세벌식 390 때문에 숫자 레이어가 필수였다.
- **손이 이미 아는 위치를 레이어 위에서 재현한다.** 새 키맵의 학습 비용이 줄어든다.
- **위험한 동작은 hold-tap으로 보호한다.** 짧게는 무시하고 의도적인 홀드에서만 실행한다.
- **드문 동작은 접근성보다 니모닉이 중요하다.**
- **레이어 순서와 인덱스는 함께 관리한다.**

키맵을 실제 보드에 올리는 포크 → 편집 → 빌드 → 플래싱 과정은 [ZMK 키매핑 가이드](/posts/keyboard/2026-07-03-zmk-keymap-editor-build-flash/)에서 이어진다.

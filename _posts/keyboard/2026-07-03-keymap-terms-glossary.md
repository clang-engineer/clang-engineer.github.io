---
title       : "키맵 용어집 — combo·hold-tap·momentary, 레이어 키매핑 용어 정리"
description : "커스텀 키보드 키맵을 짤 때 쏟아지는 용어 — layer, momentary/toggle, layer-tap, mod-tap, hold-tap, tap-dance, combo, one-shot, macro — 를 QMK·ZMK 표기와 함께 한 번에 정리합니다."
date        : 2026-07-03 16:20:00 +0900
updated     : 2026-07-03 16:20:00 +0900
categories  : [etc, "keyboard"]
tags        : [keyboard, keymap, qmk, zmk, glossary]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/etc/2026-07-03-keyboard-roadmap/) · [키보드 펌웨어 지형도](/posts/etc/2026-07-03-keyboard-firmware-qmk-zmk-via-vial/) · [ZMK 키맵 설계기](/posts/etc/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)

40% 키보드 키맵 문서를 처음 보면 `momentary`, `layer-tap`, `hold-tap`, `combo` 같은 용어가 쏟아진다. 겁먹을 것 없다. 대부분 **"물리 키가 부족하니 한 키에 여러 역할을 태우는"** 방법들이고, 뿌리는 몇 개 안 된다. QMK와 ZMK 표기를 나란히 정리했다. 표기는 펌웨어마다 조금 달라도 **개념은 같다.**

## 레이어(Layer) — 모든 것의 출발

**레이어**는 키보드에 겹쳐 놓은 여러 층이다. 특정 키로 다른 층을 켜면, 같은 물리 키가 다른 글자·기능을 낸다. 40% 이하에선 숫자·기호·방향키를 물리 키가 아니라 레이어로 분리하므로 사실상 필수 개념이다.

레이어를 **켜는 방식**부터 갈린다.

| 용어 | 동작 | QMK | ZMK |
|---|---|---|---|
| momentary | 누르는 동안만 활성, 떼면 원복 | `MO(n)` | `&mo n` |
| toggle | 눌렀다 떼면 켜진 채 유지, 다시 누르면 끔 | `TG(n)` | `&tog n` |
| to | 지정 레이어로 전환(나머지 끔) | `TO(n)` | `&to n` |

HHKB의 `Fn`처럼 "누르고 있는 동안만" 쓰는 게 momentary다. 가장 흔하다.

## 한 키에 두 역할 — tap이냐 hold냐

물리 키가 부족할 때 핵심 무기. **짧게 톡 치면 A, 꾹 누르면 B.** 이 큰 틀을 **hold-tap**이라 부르고, 용도에 따라 이름이 갈린다.

| 용어 | 탭 / 홀드 | QMK | ZMK |
|---|---|---|---|
| hold-tap | (일반형) 탭 = 동작A, 홀드 = 동작B | 설정으로 구성 | `&ht`(직접 정의) |
| layer-tap | 탭 = 글자, 홀드 = 레이어 | `LT(n, kc)` | `&lt n kc` |
| mod-tap | 탭 = 글자, 홀드 = 모디파이어 | `MT(mod, kc)` | `&mt mod kc` |

예를 들어 **스페이스를 layer-tap**으로 두면, 탭하면 Space·홀드하면 숫자 레이어가 된다. 손을 떼지 않고 레이어에 진입할 수 있어 40% 키맵의 단골 기법이다.

탭과 홀드를 가르는 시간 문턱을 **tapping-term**(보통 `tapping-term-ms`)이라 한다. 짧으면 홀드가 쉽게 걸리고, 길면 확실하지만 굼뜨다.

### home row mods

mod-tap의 대표 응용. 홈 포지션(`ASDF` / `JKL;`)에 모디파이어를 mod-tap으로 얹어, **손을 홈에서 안 움직이고** Ctrl·Shift·Alt·GUI를 누른다. 강력하지만 tapping-term 튜닝이 까다로워 호불호가 갈린다.

## 같은 키를 연타 — tap-dance

**한 번·두 번·세 번** 탭에 각각 다른 동작을 매핑한다. 예: 1탭 `(`, 2탭 `)`. 키 하나로 여러 기호를 낼 때 쓴다. (QMK `TD()`, ZMK tap-dance behavior)

## 여러 키를 동시에 — combo

두 개 이상의 키를 **동시에** 누르면 제3의 동작이 나온다. 예: `J`+`K` 동시 = `Esc`. 물리 키를 안 늘리고 조합으로 새 키를 만드는 방법이라, 작은 키보드에서 특히 유용하다. QMK·ZMK 모두 지원한다.

## 한 번만 붙는 모디파이어 — one-shot / sticky

모디파이어를 누르고 **떼도 다음 한 키에만** 적용된다. Shift를 누른 채 유지하지 않아도 대문자 한 글자를 칠 수 있다. 새끼손가락 부담을 줄인다. (QMK `OSM(mod)` / one-shot, ZMK `&sk` sticky-key, 레이어판은 `&sl`)

## 연속 입력 — macro

키 하나에 **여러 키 입력 시퀀스**를 담는다. 이메일 주소 자동 입력, `Ctrl+Shift+Power`(macOS 화면 슬립) 같은 조합을 한 방에. (QMK macros, ZMK `&macro`/behavior)

## 그 밖에 자주 보는 것

- **leader key**: 리더 키를 누른 뒤 이어지는 키 시퀀스로 명령을 실행(vim의 리더와 비슷).
- **caps word**: 한 단어만 대문자로 치고, 스페이스를 만나면 자동으로 풀린다. `CONSTANT_NAME` 같은 걸 칠 때 편하다.

## 정리

| 개념 | 한 줄 요약 |
|---|---|
| 레이어 | 겹쳐 놓은 키 층. 40%의 기본 |
| momentary / toggle / to | 레이어를 켜는 세 방식(누른 동안 / 토글 / 전환) |
| hold-tap | 탭·홀드에 다른 동작. layer-tap·mod-tap의 부모 |
| tap-dance | 같은 키 연타 횟수로 분기 |
| combo | 여러 키 동시 = 새 동작 |
| one-shot | 다음 한 키에만 붙는 모디파이어 |
| macro | 키 하나 = 입력 시퀀스 |

용어가 손에 잡히면 [ZMK 키맵 설계기](/posts/etc/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)의 hold-tap·레이어 설계가 훨씬 쉽게 읽힌다.

## 참고

- [Keymaps & Behaviors — ZMK Firmware](https://zmk.dev/docs/keymaps)
- [Keycodes — QMK Firmware](https://docs.qmk.fm/keycodes)
</content>

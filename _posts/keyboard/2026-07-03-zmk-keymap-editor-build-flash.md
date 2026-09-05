---
title       : "ZMK 키매핑 가이드 — 포크부터 플래싱까지, 내 키맵을 보드에 올리기"
description : "zmk-config를 포크하고 키맵을 편집한 뒤 GitHub Actions로 펌웨어를 빌드해 키보드에 플래싱하는 ZMK 키매핑의 전체 흐름을 정리합니다."
date        : 2026-07-03 16:40:00 +0900
updated     : 2026-09-05 21:14:00 +0900
categories  : [keyboard, "ZMK"]
tags        : [keyboard, zmk, keymap, guide]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/keyboard/2026-07-03-keyboard-roadmap/) · [키맵 용어집](/posts/keyboard/2026-07-03-keymap-terms-glossary/) · [ZMK 키맵 설계기](/posts/keyboard/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)

[ZMK 키맵 설계기](/posts/keyboard/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)가 좋은 키맵을 **어떻게 설계할지** 다룬다면, 이 글은 그 앞 단계인 **키맵을 수정해서 실제 보드에 올리는 과정**을 다룬다.

ZMK 키보드는 보드 제작자나 프로젝트가 `zmk-config` 형태의 저장소를 제공하는 경우가 많다. 실제 구조는 프로젝트마다 다르지만 전체 작업은 다음 네 단계로 볼 수 있다.

```text
포크·복제
  ↓
키맵 편집
  ↓
펌웨어 빌드
  ↓
보드 플래싱
```

## 1. zmk-config를 내 작업 공간으로 가져온다

기존 설정 저장소를 Fork하거나 별도 저장소로 복제해 내 키맵 변경을 관리한다.

이렇게 하면:

- 키맵 변경이 Git 히스토리로 남고
- 문제가 생겼을 때 이전 상태로 돌아갈 수 있으며
- GitHub Actions가 구성되어 있다면 커밋마다 펌웨어를 자동 빌드할 수 있다.

`build.yaml`, 보드·shield 정의 등은 실제 하드웨어와 연결되어 있으므로 처음에는 제공된 기본값을 유지하는 편이 안전하다.

## 2. 키맵을 편집한다

### GUI 키맵 에디터

[nickcoutsos keymap-editor](https://nickcoutsos.github.io/keymap-editor/) 같은 도구를 사용하면 `.keymap`의 devicetree 문법을 모두 알지 않아도 시각적으로 키 배치를 수정할 수 있다.

단순 키 변경과 기본 레이어 작업을 시작하기 좋다.

### `.keymap` 직접 편집

hold-tap, macro, custom behavior처럼 설계가 복잡해지면 `.keymap`을 직접 편집하는 편이 명확하다.

```text
단순 변경
→ GUI editor

행동 정의·복잡한 레이어 설계
→ .keymap 직접 편집
```

실제 40% 보드의 레이어와 hold-tap 설계는 [ZMK 키맵 설계기](/posts/keyboard/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)에서 이어진다.

## 3. 펌웨어를 빌드한다

저장소에 GitHub Actions 빌드가 구성되어 있다면 커밋 후 Actions에서 결과를 확인한다.

```text
commit / push
  ↓
GitHub Actions
  ↓
ZMK build
  ↓
firmware artifact
```

성공한 빌드의 artifact에서 보드에 맞는 펌웨어 파일을 받는다. UF2 부트로더를 사용하는 보드라면 `.uf2`가 생성될 수 있고, split 키보드는 좌우별 파일이 따로 나올 수 있다.

빌드 방식과 산출물 형식은 보드 구성에 따라 다르므로 저장소의 workflow와 하드웨어 문서를 기준으로 확인한다.

## 4. 보드에 플래싱한다

UF2 방식의 일반적인 흐름은 다음과 같다.

1. 보드를 부트로더 모드로 진입시킨다.
2. USB로 연결해 부트로더 드라이브가 나타나는지 확인한다.
3. 해당 보드용 `.uf2` 파일을 복사한다.
4. 재부팅 후 새 키맵을 검증한다.
5. split이면 각 half에 맞는 펌웨어를 각각 올린다.

부트로더 진입 방법은 보드마다 다르다. 리셋 버튼을 두 번 누르는 방식도 있고 별도 조합을 사용하는 경우도 있으므로 **보드 문서를 우선한다.**

## 흔한 함정

- `build.yaml`의 board/shield를 실제 하드웨어와 다르게 바꾸면 빌드가 실패하거나 잘못된 펌웨어가 만들어질 수 있다.
- split의 좌·우 산출물을 혼동하지 않는다.
- 플래싱 전에 현재 동작하는 설정 커밋을 남겨 두면 복구가 쉽다.
- ZMK Studio를 지원하는 구성이라면 단순 키 변경은 전체 빌드·플래싱 없이 처리할 수도 있다.

## 다음 — 키맵 설계

여기까지는 **키맵을 보드에 전달하는 파이프라인**이다.

```text
이 글
"어떻게 올리는가"
        ↓
ZMK 키맵 설계기
"무엇을 어떻게 배치할 것인가"
```

40% 키보드에서 세벌식 390과 HHKB 손버릇을 레이어로 옮긴 실제 설계는 [ZMK 키맵 설계기](/posts/keyboard/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)에서 다룬다.

## 참고

- [Introduction to ZMK — ZMK Firmware](https://zmk.dev/docs)
- [nickcoutsos keymap-editor](https://nickcoutsos.github.io/keymap-editor/)
- [ZMK Studio — ZMK Firmware](https://zmk.dev/docs/features/studio)

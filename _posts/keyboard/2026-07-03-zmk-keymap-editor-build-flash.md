---
title       : "ZMK 키매핑 가이드 — 포크부터 플래싱까지, 내 키맵을 보드에 올리기"
description : "판매자 zmk-config를 포크하고, 웹 키맵 에디터로 키를 배치하고, GitHub Actions로 펌웨어를 빌드해 키보드에 플래싱하는 ZMK 키매핑의 전체 흐름을 4단계로 정리합니다."
date        : 2026-07-03 16:40:00 +0900
updated     : 2026-07-03 16:40:00 +0900
categories  : [etc, "keyboard"]
tags        : [keyboard, zmk, keymap, guide]
pin         : false
hidden      : false
---

> 관련 시리즈: [키보드 로드맵](/posts/etc/2026-07-03-keyboard-roadmap/) · [키맵 용어집](/posts/etc/2026-07-03-keymap-terms-glossary/) · [ZMK 키맵 설계기](/posts/etc/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)

[ZMK 키맵 설계기](/posts/etc/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)가 "**좋은** 키맵을 어떻게 설계하나"라면, 이 글은 그 앞 단계 — "**일단** 키맵을 바꿔서 보드에 올리는 기본 절차"다. ZMK 보드를 사면 판매자가 대개 `zmk-config` 저장소를 함께 준다. 그걸 내 것으로 만들어 빌드·플래싱하는 흐름을 정리한다.

전체는 **네 단계**로 압축된다.

```text
① 포크  →  ② 키맵 편집  →  ③ 빌드(GitHub Actions)  →  ④ 플래싱
```

## ① zmk-config 포크

판매자 GitHub의 `zmk-config` 저장소를 **내 계정으로 Fork**한다. 이 저장소가 키맵(`.keymap`)과 빌드 설정(`build.yaml`)을 담고 있다.

포크하는 이유는 두 가지다.

- 내 키맵 변경이 **내 저장소 히스토리**로 쌓인다.
- 커밋할 때마다 **GitHub Actions가 자동으로 펌웨어를 빌드**한다(판매자 저장소가 그렇게 설정해 둔다).

## ② 키맵 편집 — 두 갈래

**(a) GUI로 — 웹 키맵 에디터 (초보 권장)**

[nickcoutsos 키맵 에디터](https://nickcoutsos.github.io/keymap-editor/)에 GitHub 접근 권한을 주면, 내 포크의 `.keymap`을 **시각적으로** 편집할 수 있다. 키를 클릭해 원하는 동작을 고르고 저장하면, 에디터가 알아서 `.keymap`을 고쳐 **커밋**한다. 일반 입력 키는 `&kp` 메뉴에서 검색하면 된다.

devicetree 문법을 몰라도 시작할 수 있는 게 장점이다.

**(b) 직접 — `.keymap` 편집**

`.keymap`(devicetree) 파일을 손으로 고친다. 레이어·behavior를 세밀하게 제어할 수 있고, hold-tap·매크로처럼 GUI로 표현하기 애매한 설계는 이쪽이 자유롭다. 이 갈래의 실제 설계 사례가 [ZMK 키맵 설계기](/posts/etc/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)다.

## ③ 빌드 — GitHub Actions가 알아서

커밋이 올라가면 저장소의 **Actions**가 자동으로 펌웨어를 컴파일한다. 내 PC에 빌드 환경을 깔 필요가 없다.

- 저장소 **Actions 탭**에서 워크플로우가 끝나길 기다린다.
- 성공하면 **Artifacts**에 펌웨어 파일(`zmk.uf2`)이 올라온다. 다운로드한다.
- **split 키보드**면 좌·우 각각의 `.uf2`가 나온다.

## ④ 플래싱 — 보드에 올리기

1. 키보드를 **부트로더 모드**로 진입시킨다. 진입 방법은 보드마다 다르다(리셋 버튼 두 번, 리셋+부트 조합 등) — **판매자 문서를 먼저 확인**한다.
2. USB로 연결하면 키보드가 **USB 저장장치처럼** 인식된다.
3. 다운로드한 `.uf2` 파일을 그 드라이브로 **드래그해 복사**한다. 복사가 끝나면 자동으로 리부트하며 새 펌웨어가 적용된다.
4. split이면 좌·우 각각 같은 절차를 반복한다(자기 쪽 `.uf2`를 올린다).

## 흔한 함정

- **`build.yaml`의 보드/실드 설정이 안 맞으면** 빌드가 실패한다. 판매자 기본값을 함부로 건드리지 않는다.
- **split 좌우 `.uf2`를 헷갈려** 반대쪽에 올리면 동작이 어긋난다.
- **부트로더 진입법은 보드마다 다르다.** 일반화하지 말고 판매자 문서를 따른다.
- 보드가 **ZMK Studio를 지원**하면, 간단한 키 몇 개 수정은 빌드·플래싱 없이 Studio에서 바로 할 수도 있다.

## 다음 — 설계기로

올리는 법을 익혔으면, 이제 "물리 키가 부족한 보드에서 **어떤 키맵이 좋은 키맵인가**"가 남는다. 그 설계 이야기는 [ZMK 키맵 설계기 — HHKB + 40% + 세벌식 390](/posts/etc/2026-07-03-zmk-keymap-hhkb-sebeolsik-40/)에서 이어진다.

## 정리

- ZMK 키매핑은 **포크 → 편집 → 빌드 → 플래싱** 네 단계다.
- 편집은 **웹 키맵 에디터(GUI)** 또는 **`.keymap` 직접 편집** 두 갈래. 초보는 GUI부터.
- 빌드는 **GitHub Actions가 자동**으로. Artifacts에서 `.uf2`를 받는다.
- 플래싱은 **부트로더 진입 → `.uf2` 드래그 복사**. 부트로더 진입법만은 보드별로 확인.

## 참고

- [Introduction to ZMK — ZMK Firmware](https://zmk.dev/docs)
- [nickcoutsos keymap-editor](https://nickcoutsos.github.io/keymap-editor/)
- [ZMK Studio — ZMK Firmware](https://zmk.dev/docs/features/studio)
</content>

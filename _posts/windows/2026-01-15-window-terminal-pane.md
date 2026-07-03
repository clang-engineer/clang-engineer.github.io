---
title       : Windows Terminal 화면(Pane) 기능 정리
description : "Windows Terminal에서 하나의 Tab을 여러 Pane으로 분할·이동·확대하는 단축키와 마우스 조작 방법을 구조 개념과 함께 정리한다."
date        : 2026-01-15 09:13:52 +0900
updated     : 2026-01-15 09:17:29 +0900
categories  : [windows, "셸·시스템"]
tags        : [windows-terminal, pane]
pin         : false
hidden      : false
---

## 1. 화면 구조 — Tab과 Pane

Windows Terminal은 하나의 **Tab** 안에 여러 개의 **Pane(분할 화면)** 를 둘 수 있다. Tab은 컨텍스트 분리 단위, Pane은 그 안에서 작업을 병렬화하는 실제 터미널 화면이다.

## 2. 자주 쓰는 단축키

| 기능 | 단축키 |
|----|----|
| 세로 분할 | `Alt + Shift + =` |
| 가로 분할 | `Alt + Shift + -` |
| 포커스 기준 자동 분할 | `Alt + Shift + D` |
| Pane 이동 | `Alt + 방향키` |
| Pane 닫기 (포커스된 것만) | `Ctrl + Shift + W` |

마우스로 분할하려면 탭 옆 `▼` → **Split pane** → 실행할 터미널 선택.

## 3. Zoom Pane — 직접 바인딩해야 한다

특정 pane만 전체 화면처럼 확대(`Toggle pane zoom`)하는 기능인데, **기본 단축키가 없는 경우가 많다.** 버전 차이·입력기(IME) 충돌·사용자 키맵 우선 적용 때문이라, 직접 바인딩하는 게 가장 안정적이다.

1. `Ctrl + ,` (또는 탭 옆 `▼` → **Settings**)로 설정 열기
2. **Actions → Add new**
   - Action: `Toggle pane zoom`
   - Keys: `Ctrl + Shift + Z` 또는 `Alt + Enter`

확대할 pane에 포커스한 뒤 설정한 키를 누르면 그 pane만 확대되고, 다시 누르면 원래 분할 상태로 복귀한다.

## 4. 활용 예시

- 로그 모니터링 + 명령 실행
- 서버 상태 확인 + 배포 명령 분리
- Git 작업 + 빌드 출력 병렬 확인

> Windows Terminal 1.17 이상 권장. 입력기 단축키와 충돌하면 다른 키 조합으로 바인딩한다.

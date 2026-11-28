---
title       : "애플리케이션 테마 설계 — ANSI 상속과 자체 색상 시스템"
description : "색상 결정권과 애플리케이션 테마의 책임 경계"
date        : 2026-11-28 00:00:00 +0900
categories  : [theme, "테마 관리"]
tags        : [theme, ansi, tui, architecture]
pin         : false
hidden      : false
---

## 전체 구조

```text
UI 역할 (error / success / selection)
  ├─ ANSI 인덱스 ──→ 터미널 팔레트 ──→ 렌더링
  ├─ RGB 값 ────────────────────────→ 렌더링
  └─ System Theme → 터미널 색상 조회 → 앱의 색상 계산
                                      └─→ 렌더링
```

화살표는 색상 결정 및 출력 흐름이다. 핵심은 실제 RGB를 누가 결정하는가이다. [ANSI 터미널 색상](2026-11-28-ansi-terminal-colors.md)에서 제어 시퀀스의 동작을 설명한다.

## 개발자의 색상 정의

C++ 출력 예시:

```cpp
std::cout << "\033[31mError\033[0m";
std::cout << "\033[38;2;255;85;85mError\033[0m";
```

첫 번째는 빨강 슬롯을 참조하고 두 번째는 RGB를 지정한다. 라이브러리는 이 명령을 추상화할 수 있다. Ratatui의 Color::Red, Color::Indexed(1), Color::Rgb(255, 85, 85)가 대표적인 예다.

규모가 큰 앱에서는 오류, 성공, 경고, 테두리, 선택 영역 등의 의미적 역할을 별도로 정의한다. 다음은 실제 제품 설정이 아닌 개념 예시다.

```text
Role       ANSI Theme     RGB Theme
error      index(1)       #ff5555
success    index(2)       #50fa7b
selection  index(4)       #44475a
```

역할과 색상값을 분리하면 UI 로직을 바꾸지 않고 테마를 교체할 수 있다. ANSI 테마는 터미널에 색상 선택을 위임하지만 슬롯 수와 대비에 제약이 있다. RGB 테마는 표현력이 높지만 터미널 테마와 독립적으로 관리해야 한다. 두 방식을 혼합할 수도 있다.

## 터미널 팔레트 상속과 조회

| 방식 | 색상 결정 | 대표 사례 |
|---|---|---|
| 인덱스 참조 | 터미널 | bat의 ansi 테마 |
| 팔레트 조회 및 계산 | 앱과 터미널 | Pi의 system 테마 |
| 자체 테마 | 앱의 설정 | RGB 기반 구문 강조 |

Pi의 system 테마는 터미널 전경·배경 및 16색을 조회하고 대비를 고려해 색상을 계산한다. 단순 인덱스 출력과 동일한 방식은 아니다. 지원 여부와 갱신 시점은 설치 버전 및 터미널 환경에 따라 확인한다. OpenCode의 system 같은 이름도 구현이 동일하다는 보장은 없다.

## CLI/TUI와 GUI의 경계

```text
CLI/TUI → 터미널 제어 시퀀스 → 터미널 렌더러
GUI     → 그래픽 API         → 그래픽 렌더러
Web     → HTML/CSS           → 브라우저
```

GUI 앱이 CLI로 실행된다고 ANSI 팔레트를 상속하는 것은 아니다. 예를 들어 JankyBorders는 macOS 창의 테두리를 그리므로 터미널 색상과 별개의 설정을 사용한다. Base16은 특정 렌더러에 종속되지 않는 색상 명세이므로 GUI용 템플릿에도 활용할 수 있다.

## 통합 전략

네이티브 팔레트 상속이 충분하면 별도 테마 파일이나 Hook을 추가하지 않는다. 자체 색상 정의가 필요한 경우 공식 테마 또는 호환 템플릿을 사용한다. Hook은 파일 배치나 활성화 등 실제로 필요한 연결에만 사용한다. 색상 일관성과 원본 디자인 보존은 서로 다른 목표다.

- [테마 로드맵](2026-11-28-00-theme-roadmap.md)
- [Tinted Theming 아키텍처](2026-11-28-tinted-theming-architecture.md)
- [Ratatui Color](https://docs.rs/ratatui/latest/ratatui/style/enum.Color.html)
- [Pi 테마 문서](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/themes.md)
- [bat](https://github.com/sharkdp/bat)

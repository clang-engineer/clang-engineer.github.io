---
title       : "새 맥에 더 얹을 보조 유틸 — 메뉴바·모니터·스크린샷·디스플레이·터미널"
description : "창 관리·키맵·창 전환 같은 큰 도구를 잡은 뒤, 깔아두면 삶이 편해지는 macOS 보조 유틸을 한데 모아 소개한다. Ice(메뉴바)·Stats(모니터)·Shottr(스크린샷)·BetterDisplay(디스플레이)·Ghostty(터미널) — 각각 무엇을·왜·대안까지."
date        : 2026-07-03 16:00:00 +0900
updated     : 2026-07-03 16:00:00 +0900
categories  : [macos, "시스템 운영"]
tags        : [macos, utilities, menubar, terminal]
pin         : false
hidden      : false
---

> 관련: [macOS 로드맵](/posts/macos/2026-07-03-macos-roadmap/) · [새 맥 초기 설정](/posts/macos/2022-02-05-new-mac-initial-setup/)

큰 축은 이미 각각 글로 다뤘다 — 창 관리는 [AeroSpace + Hammerspoon](/posts/macos/2026-07-03-macos-roadmap/), 키맵은 [Karabiner-Elements](/posts/etc/2026-07-03-karabiner-elements-macos-keymap/), 창 전환은 [AltTab](/posts/macos/2026-07-03-alttab-window-switcher/), 검색·런처는 [Raycast](/posts/macos/2026-07-03-raycast-search-layer-role/). 이 글은 그 다음, **"깊게 파진 않지만 깔아두면 삶이 편해지는"** 보조 유틸을 한데 모은 것이다. 각각 무엇을·왜·대안만 짧게.

공통점 하나 — 아래 다섯 중 넷은 **무료·오픈소스**다. 유료 대안이 더 유명한 자리마저 오픈소스 대체제가 충분히 성숙했다.

## Ice — 메뉴바 아이콘 정리

메뉴바 아이콘이 열 개를 넘어가면 노트북 노치에 가려 잘려 나간다. **[Ice](https://github.com/jordanbaird/Ice)**는 아이콘을 숨기고 접는 메뉴바 관리자다.

- **왜** — 자주 안 쓰는 아이콘을 숨기고, 필요할 때만 펼친다.
- **대안·대중성** — 오랜 표준은 유료 **Bartender**였지만, 2024년 **소유권이 조용히 넘어간 사실이 드러나며 신뢰 이슈**가 터졌다. 그 뒤 무료·오픈소스인 Ice가 사실상 대체제로 자리잡았다. 더 단순한 걸 원하면 **Hidden Bar**(무료)도 있다.
- **결론** — 새로 깐다면 Bartender 살 이유가 약하다. Ice부터.

## Stats — 메뉴바 시스템 모니터

**[Stats](https://github.com/exelban/stats)**는 CPU·메모리·네트워크·디스크·배터리·온도를 메뉴바에 띄운다.

- **왜** — 빌드나 무거운 작업 중 뭐가 병목인지 한눈에. 팬이 도는 이유를 바로 안다.
- **대안·대중성** — 유료 **iStat Menus**가 오래된 강자지만, Stats는 무료·오픈소스로 **일상 용도엔 기능이 충분**하다.
- **결론** — 상시 모니터가 필요하면 Stats. 부족함을 느낄 때 iStat Menus를 고민해도 늦지 않다.

## Shottr — 스크린샷·스크롤 캡처·OCR

macOS 기본 `⌘⇧5`로도 캡처는 되지만, **스크롤 캡처·이미지 OCR·픽셀 측정·주석**까진 안 된다. **[Shottr](https://shottr.cc/)**가 그 틈을 메운다.

- **왜** — 긴 페이지를 한 장으로(스크롤 캡처), 캡처한 이미지에서 글자 바로 추출(OCR), 화살표·모자이크 주석까지.
- **대안·대중성** — 상위엔 폴리시 좋은 유료 구독 **CleanShot X**가 주류다. Shottr는 **가볍고 저렴**(핵심 기능 무료, 일부 프로)해서 개인용으로 가성비가 좋다.
- **결론** — 팀·업무로 매일 쓰면 CleanShot X, 개인 용도면 Shottr로 충분.

## BetterDisplay — 디스플레이 해상도·스케일 제어

외장 모니터를 붙이면 macOS가 원하는 해상도·스케일을 안 열어주는 경우가 많다. **[BetterDisplay](https://github.com/waydabber/BetterDisplay)**가 이걸 강제로 연다.

- **왜** — HiDPI 스케일 강제, 원하는 해상도 추가, 밝기·명암 소프트웨어 제어, 가상 디스플레이 생성.
- **대안·대중성** — 이 영역의 사실상 표준. 외장 모니터(특히 비-레티나 4K, 울트라와이드) 쓰면 체감이 크다. 핵심 기능은 무료, 고급은 프로.
- **결론** — 외장 모니터를 쓴다면 거의 필수급. 내장 디스플레이만 쓰면 없어도 무방.

## Ghostty — 빠른 터미널 에뮬레이터

터미널 앱 자체를 바꾸는 선택. **[Ghostty](https://ghostty.org/)**는 2024년 공개된 GPU 가속 터미널로, `terraform`을 만든 Mitchell Hashimoto가 주도했다.

- **왜** — GPU 렌더링으로 빠르고, **기본 설정이 훌륭**해 손댈 게 적다. 네이티브 앱이라 macOS와 잘 붙는다.
- **대안·대중성** — 오랜 표준은 **iTerm2**(성숙·기능 방대). 그 외 **WezTerm·kitty·Alacritty**가 GPU 터미널 계열. Ghostty는 후발이지만 빠르게 인기를 얻었다.
- **결론** — [tmux](/posts/tmux/2026-06-16-tmux-roadmap/)를 세션 관리로 쓰면 터미널 앱의 탭·분할 기능이 덜 중요해져, "빠르고 기본값 좋은" Ghostty가 잘 맞는다. iTerm2의 방대한 기능이 필요하면 그대로 두는 것도 정답.

---

## 안 넣은 것 — Raycast가 커버

클립보드 히스토리(**Maccy**), 앱 런처(**Alfred**), 창 스냅 일부까지는 **[Raycast](/posts/macos/2026-07-03-raycast-search-layer-role/) 하나로 대부분 커버**된다. 별도 유틸을 겹쳐 깔기 전에 Raycast 확장으로 되는지부터 보는 게 앱 수를 줄이는 길이다.

**정리** — 큰 도구를 잡았다면, 위 다섯은 취향과 환경(외장 모니터 유무, 터미널 습관)에 따라 골라 얹으면 된다. 넷이 오픈소스라 부담 없이 시험해 보고 안 맞으면 지우면 그만이다.

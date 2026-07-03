---
title       : "Apple Silicon에서 webpack-notifier spawn 에러(-86) — Rosetta로 해결"
description : "애플 실리콘에서 webpack-notifier가 child_process를 띄울 때 발생하는 'spawn Unknown system error -86'. Rosetta 2 설치와 터미널의 'Rosetta 사용' 옵션으로 해결."
date        : 2022-02-05 09:32:27 +0900
updated     : 2026-07-03 09:33:16 +0900
categories  : [javascript, "Node·번들러"]
tags        : [error, webpack]
pin         : false
hidden      : false
---

## 증상: spawn Unknown system error -86

webpack build 시 아래와 같은 에러가 발생했다. 빌드가 끝나면 알림을 띄우는 플러그인 `webpack-notifier`를 사용하고 있었는데, 이 플러그인이 알림을 띄우려고 `child_process`로 외부 바이너리를 spawn하는 순간 터졌다.

```sh
<e> [webpack-dev-middleware] Error: spawn Unknown system error -86
<e>     at ChildProcess.spawn (node:internal/child_process:414:11)
<e>     at spawn (node:child_process:761:9)
<e>     at Object.execFile (node:child_process:351:17)
...
<e>   errno: -86,
<e>   code: 'Unknown system error -86',
<e>   syscall: 'spawn'
<e> }
```

## 원인: arm64에서 x86_64 전용 바이너리를 실행

핵심 단서는 `errno: -86`이다. macOS에서 errno 86은 `EBADARCH`, 즉 "Bad CPU type in executable"이다. 실행하려는 바이너리에 현재 CPU 아키텍처에 맞는 코드가 들어있지 않을 때 발생한다.

애플 실리콘(arm64)에서 Node가 `spawn`으로 띄우려는 바이너리가 x86_64(인텔) 전용으로 빌드되어 있으면, 커널이 arm64용 실행 코드를 찾지 못해 이 에러를 던진다. `webpack-notifier`는 내부적으로 알림 표시용 네이티브 바이너리(macOS의 경우 `terminal-notifier` 계열)를 호출하는데, 그 바이너리가 x86_64 슬라이스만 갖고 있으면 arm64 환경에서 그대로 실패한다.

Rosetta 2는 이런 x86_64 코드를 arm64에서 번역·실행해주는 호환성 레이어다. 따라서 Rosetta 2가 없거나, 해당 프로세스가 Rosetta로 실행되도록 되어 있지 않으면 x86_64 바이너리 spawn이 `EBADARCH`로 막힌다.

> `webpack-notifier`가 정확히 어떤 바이너리를 x86_64로만 배포하는지까지는 확인하지 못했지만, `errno -86 = EBADARCH`라는 점에서 "arm64에서 x86_64 바이너리를 실행하려다 실패"가 원인이라고 판단했다.
{: .prompt-info }

[laravel-mix issue #3027](https://github.com/laravel-mix/laravel-mix/issues/3027)에서도 같은 증상이 보고되어 있다.

## 해결: Rosetta 2 설치 + 터미널을 Rosetta로 실행

먼저 Rosetta 2를 설치한다. 애플 실리콘에서 인텔 기반 앱을 실행할 수 있게 해주는 호환성 레이어다.

```sh
# Rosetta 2 설치
softwareupdate --install-rosetta --agree-to-license
```

나의 경우 이미 설치되어 있었지만, 위 명령으로 다시 설치하고 터미널을 재시작하니 해결됐다.

이것만으로 안 되면 개발 서버를 띄우는 **터미널 자체를 Rosetta로 실행**하도록 바꾼다. 이렇게 하면 그 터미널에서 실행되는 Node와 하위 프로세스가 x86_64로 동작해, x86_64 전용 바이너리 spawn이 정상적으로 번역된다.

- Finder → 응용 프로그램 → 유틸리티 → 터미널
- 터미널을 선택하고 `Command + I`를 눌러 정보창을 연다.
- 'Rosetta 사용' 체크박스를 체크한 뒤 터미널을 재시작한다.

[Building a universal macOS binary (Apple Developer)](https://developer.apple.com/documentation/apple_silicon/building_a_universal_macos_binary)

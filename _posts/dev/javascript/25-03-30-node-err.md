---
title       : node.js error
description : >-
    node.js 사용 시 발생하는 에러에 대해 기록 합니다.
date        : 2022-02-05 09:32:27 +0900
updated     : 2025-03-06 09:33:16 +0900
categories  : [dev, javascript]
tags        : [nodejs, error, webpack, rosetta, apple-silicon]
pin         : false
hidden      : false
---

## Error: spawn Unknown system error -86
webpack build 시 아래와 같은 에러가 발생함.
이 경우는 webpack 빌드가 끝나면 알림을 띄우는 플러그인(`webpack-notifier`)을 사용하고 있었는데, 칩셋이 애플 실리콘인 경우 발생하는 에러인 것으로 추정됨.

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

>
[참조](https://github.com/laravel-mix/laravel-mix/issues/3027)

### 해결 방법
Rosetta라고 하는 애플 실리콘에서 인텔 기반의 앱을 실행할 수 있도록 해주는 호환성 레이어를 설치해주면 해결됨.
[참조](https://developer.apple.com/documentation/apple_silicon/building_a_universal_macos_binary)

나의 경우 이미 설치되어 있었지만, 아래와 같이 다시 설치해주고 터미널을 재시작 하니 해결됨.

```sh
# Rosetta 2 설치
softwareupdate --install-rosetta --agree-to-license
```

### 
finder > 응용 프로그램 > 유틸리티 > 터미널
> 터미널을 선택하고, Command + I 를 눌러서 정보창을 연다.
> 'Rosetta 사용' 체크박스를 체크한다.
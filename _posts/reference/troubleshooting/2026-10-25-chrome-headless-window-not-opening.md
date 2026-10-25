---
title       : "macOS에서 Chrome 창이 열리지 않을 때: Headless 프로세스 확인"
description : "Chrome이 실행 중인데 창이 보이지 않을 때 일반 창과 자동화용 headless 프로세스를 구분하고 안전하게 복구하는 절차"
date        : 2026-10-25 18:00:00 +0900
categories  : [troubleshooting, "macos"]
tags        : [chrome, headless, macos, browser, troubleshooting]
pin         : false
hidden      : false
---

macOS에서 Dock의 Chrome을 눌러도 창이 보이지 않을 때가 있다. 자동화 도구가 실행한 **Headless Chrome**이 남아 있는 경우도 가능한 원인 중 하나다. Headless는 브라우저를 화면에 표시하지 않고 실행하는 모드다.

다만 **창이 안 보인다고 반드시 Headless 때문인 것은 아니다.** 먼저 일반 창을 열어 보고, 이후 프로세스를 확인한다.

## 증상과 확인 순서

```text
Chrome을 실행했지만 창이 보이지 않음
    │
    ├─ 새 창 요청 → 창이 열리면 종료
    │
    └─ 여전히 보이지 않음
         ├─ 실행 인자에 --headless가 있는가?
         │    ├─ 예 → 어떤 자동화 작업이 실행했는지 확인
         │    └─ 아니오 → 다른 창·프로필·앱 상태 점검
         └─ 해당 테스트가 끝났을 때만 대상 프로세스 종료
```

## 1. 기존 프로세스를 종료하지 않고 창 요청

```sh
open -n -a "Google Chrome" --args --new-window
```

`open -n`은 새 앱 인스턴스를 요청하지만, Chrome이 동일 프로필의 기존 인스턴스로 요청을 전달할 수 있다. 별도 프로필을 보장하는 명령은 아니다.

## 2. Headless 프로세스 확인

기본 설치 경로(`/Applications/Google Chrome.app`)에서 실행된 프로세스의 인자를 확인한다.

```sh
pgrep -fl '^/Applications/Google Chrome[.]app/Contents/MacOS/Google Chrome .*--headless([=[:space:]]|$)'
```

`--headless`나 `--headless=new`를 사용한 본체 프로세스를 찾는 예시다. `--user-data-dir`, `--remote-debugging-port`도 어떤 테스트가 실행했는지 구분하는 단서다. 다른 설치 경로나 인자 순서·프로세스 명령행 형식에 따라 누락될 수 있다.

## 3. 필요할 때만 종료

**테스트가 진행 중이면 종료하지 않는다.** 해당 프로세스의 소유 작업을 확인한 뒤 중단해도 되는 경우에만 PID를 지정해 정상 종료 신호를 보낸다.

```sh
kill -TERM <PID>
open -n -a "Google Chrome" --args --new-window
```

`killall "Google Chrome"`처럼 일반 브라우저 창까지 함께 종료할 수 있는 명령은 피한다. 종료 후에도 창이 나타나지 않으면 Headless 이외의 원인을 조사한다.

## 재발 방지

자동화 도구는 자신이 실행한 브라우저만 종료하고, 테스트 프로필을 일반 사용자 프로필과 분리한다. 정상 완료뿐 아니라 실패·취소 경로에서도 종료 처리를 수행한다.

## 참고

- [Chrome Headless 공식 문서](https://developer.chrome.com/docs/chromium/headless)
- macOS 로컬 매뉴얼: `man open`, `man pgrep`, `man kill`

---
title       : "Chrome 새 탭에서 자동으로 개발자도구 열기"
description : "target=_blank로 열린 새 탭의 네트워크 요청을 디버깅하려면 --auto-open-devtools-for-tabs 옵션으로 Chrome을 실행"
date        : 2026-03-31 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [etc, "개발 도구"]
tags        : [debugging]
pin         : false
hidden      : false
---

`target="_blank"`로 열린 새 탭은 개발자도구가 닫혀있어 네트워크 요청을 볼 수 없다.

## 해결: CLI 옵션으로 Chrome 실행

Chrome 버전에 따라 `chrome://flags` 플래그가 없을 수 있다. 확실한 방법은 CLI 옵션이다.

```bash
# macOS — 기존 Chrome 종료 후 실행
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --auto-open-devtools-for-tabs
```

```powershell
# Windows
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --auto-open-devtools-for-tabs
```

```bash
# Linux
google-chrome --auto-open-devtools-for-tabs
```

모든 새 탭에서 개발자도구가 자동으로 열린다. 디버깅이 끝나면 일반 방식으로 Chrome 재실행.

## 활용 시나리오

- `<a target="_blank">` 링크로 열린 새 탭의 첫 요청 헤더/응답 추적
- form POST로 `target="_blank"` 새 탭을 띄우는 외부 시스템 연동 디버깅
- SSO 콜백처럼 팝업/새 탭에서 시작되는 네트워크 흐름 분석

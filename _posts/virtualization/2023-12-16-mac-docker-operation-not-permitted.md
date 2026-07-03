---
title       : Mac에서 Docker 실행시 Operation not permitted 에러 해결법
description : "macOS에서 Docker 실행 시 발생하는 Operation not permitted 에러의 원인이 파일·폴더 접근 권한 누락임을 짚고, 시스템 환경설정에서 Docker 권한을 부여해 해결하는 방법을 정리한다."
date        : 2021-12-08 09:00:45 +0900
updated     : 2026-07-03
categories  : [virtualization, "컨테이너"]
tags        : [macos, troubleshooting]
redirect_from:
  - /posts/docker/2023-12-16-mac-docker-operation-not-permitted/
pin         : false
hidden      : false
---

## 🐳 Docker "Operation not permitted" 에러 해결

## 문제
Docker 실행 중 아래와 같은 에러가 간헐적으로 발생했습니다.

```bash
Caused by: java.io.FileNotFoundException: central-config/localhost-config/application.yml (Operation not permitted)
```

* 처음에는 권한 문제인 줄 알고 `sudo`, `chmod`, `chown` 등 여러 방법을 시도했지만 해결되지 않았습니다.

---

## 원인

* macOS 시스템 설정에서 **Docker가 파일 및 폴더 접근 권한을 갖고 있지 않음**이 원인이었습니다.
* macOS는 TCC(Transparency, Consent, and Control)라는 개인정보 보호 계층을 통해, 앱이 데스크탑·문서 같은 사용자 폴더에 접근할 때 명시적 허가를 요구합니다. Docker Desktop이 이 허가를 받지 못하면 컨테이너가 호스트 파일을 읽으려 할 때 OS 레벨에서 접근이 차단되고, 그 결과 파일이 실제로 존재하는데도 `Operation not permitted`로 실패합니다.
* 그래서 `sudo`·`chmod`·`chown` 같은 유닉스 권한 조정으로는 해결되지 않습니다. 이건 파일 퍼미션 문제가 아니라, macOS가 앱 단위로 걸어 둔 접근 통제이기 때문입니다.

---

## 해결 방법

1. 시스템 환경설정 열기
   `System Preferences > Privacy & Security > Files and Folders`
2. **Docker** 선택
3. **Desktop Folder** 체크
4. 변경 후 **재부팅**

> ✅ 이렇게 설정하면 Docker가 해당 폴더에 접근할 수 있어 문제 해결

---

## 참고

* [StackOverflow 관련 글](https://stackoverflow.com/questions/58482352/operation-not-permitted-from-docker-container-logged-as-root)

---
title       : Mac에서 Docker 실행시 Operation not permitted 에러 해결법
description : >-
date        : 2021-12-08 09:00:45 +0900
updated     : 2025-10-03 13:28:38 +0900
categories  : [docker]
tags        : [macos, error]
pin         : false
hidden      : false
---

# 🐳 Docker "Operation not permitted" 에러 해결

## 문제
Docker 실행 중 아래와 같은 에러가 간헐적으로 발생했습니다.

```bash
Caused by: java.io.FileNotFoundException: central-config/localhost-config/application.yml (Operation not permitted)
````

* 처음에는 권한 문제인 줄 알고 `sudo`, `chmod`, `chown` 등 여러 방법을 시도했지만 해결되지 않았습니다.

---

## 원인

* macOS 시스템 설정에서 **Docker가 파일 및 폴더 접근 권한을 갖고 있지 않음**이 원인이었습니다.

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

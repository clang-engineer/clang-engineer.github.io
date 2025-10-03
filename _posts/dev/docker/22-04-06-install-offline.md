---
title       : 도커 폐쇄망 설치
description : >-
date        : 2021-12-08 09:00:45 +0900
updated     : 2025-10-03 13:33:13 +0900
categories  : [dev, docker]
tags        : [docker, offline, binary]
pin         : false
hidden      : false
---

# 🐳 도커 폐쇄망 설치 가이드 (바이너리 방식)

> 참고: [Docker 공식 문서 - Binaries](https://docs.docker.com/engine/install/binaries/)

폐쇄망 환경에서 Docker를 설치할 때, 패키지 매니저 없이 **바이너리 파일**을 다운로드하여 설치하는 방법입니다.

---

## 1️⃣ Docker 바이너리 다운로드
- 환경에 맞는 Docker 바이너리를 다운로드합니다.
- Docker 공식 문서에서 제공하는 **Binaries** 페이지 참고

---

## 2️⃣ 압축 해제

```sh
$ tar xzvf /path/to/<FILE>.tar.gz
````

* `<FILE>.tar.gz` 는 다운로드한 Docker 바이너리 파일

---

## 3️⃣ 전역 실행 경로로 복사

```sh
$ sudo cp docker/* /usr/bin
```

* Docker 실행 파일을 전역 경로(`/usr/bin`)로 복사하여 어디서든 실행 가능하도록 설정

---

## 4️⃣ Docker 데몬 실행

```sh
$ sudo dockerd &
```

* 백그라운드로 Docker 데몬 실행

---

## 5️⃣ Docker 실행 확인

```sh
$ sudo docker run hello-world
```

* Docker가 정상적으로 설치되었는지 확인
* `Hello from Docker!` 메시지가 출력되면 성공

---
title       : Jhipster SonarQube
description : >-
date        : 2025-10-02 19:49:32 +0900
updated     : 2025-10-04 19:43:09 +0900
categories  : [dev, jhipster]
tags        : [jhispter, sonar]
pin         : false
hidden      : false
---

# 🧩 SonarQube 실행 및 토큰 생성 + Gradle 분석 실행 가이드

## 1️⃣ SonarQube 도커 컨테이너 실행

```bash
docker-compose -f src/main/docker/sonar.yml up -d
```

* `src/main/docker/sonar.yml` 파일에 정의된 SonarQube 서비스를 **백그라운드(detached)** 모드로 실행합니다.
* 최초 실행 시 이미지 다운로드 및 초기화로 인해 수 분 정도 소요될 수 있습니다.

---

## 2️⃣ SonarQube 접속

브라우저에서 아래 주소로 접속합니다:

```
http://localhost:9001
```

기본 로그인 정보:

| 항목     | 값       |
| ------ | ------- |
| **ID** | `admin` |
| **PW** | `admin` |

> ⚠️ 첫 로그인 후 비밀번호 변경을 요구할 수 있습니다.

---

## 3️⃣ SonarQube 토큰 생성

1. 화면 우측 상단 **프로필 아이콘 클릭**
2. **My Account → Security** 메뉴로 이동
3. **Generate Tokens** 섹션에서 토큰명 입력
   예: `my-sonar-token`
4. **Generate** 버튼 클릭
5. 생성된 **토큰을 복사**하여 안전한 곳에 저장

> 🔒 생성된 토큰은 한 번만 표시되며, 이후 다시 확인할 수 없습니다.

---

## 4️⃣ Gradle 프로젝트에서 SonarQube 분석 실행

토큰을 발급받았다면, 터미널에서 다음 명령어를 실행합니다:

```bash
./gradlew sonarqube \
  -Dsonar.host.url=http://localhost:9001 \
  -Dsonar.login=<발급받은_토큰>
```

예시:

```bash
./gradlew sonarqube \
  -Dsonar.host.url=http://localhost:9001 \
  -Dsonar.login=my-sonar-token
```

---

## 5️⃣ 분석 결과 확인

1. 빌드가 완료되면 콘솔에 “**ANALYSIS SUCCESSFUL**” 메시지가 표시됩니다.
2. SonarQube 웹 UI의 **Projects** 탭으로 이동하면 방금 분석된 프로젝트가 나타납니다.
3. 코드 품질, 버그, 코드 스멜(Smell), 테스트 커버리지 등의 지표를 시각적으로 확인할 수 있습니다.

---

## ✅ 요약

| 단계  | 내용                                               |
| --- | ------------------------------------------------ |
| 1️⃣ | `docker-compose`로 SonarQube 컨테이너 실행              |
| 2️⃣ | `http://localhost:9001` 접속 후 로그인 (`admin/admin`) |
| 3️⃣ | My Account → Security → Token 생성                 |
| 4️⃣ | `./gradlew sonarqube -Dsonar.login=<token>` 실행   |
| 5️⃣ | SonarQube 대시보드에서 결과 확인                           |

---

## 🛠️ 추가 명령어
# Docker 상태 확인
docker ps

# SonarQube 로그 확인
docker-compose -f src/main/docker/sonar.yml logs

# 컨테이너 재시작
docker-compose -f src/main/docker/sonar.yml restart

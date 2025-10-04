---
title       : Jhipster SonarQube
description : >-
date        : 2025-10-02 19:49:32 +0900
updated     : 2025-10-04 20:09:09 +0900
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


---


🔧 프로젝트 코드 분석 실행 방법
1. Gradle을 통한 분석 (권장)
```sh
./gradlew test jacocoTestReport # 1. 테스트 실행 및 커버리지 리포트 생성
./gradlew sonarqube # 2. SonarQube 분석 실행
```

2. SonarQube Scanner 직접 사용

```sh
brew install sonar-scanner # SonarQube Scanner 설치 (macOS)
sonar-scanner # 분석 실행
```


---

sonar-scanner는 코드 정적분석 도구로, 코드 품질 및 보안 취약점을 식별하는 데 사용됩니다. SonarQube 서버와 연동하여 분석 결과를 시각화하고 관리할 수 있습니다.ㅊ

| 항목          | 설명                                                       |
| ----------- | -------------------------------------------------------- |
| **분석 대상**   | `sonar-project.properties` 에 지정된 소스 코드 (`sonar.sources`) |
| **분석 종류**   | 정적 분석 (bugs, code smells, vulnerabilities 등)             |
| **테스트 실행**  | ❌ 수행하지 않음                                                |
| **커버리지 반영** | ❌ 자동 불가 (별도로 XML 리포트 제공 시 가능)                            |

⚙️ 기본 동작 구조

sonar-scanner 실행 시
→ sonar-project.properties 파일을 읽음

그 안의 설정에 따라

소스 경로 (sonar.sources)

언어 (예: Java, JavaScript, TypeScript 등)

SonarQube 서버 (sonar.host.url)

프로젝트 키 (sonar.projectKey)
등을 기준으로 정적 분석만 수행합니다.

분석 결과를 SonarQube 서버로 업로드
→ SonarQube가 내부 규칙(예: PMD, Checkstyle, ESLint 등)로 품질 점수를 계산

📊 테스트 커버리지(coverage) 포함하고 싶다면?

sonar-scanner는 테스트를 직접 실행하지 않기 때문에
JaCoCo나 Jest, pytest 등으로 사전에 리포트를 생성해두어야 합니다.

예를 들어 Java 프로젝트의 경우 👇

./gradlew test jacocoTestReport


이 명령으로 생성된 XML 리포트를 SonarQube에 알려주면 됩니다.

sonar-project.properties 예시:

sonar.projectKey=my-project
sonar.sources=src/main/java
sonar.tests=src/test/java
sonar.java.binaries=build/classes
sonar.coverage.jacoco.xmlReportPaths=build/reports/jacoco/test/jacocoTestReport.xml
sonar.host.url=http://localhost:9001
sonar.login=my-sonar-token


이렇게 하면 sonar-scanner 실행 시,
정적 분석 + 커버리지 리포트 반영이 동시에 이루어집니다.

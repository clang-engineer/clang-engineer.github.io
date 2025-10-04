---
title       : Jhipster SonarQube
description : >-
date        : 2025-10-02 19:49:32 +0900
updated     : 2025-10-04 20:45:35 +0900
categories  : [dev, jhipster]
tags        : [jhispter, sonar]
pin         : false
hidden      : false
---

# SonarQube 실행 및 분석 가이드

본 문서는 SonarQube 도커 실행, 토큰 생성, Gradle/sonar-scanner 분석, JaCoCo/Jest 연동, Kotlin 관련 JDK 이슈 및 CI/CD 통합까지 한눈에 정리한 가이드입니다.

---

## 1. SonarQube 도커 컨테이너 실행

```bash
docker-compose -f src/main/docker/sonar.yml up -d
```

* `src/main/docker/sonar.yml`에 정의된 SonarQube 서비스를 백그라운드로 실행합니다.
* 최초 실행 시 이미지 다운로드 및 초기화(플러그인 설치 등)로 인해 몇 분 소요될 수 있습니다.

---

## 2. SonarQube 접속

브라우저에서 접속:

```
http://localhost:9001
```

기본 로그인 정보:

| 항목 | 값       |
| -- | ------- |
| ID | `admin` |
| PW | `admin` |

> 첫 로그인 시 비밀번호 변경 또는 기타 보안 설정을 요구할 수 있습니다.

---

## 3. 토큰 생성 (My Account → Security)

1. 우측 상단 프로필 클릭 → **My Account** → **Security**
2. **Generate Tokens** 섹션에서 토큰명 입력(예: `my-sonar-token`)
3. **Generate** 클릭 → 생성된 토큰 복사 후 안전한 곳에 보관

> 토큰은 한 번만 표시되며, CI 환경에서는 환경변수로 관리 권장

---

## 4. Gradle 프로젝트에서 SonarQube 분석 실행

```bash
./gradlew sonarqube \
  -Dsonar.host.url=http://localhost:9001 \
  -Dsonar.login=<발급받은_토큰>
```

---

## 5. sonar-scanner 독립 실행형 사용

macOS에서 설치:

```bash
brew install sonar-scanner
```

실행:

```bash
sonar-scanner
```

* 정적 분석만 수행합니다 (테스트 실행은 하지 않음)
* 커버리지 포함하려면 사전에 JaCoCo/Jest로 XML 리포트를 생성 후 설정

`sonar-project.properties` 예시:

```properties
sonar.projectKey=my-project
sonar.sources=src/main/java
sonar.tests=src/test/java
sonar.java.binaries=build/classes
sonar.coverage.jacoco.xmlReportPaths=build/reports/jacoco/test/jacocoTestReport.xml
sonar.testExecutionReportPaths=build/test-results/jest/TESTS-results-sonar.xml
sonar.javascript.lcov.reportPaths=build/test-results/lcov.info
sonar.host.url=http://localhost:9001
sonar.login=my-sonar-token
```

---

## 6. JaCoCo 설정 (Gradle 예시)

```groovy
jacoco {
    toolVersion = "0.8.8"
}

jacocoTestReport {
    executionData tasks.withType(Test)
    classDirectories.from = files(sourceSets.main.output.classesDirs)
    sourceDirectories.from = files(sourceSets.main.java.srcDirs)

    reports {
        xml.enabled = true  // SonarQube 인식용 XML
    }
}
```

* 순서: `./gradlew test jacocoTestReport` → `./gradlew sonarqube`
* XML 파일 경로를 sonar-project.properties 또는 Gradle Sonar 설정에 지정해야 함

---

## 7. Jest 테스트 결과 인식

`jest.conf.js` 예시:

```js
reporters: [
  'default',
  ['jest-junit', { outputDirectory: './build/test-results/', outputName: 'TESTS-results-jest.xml' }],
  ['jest-sonar', { outputDirectory: './build/test-results/jest', outputName: 'TESTS-results-sonar.xml' }],
],
```

* SonarQube 설정:

```properties
sonar.testExecutionReportPaths=build/test-results/jest/TESTS-results-sonar.xml
sonar.javascript.lcov.reportPaths=build/test-results/lcov.info
```

---

## 8. 자주 쓰는 명령

```bash
# Docker 상태
docker ps

# SonarQube 로그
docker-compose -f src/main/docker/sonar.yml logs -f

# 컨테이너 재시작
docker-compose -f src/main/docker/sonar.yml restart

# Gradle 테스트 + JaCoCo
./gradlew test jacocoTestReport

# Gradle SonarQube 분석
./gradlew sonarqube -Dsonar.host.url=http://localhost:9001 -Dsonar.login=<token>

# sonar-scanner 실행 (Java 지정)
JAVA_HOME=$(/usr/libexec/java_home -v 17) sonar-scanner
```
---

## 9. Sonarqube 운영 환견 구축
1. 별도 서버에 SonarQube 운영 (권장)

1단계: SonarQube 전용 서버 구축
```sh
# SonarQube 서버 (예: 192.168.1.100)
docker-compose -f sonar-production.yml up -d
```

2단계: 운영용 SonarQube 설정
```sh
# sonar-production.yml
version: '3.8'
services:
  sonarqube:
    image: sonarqube:9.9.1-community
    environment:
      - sonar.forceAuthentication=true
      - sonar.security.realm=LDAP
    ports:
      - 9000:9000  # 외부 접근 허용
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_logs:/opt/sonarqube/logs
    restart: unless-stopped

volumes:
  sonarqube_data:
  sonarqube_logs:
```

2. 클라우드 SonarQube 서비스 사용
SonarCloud 사용 (무료 플랜)
```sh
# sonar-project.properties 수정
sonar.projectKey=demo
sonar.projectName=demo
sonar.host.url=https://sonarcloud.io
sonar.organization=your-org
sonar.token=your-token
```

---

## 10. 2. GitHub Actions 통합
```sh
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  build-test-sonar:
    name: Build, Test & SonarQube Analysis
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          distribution: temurin
          java-version: 17

      - name: Run Tests & Generate JaCoCo Coverage
        run: ./gradlew test jacocoTestReport

      - name: SonarQube Scan
        run: ./gradlew sonarqube \
             -Dsonar.login=${{ secrets.SONAR_TOKEN }} \
             -Dsonar.host.url=http://your-sonarqube-server:9001

  docker-deploy:
    name: Build Docker & Deploy
    runs-on: ubuntu-latest
    needs: build-test-sonar
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          distribution: temurin
          java-version: 17

      - name: Build Docker Image with Jib
        run: ./gradlew jibDockerBuild

      - name: Save Docker Image as tar
        run: docker save demo:latest | gzip > demo.tar.gz

      - name: Copy Docker Image to Server
        run: scp -P 22 demo.tar.gz <user>@<ip>:/home/<user>/

      - name: Load Docker Image & Run on Server
        run: |
          ssh -l <user> -p 22 <ip> "
            docker load < /home/<user>/demo.tar.gz
            cd /home/<user>/demo
            docker-compose -f docker-compose.prod.yml up -d
          "
```


---

## 10. 결론

* SonarQube는 커버리지가 없어도 강력한 정적 분석 도구입니다.
* 테스트 커버리지를 추가하면 품질 분석 정확도가 향상됩니다.
* Kotlin/Java 버전 충돌 시 scanner와 서버의 JAVA_HOME을 반드시 확인하세요.
* JaCoCo와 Jest 연동 시 sonar-project.properties와 각 리포트 경로 설정을 통해 분석 가능


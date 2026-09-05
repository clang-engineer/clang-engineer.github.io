---
title       : "JHipster Docker 배포 — Jib 빌드에서 Registry·Compose 실행까지"
description : "Jib으로 Dockerfile 없이 Spring Boot 이미지를 만들고 Registry 또는 파일로 전달한 뒤 Docker Compose에서 실행하는 전체 배포 파이프라인과 각 단계의 책임을 정리한다."
date        : 2025-10-02 20:04:19 +0900
updated     : 2026-09-05 21:50:00 +0900
categories  : [spring-boot, "JHipster"]
tags        : [jhipster, jib, docker, deployment, gradle]
pin         : false
hidden      : false
---

JHipster 애플리케이션을 Docker로 배포할 때 Jib, Docker Compose, Registry가 한꺼번에 등장하면 역할이 섞이기 쉽다. 먼저 전체 파이프라인을 나눈다.

```text
Spring Boot / JHipster 소스
        ↓
Jib
→ Container Image 생성
        ↓
전달
├─ Registry Push
└─ docker save / 파일 전송
        ↓
운영 서버
        ↓
Docker Compose
→ App / DB / Nginx 실행
```

핵심은 세 단계다.

1. **Build** — Jib이 Application을 Container Image로 만든다.
2. **Deliver** — Image를 Registry나 파일 형태로 운영 환경에 전달한다.
3. **Run** — Compose가 Image와 DB, Network, Volume, Environment를 조립해 실행한다.

Jib은 배포 전체를 담당하지 않는다. **Image를 만드는 계층**이다.

## 1. Jib은 Dockerfile 없이 Image를 만든다

Gradle 프로젝트에서는 Jib 설정으로 Base Image, Container 설정, 추가 파일을 선언할 수 있다.

```groovy
jib {
    from {
        image = "eclipse-temurin:11-jre-focal"
        platforms {
            platform {
                architecture = "${findProperty('jibArchitecture') ?: 'amd64'}"
                os = "linux"
            }
        }
    }

    to {
        image = "demo:latest"
    }

    container {
        entrypoint = ["bash", "-c", "/entrypoint.sh"]
        ports = ["8080"]
        environment = [
            SPRING_OUTPUT_ANSI_ENABLED: "ALWAYS",
            JHIPSTER_SLEEP: "0"
        ]
        user = "1000"
    }

    extraDirectories {
        paths = file("src/main/docker/jib")
        permissions = ["/entrypoint.sh": "755"]
    }
}
```

이 설정을 책임별로 보면 다음과 같다.

| 영역 | 역할 |
|---|---|
| `from` | Base Image와 Target Platform |
| `to` | 생성될 Image 이름 |
| `container` | 실행 사용자·포트·환경·Entrypoint |
| `extraDirectories` | Image에 추가할 파일과 권한 |

### Base Image

```groovy
from {
    image = "eclipse-temurin:11-jre-focal"
}
```

Application Layer 아래에서 실제 JVM과 OS Userland를 제공한다. 운영 Java 버전과 Base Image 유지보수 정책을 함께 본다.

### Platform

```groovy
architecture = "${findProperty('jibArchitecture') ?: 'amd64'}"
```

빌드 대상 Architecture를 명시한다.

```bash
./gradlew jibDockerBuild -PjibArchitecture=arm64
```

단일 Image에 여러 Architecture를 함께 묶는 Multi-Arch Manifest와, 한 번의 빌드에서 특정 Platform Image를 만드는 것은 구분해서 본다.

### Non-root 사용자

```groovy
container {
    user = "1000"
}
```

Container Process를 root가 아닌 UID로 실행한다. 이때 `/entrypoint.sh`, Mount Volume, Application이 쓰는 Directory가 해당 UID로 접근 가능한지도 함께 확인해야 한다.

### 추가 파일과 권한

```groovy
extraDirectories {
    paths = file("src/main/docker/jib")
    permissions = ["/entrypoint.sh": "755"]
}
```

Local 파일을 Image Filesystem에 포함시키는 계층이다.

```text
src/main/docker/jib/entrypoint.sh
        ↓
Image /entrypoint.sh
        ↓
755
        ↓
Container Entrypoint
```

## 2. Image를 어디에 만들 것인가

Jib에는 두 가지 대표적인 목적지가 있다.

### Local Docker Daemon

```bash
./gradlew jibDockerBuild
```

```text
Gradle Project
   ↓
Jib
   ↓
Local Docker Daemon
   ↓
docker images
```

Local Compose 테스트에 적합하다.

### Registry

```bash
./gradlew jib \
  --image=docker.io/your-username/demo:latest
```

또는 Gradle의 `to.image`를 Registry 주소로 설정한다.

```text
Gradle Project
   ↓
Jib
   ↓
Container Registry
   ↓
운영 서버 docker pull
```

운영 배포에서는 일반적으로 Registry를 경유하는 방식이 Image Version 관리와 Rollback에 유리하다.

## 3. Tag는 배포 식별자다

`latest`만 사용하면 현재 실행 중인 Image와 이전 버전을 구분하기 어렵다.

운영에서는 다음처럼 Immutable한 식별자를 함께 쓰는 편이 낫다.

```text
demo:1.8.3
demo:20260905-2145
demo:<git-sha>
```

배포 흐름은:

```text
Commit
  ↓
Image build
  ↓
Immutable Tag
  ↓
Registry Push
  ↓
Compose가 해당 Tag 참조
```

이렇게 잡으면 이전 Tag로 되돌리는 Rollback도 단순해진다.

## 4. Docker Compose는 Runtime 구성을 조립한다

Jib이 만든 것은 App Image 하나다. 실제 운영에서는 DB, Reverse Proxy, Volume, Network, Secret 등 Runtime 구성이 필요하다.

```yaml
services:
  demo-app:
    image: your-registry/demo:${APP_VERSION}
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://demo-postgresql:5432/demo
      SPRING_DATASOURCE_USERNAME: demo
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
    ports:
      - "8080:8080"
    depends_on:
      - demo-postgresql
    restart: unless-stopped
    networks:
      - demo-network

  demo-postgresql:
    image: postgres:14.5
    environment:
      POSTGRES_DB: demo
      POSTGRES_USER: demo
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - demo-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - demo-app
    restart: unless-stopped
    networks:
      - demo-network

volumes:
  postgres_data:

networks:
  demo-network:
    driver: bridge
```

여기서 역할을 분리하면:

```text
Image
→ Application Binary와 Runtime 기본값

Environment
→ 환경별 설정

Volume
→ Container 수명과 분리된 데이터

Network
→ Service 간 연결

Compose
→ 이 요소들의 조립
```

## 5. Secret은 Image 안에 넣지 않는다

DB Password나 API Key를 Jib의 `container.environment`에 하드코딩하면 Image Metadata와 Build 설정에 Secret이 남는다.

운영에서는 Secret 값을 Runtime에 주입한다.

```yaml
SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
```

그리고 실제 `DB_PASSWORD`는 CI/CD Secret, Docker Secret, Kubernetes Secret, Vault 등 배포 환경의 Secret 관리 계층에서 제공한다.

```text
Build-time
→ Secret 없음

Deploy-time
→ Secret 주입
```

## 6. 배포 절차

Registry를 사용하는 기본 흐름은 다음과 같다.

```bash
# 1. Image build + push
./gradlew jib --image=registry.example.com/demo:${APP_VERSION}

# 2. 운영 서버
export APP_VERSION=<version>
docker compose pull demo-app

# 3. 새 Image로 재생성
docker compose up -d demo-app

# 4. 상태 확인
docker compose ps
docker compose logs -f demo-app
```

전체 Runtime 구성이 바뀌었다면:

```bash
docker compose pull
docker compose up -d
```

## 7. Registry가 없다면 파일로 전달할 수도 있다

작은 폐쇄망 환경에서는 Image 파일 전송도 가능하다.

```bash
docker save demo:${APP_VERSION} | gzip > demo.tar.gz
scp demo.tar.gz server:/tmp/
```

운영 서버:

```bash
gunzip -c /tmp/demo.tar.gz | docker load
APP_VERSION=${APP_VERSION} docker compose up -d demo-app
```

하지만 이 방식은 Registry보다 Version 조회, 배포 이력, Rollback, 다중 서버 배포가 불편하다. Registry를 사용할 수 없는 환경의 대안으로 보는 편이 좋다.

## 8. CI/CD는 같은 파이프라인을 자동화한다

CI/CD의 역할도 새 개념이 아니다.

```text
Checkout
  ↓
Test
  ↓
Jib Build
  ↓
Registry Push
  ↓
Deploy
  ↓
Health Check
```

예를 들어 GitHub Actions에서는 Build Server에서 Local Docker Image를 만든 뒤 tar로 복사하기보다 **Jib이 Registry로 직접 Push하고 운영 서버는 그 Tag를 Pull**하는 흐름이 단순하다.

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '11'

      - name: Build and push image
        run: ./gradlew jib --image=${{ secrets.REGISTRY }}/demo:${{ github.sha }}
```

실제 Registry 인증과 운영 서버 배포 방식은 환경에 맞춰 구성한다.

## 9. 배포 후 무엇을 확인하나

"Container가 Up"인 것과 "Application이 정상 서비스 중"인 것은 다르다.

```text
Container Process
   ↓
Spring Boot 기동
   ↓
DB 연결
   ↓
Health Endpoint
   ↓
Reverse Proxy
   ↓
외부 요청
```

따라서 최소한 다음을 확인한다.

```bash
docker compose ps
docker compose logs --tail=200 demo-app
```

그리고 Actuator Health Endpoint를 사용하는 환경이라면 실제 HTTP Health까지 확인한다.

관련 모니터링 구조는 [JHipster 모니터링 — Actuator·Prometheus·Grafana 스택 구성](/posts/spring-boot/2025-10-05-monitoring/)에서 이어진다.

## 정리

Jib 기반 배포는 도구 이름보다 단계의 책임을 구분하면 단순하다.

```text
Jib
→ Image Build

Registry / File
→ Image Delivery

Docker Compose
→ Runtime Assembly

CI/CD
→ 전체 흐름 자동화
```

이 구분을 잡아두면 Dockerfile 없이 Image를 만드는 문제, 운영 설정을 주입하는 문제, 여러 Container를 실행하는 문제, 배포를 자동화하는 문제를 한 설정 파일에 뒤섞지 않게 된다.

> 관련: [JHipster Docker 개요](/posts/spring-boot/2025-09-23-jhipster-docker-compose-overview/)

---
title       : Jib 을 이용한 JHipster 도커 이미지 빌드 및 배포
description : "Dockerfile 없이 Gradle Jib 블록만으로 JHipster 이미지를 빌드한다. 멀티 아키텍처·비 root 사용자·entrypoint.sh 권한까지 한 곳에서 선언하는 설정 예시."
date        : 2025-10-02 20:04:19 +0900
updated     : 2025-10-02 20:30:03 +0900
categories  : [spring-boot, "JHipster"]
tags        : [jhipster, gradle]
pin         : false
hidden      : false
---


## 📌 Jib 설정 코드
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
        creationTime = "USE_CURRENT_TIMESTAMP"
        user = 1000
    }
    extraDirectories {
      paths = file("src/main/docker/jib")
      permissions = ["/entrypoint.sh": "755"]
    }
}
````

---

## 🔹 설정 항목별 설명

### 1. `from { ... }`

* **기본 베이스 이미지**: `eclipse-temurin:11-jre-focal` (Java 11 JRE, Ubuntu focal 기반)
* **플랫폼 지정**:

  * `architecture`: Gradle 속성(`-PjibArchitecture=arm64`) 사용 가능. 기본값은 `amd64`.
  * `os`: `linux`.

---

### 2. `to { ... }`

* 빌드된 이미지를 `demo:latest` 태그로 저장.

---

### 3. `container { ... }`

* `entrypoint`: 컨테이너 실행 시 `/entrypoint.sh` 실행.
* `ports`: 컨테이너 포트 `8080` 노출.
* `environment`: > 환경 변수 설정
  * `SPRING_OUTPUT_ANSI_ENABLED=ALWAYS` → 스프링 로그 ANSI 색상 항상 활성화
  * `JHIPSTER_SLEEP=0` → 시작 대기 시간 없음
* `creationTime`: `"USE_CURRENT_TIMESTAMP"` (이미지 생성 시간을 현재 빌드 시각으로 지정)
* `user`: UID `1000`으로 실행 (root 사용자 회피)

---

### 4. `extraDirectories { ... }`

* `src/main/docker/jib` 디렉토리를 컨테이너에 복사.
* `/entrypoint.sh` 파일 권한을 `755`(실행 가능)으로 지정.

---

## 📌 요약

* **베이스 이미지**: `eclipse-temurin:11-jre-focal`
* **아키텍처**: 기본 `amd64`, 필요 시 `-PjibArchitecture=arm64`로 변경 가능
* **이미지 이름**: `demo:latest`
* **엔트리포인트**: `/entrypoint.sh`
* **포트**: `8080`
* **환경 변수**: Spring ANSI 로그 활성화, JHipster Sleep 0
* **실행 사용자**: UID 1000 (비 root)
* **추가 파일**: `src/main/docker/jib/entrypoint.sh` → `/entrypoint.sh` (권한 755)

---

## 로컬 환경 구성 및 실행

## 1. 도커 이미지 빌드
./gradlew jibDockerBuild

## 2. 앱 + 데이터베이스 실행
docker-compose -f src/main/docker/app.yml up -d

### 도커 레지트리 사용 시
## 1. Docker Hub에 이미지 푸시
./gradlew jib --to=docker.io/your-username/demo:latest

## 2. 운영 서버에서 이미지 풀
docker pull your-username/demo:latest

## 3. 컨테이너 실행
docker-compose -f docker-compose.prod.yml up -d

### docker-compose.prod.yml 예시
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  demo-app:
    image: demo:latest
    environment:
      - _JAVA_OPTIONS=-Xmx1024m -Xms512m
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:postgresql://demo-postgresql:5432/demo
      - SPRING_DATASOURCE_USERNAME=demo
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
    ports:
      - 8080:8080
    depends_on:
      - demo-postgresql
    restart: unless-stopped
    networks:
      - demo-network

  demo-postgresql:
    image: postgres:14.5
    environment:
      - POSTGRES_DB=demo
      - POSTGRES_USER=demo
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - 5432:5432
    restart: unless-stopped
    networks:
      - demo-network

  nginx:
    image: nginx:alpine
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
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


### 로그 관리
## 컨테이너 로그 확인
docker-compose logs -f demo-app

## 특정 시간대 로그
docker-compose logs --since="2024-01-01T00:00:00" demo-app

## 로그 파일로 저장
docker-compose logs demo-app > app.log


```yaml
## CI / CD 파이프라인 예시 (GitHub Actions)
# .github/workflows/docker-deploy.yml
name: Docker Deploy
on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker Image
        run: ./gradlew jibDockerBuild
      
      - name: Deploy to Server
        run: |
          # 이미지를 tar 파일로 저장
          docker save demo:latest | gzip > demo.tar.gz
          
          # 서버로 전송
          scp -P <port> demo.tar.gz <user>@<ip>:/home/<user>/
          
          # 서버에서 이미지 로드 및 실행
          ssh -l <user> -p <port> <ip> "
            docker load < /home/<user>/demo.tar.gz
            cd /home/<user>/demo
            docker-compose -f docker-compose.prod.yml up -d
          "
```

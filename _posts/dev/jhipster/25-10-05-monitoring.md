---
title       : JHipster 모니터링
description : 
date        : 2025-10-05 15:16:51 +0900
updated     : 2025-10-05 16:12:22 +0900
categories  : ["dev", "jhipster"]
tags        : ["jhipster", "monitoring", "prometheus", "grafana"]
pin         : false
hidden      : false
---

# 🔄 모니터링 3요소 연동 구조

## 1. Spring Boot Actuator (메트릭 생산자)

```yaml
# application.yml
management:
  endpoints:
    web:
      base-path: /management
      exposure:
        include: ['health', 'info', 'prometheus', 'metrics']
  metrics:
    export:
      prometheus:
        enabled: true
        step: 60
```

**역할**:

* 애플리케이션에서 메트릭 데이터를 생성하고 노출
* `/management/prometheus` 엔드포인트로 Prometheus 형식의 메트릭 제공
* JVM, HTTP, 시스템 메트릭 자동 수집

---

## 2. Prometheus (메트릭 수집 및 저장)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'prometheus'
    metrics_path: /management/prometheus
    static_configs:
      - targets: ['localhost:8080']
```

**역할**:

* Actuator에서 생성된 메트릭을 주기적으로 스크래핑 (기본 15초 간격)
* 메트릭 데이터를 시계열 데이터베이스에 저장
* PromQL로 데이터 분석 가능

---

## 3. Grafana (시각화 및 대시보드)

```yaml
# datasource.yml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://localhost:9090
```

**역할**:

* Prometheus에서 수집된 메트릭을 시각화
* JVM, HTTP, 시스템 메트릭 대시보드 제공
* 실시간 모니터링 및 알림 설정

---

## 🔗 데이터 흐름

```
Spring Boot App (Actuator)
        ↓ /management/prometheus
Prometheus (스크래핑)
        ↓ 메트릭 저장
Grafana (시각화)
```

---

## 📊 실제 모니터링되는 메트릭

### JVM 메트릭

* `jvm_memory_used_bytes` : 메모리 사용량
* `jvm_gc_pause_seconds` : 가비지 컬렉션 시간
* `jvm_threads_live` : 활성 스레드 수

### HTTP 메트릭

* `http_server_requests_seconds_count` : HTTP 요청 수
* `http_server_requests_seconds_sum` : 응답 시간 합계
* `http_server_requests_seconds_max` : 최대 응답 시간

### 시스템 메트릭

* `system_cpu_usage` : CPU 사용률
* `process_memory_rss_bytes` : 프로세스 메모리 사용량
* `process_open_fds` : 열린 파일 디스크립터 수

---

## 🚀 실행 방법

```bash
# 1. 애플리케이션 실행
./gradlew bootRun

# 2. 모니터링 스택 실행
docker-compose -f src/main/docker/monitoring.yml up -d
```

---

## 🌐 접근 URL

| 서비스            | URL                                                                                        | 설명        |
| -------------- | ------------------------------------------------------------------------------------------ | --------- |
| **Actuator**   | [http://localhost:8080/management/prometheus](http://localhost:8080/management/prometheus) | 메트릭 엔드포인트 |
| **Prometheus** | [http://localhost:9090](http://localhost:9090)                                             | 메트릭 수집기   |
| **Grafana**    | [http://localhost:3000](http://localhost:3000)                                             | 시각화 대시보드  |

---

✅ 이렇게 **Actuator → Prometheus → Grafana** 순서로 데이터가 흐르면서 완전한 모니터링 스택을 구성합니다.


---

## 🐳 Prometheus & Grafana Docker 설정 상세 분석

### 1. **Docker Compose 설정 (`monitoring.yml`)**

#### 🔍 **Prometheus 서비스**
```yaml
snuheras-prometheus:
  image: prom/prometheus:v2.38.0
  volumes:
    - ./prometheus/:/etc/prometheus/
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
  ports:
    - 127.0.0.1:9090:9090
  network_mode: 'host'
```

**주요 설정:**
- **이미지**: Prometheus v2.38.0 (안정 버전)
- **볼륨 마운트**: 로컬 `./prometheus/` → 컨테이너 `/etc/prometheus/`
- **포트**: 9090 (로컬호스트만 접근 가능)
- **네트워크**: `host` 모드 (로컬 서비스와 통신용)

#### 📊 **Grafana 서비스**
```yaml
snuheras-grafana:
  image: grafana/grafana:9.1.0
  volumes:
    - ./grafana/provisioning/:/etc/grafana/provisioning/
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
    - GF_USERS_ALLOW_SIGN_UP=false
    - GF_INSTALL_PLUGINS=grafana-piechart-panel
  ports:
    - 127.0.0.1:3000:3000
  network_mode: 'host'
```

**주요 설정:**
- **이미지**: Grafana 9.1.0
- **볼륨 마운트**: 로컬 `./grafana/provisioning/` → 컨테이너 `/etc/grafana/provisioning/`
- **환경변수**:
  - `GF_SECURITY_ADMIN_PASSWORD=admin`: 관리자 비밀번호
  - `GF_USERS_ALLOW_SIGN_UP=false`: 사용자 가입 비활성화
  - `GF_INSTALL_PLUGINS=grafana-piechart-panel`: 파이차트 플러그인 설치

### 2. **Prometheus 설정 (`prometheus.yml`)**

#### ⚙️ **글로벌 설정**
```yaml
global:
  scrape_interval: 15s      # 메트릭 수집 간격
  evaluation_interval: 15s  # 규칙 평가 간격
  external_labels:
    monitor: 'jhipster'     # 외부 라벨
```

#### 🎯 **스크래핑 설정**
```yaml
scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 5s                    # 5초마다 수집
    metrics_path: /management/prometheus    # Actuator 엔드포인트
    static_configs:
      - targets: ['localhost:8080']        # 타겟 애플리케이션
```

**수집되는 메트릭:**
- JVM 메트릭 (메모리, GC, 스레드)
- HTTP 메트릭 (요청 수, 응답 시간)
- 시스템 메트릭 (CPU, 메모리, 파일 디스크립터)

### 3. **Grafana 데이터소스 설정 (`datasource.yml`)**

#### 🔗 **Prometheus 연결 설정**
```yaml
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
    editable: true
```

**주요 설정:**
- **타입**: Prometheus
- **접근 방식**: Proxy (Grafana가 중계)
- **URL**: Prometheus 서버 주소
- **기본 데이터소스**: true
- **편집 가능**: true

### 4. **Grafana 대시보드 설정 (`dashboard.yml`)**

#### 📈 **대시보드 프로비저닝**
```yaml
providers:
  - name: 'Prometheus'
    orgId: 1
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

**설정 내용:**
- **조직 ID**: 1 (기본 조직)
- **타입**: 파일 기반
- **삭제 비활성화**: false
- **편집 가능**: true
- **경로**: `/etc/grafana/provisioning/dashboards`

### 5. **디렉토리 구조**

```
src/main/docker/
├── monitoring.yml                    # Docker Compose 설정
├── prometheus/
│   └── prometheus.yml               # Prometheus 설정
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── datasource.yml       # 데이터소스 설정
        └── dashboards/
            ├── dashboard.yml        # 대시보드 프로비저닝
            └── JVM.json            # JVM 메트릭 대시보드
```

### 6. **실행 방법**

#### 🚀 **모니터링 스택 시작**
```bash
# 모니터링 도구들 실행
docker-compose -f src/main/docker/monitoring.yml up -d

# 로그 확인
docker-compose -f src/main/docker/monitoring.yml logs -f

# 서비스 상태 확인
docker-compose -f src/main/docker/monitoring.yml ps
```

#### 🛑 **모니터링 스택 중지**
```bash
# 서비스 중지
docker-compose -f src/main/docker/monitoring.yml down

# 볼륨까지 삭제 (데이터 삭제)
docker-compose -f src/main/docker/monitoring.yml down -v
```

### 7. **네트워크 설정**

#### 🌐 **Host 네트워크 모드**
```yaml
network_mode: 'host'
```

**장점:**
- 로컬에서 실행 중인 애플리케이션과 직접 통신
- 포트 매핑 불필요
- 네트워크 성능 향상

**주의사항:**
- MacOS에서는 `host.docker.internal` 사용 필요
- 보안상 프로덕션에서는 사용 지양

### 8. **접근 URL 및 포트**

| 서비스 | URL | 포트 | 설명 |
|--------|-----|------|------|
| **Prometheus** | http://localhost:9090 | 9090 | 메트릭 수집기 |
| **Grafana** | http://localhost:3000 | 3000 | 시각화 대시보드 |
| **애플리케이션** | http://localhost:8080 | 8080 | 메트릭 제공자 |

### 9. **보안 고려사항**

#### 🔒 **개발 환경 설정**
- `127.0.0.1:` 접두사로 로컬 접근만 허용
- 기본 인증 없음 (개발용)
- Host 네트워크 모드 사용

#### 🚀 **프로덕션 환경 권장사항**
```yaml
# 프로덕션용 설정 예시
services:
  prometheus:
    ports:
      - "9090:9090"  # 127.0.0.1 제거
    networks:
      - monitoring
    environment:
      - PROMETHEUS_CONFIG_FILE=/etc/prometheus/prometheus.yml
```

이렇게 Docker를 통해 Prometheus와 Grafana가 완전히 자동화된 모니터링 스택을 구성하고 있습니다!

---
title       : Spring Boot Actuator 상세 설정 분석
description : 
date        : 2025-10-05 16:15:42 +0900
updated     : 2025-10-05 16:46:59 +0900
categories  : ["dev", "jhipster"]
tags        : ["jhipster", "spring boot", "actuator", "monitoring", "prometheus"]
pin         : false
hidden      : false
---

# Spring Boot Actuator + JHipster + Prometheus 설정 정리

## 1. 의존성 설정 (build.gradle)

```gradle
// Spring Boot Actuator
implementation "org.springframework.boot:spring-boot-starter-actuator"

// Prometheus 메트릭 수집
implementation "io.micrometer:micrometer-registry-prometheus"

// 추가 메트릭 라이브러리
implementation "io.dropwizard.metrics:metrics-core"
```

**설명:**

* `spring-boot-starter-actuator`: Actuator 핵심 기능 제공
* `micrometer-registry-prometheus`: Prometheus 형식 메트릭 출력
* `metrics-core`: 추가 메트릭 수집 기능

---

## 2. Actuator 엔드포인트 구조

### 2.1 웹 엔드포인트 (`management.endpoints.web`)

```yaml
management:
  endpoints:
    web:
      base-path: /management
      exposure:
        include:
          - configprops
          - env
          - health
          - info
          - jhimetrics
          - jhiopenapigroups
          - logfile
          - loggers
          - prometheus
          - threaddump
          - caches
          - liquibase
```

**핵심 포인트:**

* `base-path`: 모든 Actuator 엔드포인트의 공통 URL 경로
* `exposure.include`: 외부에 노출할 엔드포인트 선택
* 운영 환경에서는 최소 엔드포인트만 노출 권장

### 2.2 개별 엔드포인트 설정 (`management.endpoint.*`)

```yaml
management:
  endpoint:
    health:
      show-details: when_authorized  # 인증된 사용자만 상세 정보
      roles: 'ROLE_ADMIN'            # 관리자 권한 필요
      probes:
        enabled: true                # Kubernetes liveness/readiness 활성화
      group:
        liveness:
          include: livenessState
        readiness:
          include: readinessState, db
    jhimetrics:
      enabled: true                  # JHipster 메트릭 활성화
```

**설명:**

* `endpoint.health`: Health 엔드포인트 접근 권한, 상세 정보 노출, Kubernetes 프로브, 그룹핑 설정
* `endpoint.jhimetrics`: JHipster 메트릭 활성화 여부

---

## 3. 엔드포인트 내부 옵션

### 3.1 Health 엔드포인트

```yaml
management:
  health:
    mail:
      enabled: false  # Mail 서비스 헬스 체크 비활성화
```

### 3.2 Info 엔드포인트

```yaml
management:
  info:
    git:
      mode: full      # Git 상세 정보 제공
    env:
      enabled: true   # Spring 환경 변수 노출
```

### 3.3 Metrics 엔드포인트

```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true
        step: 60       # 60초마다 메트릭 갱신
    enable:
      http: true
      jvm: true
      logback: true
      process: true
      system: true
    distribution:
      percentiles-histogram:
        all: true
      percentiles:
        all: 0,0.5,0.75,0.95,0.99,1.0
    tags:
      application: ${spring.application.name}
    web:
      server:
        request:
          autotime:
            enabled: true  # HTTP 요청 시간 자동 측정
```

---

## 4. 접근 가능한 주요 엔드포인트

| 엔드포인트  | URL                      | 설명                |
| ------ | ------------------------ | ----------------- |
| 헬스 체크  | `/management/health`     | 애플리케이션 상태         |
| 메트릭    | `/management/prometheus` | Prometheus 형식 메트릭 |
| 정보     | `/management/info`       | 애플리케이션 정보         |
| 환경     | `/management/env`        | 환경 변수             |
| 스레드 덤프 | `/management/threaddump` | 스레드 상태            |
| 캐시     | `/management/caches`     | 캐시 정보             |
| 로그     | `/management/loggers`    | 로거 설정             |

---

## 5. 보안 설정

```yaml
management:
  endpoint:
    health:
      show-details: when_authorized
      roles: 'ROLE_ADMIN'
```

**보안 포인트:**

* 민감 정보는 인증된 사용자만 접근 가능
* 관리자 역할 필요
* 운영 환경에서 Prometheus 메트릭은 접근 제어 권장

---

## 6. 메트릭 수집 및 Prometheus 연동

### 6.1 JVM 메트릭 예시

```
jvm_memory_used_bytes{area="heap"}
jvm_gc_pause_seconds{action="end of minor GC"}
jvm_threads_live_threads
```

### 6.2 HTTP 메트릭 예시

```
http_server_requests_seconds_count{method="GET",status="200"}
http_server_requests_seconds_sum{method="GET",status="200"}
```

### 6.3 시스템 메트릭 예시

```
system_cpu_usage
process_memory_rss_bytes
process_open_fds
```

**데이터 흐름:**

```
Spring Boot Actuator → Micrometer → Prometheus → Grafana
```

---

## 7. 실행 및 테스트

```bash
# 애플리케이션 실행
./gradlew bootRun

# 헬스 체크
curl http://localhost:8080/management/health

# Prometheus 메트릭
curl http://localhost:8080/management/prometheus

# 애플리케이션 정보
curl http://localhost:8080/management/info
```

---

## 8. 전체 구조 요약

```
management
├─ endpoints.*        # 엔드포인트 전역 설정 (웹 노출, 경로)
├─ endpoint.*         # 개별 엔드포인트 세부 설정 (권한, 활성화, 그룹)
├─ metrics.*          # 메트릭 수집/내보내기/분포/태그
├─ info.*             # 애플리케이션 정보 노출
├─ health.*           # 헬스 체크 내부 옵션
├─ server.*           # 관리용 서버 포트/주소
├─ logfile.*          # 로그파일 노출
└─ 기타 custom 설정
```

**핵심 포인트:**

* `endpoint.*` → 엔드포인트 접근/활성화/그룹 설정
* `health/info/metrics` → 엔드포인트 내부 세부 기능 설정
* 운영 환경에서는 **권한 제어 + 필요한 메트릭만 활성화**
* Prometheus 연동 시 `micrometer-registry-prometheus` 필요

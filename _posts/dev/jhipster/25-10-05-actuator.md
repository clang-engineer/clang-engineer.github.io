---
title       : Spring Boot Actuator 상세 설정 분석
description : 
date        : 2025-10-05 16:15:42 +0900
updated     : 2025-10-05 16:17:41 +0900
categories  : ["dev", "jhipster"]
tags        : ["jhipster", "spring boot", "actuator", "monitoring", "prometheus"]
pin         : false
hidden      : false
---

## 🔧 Spring Boot Actuator 상세 설정 분석

### 1. **의존성 설정 (build.gradle)**

#### 📦 **핵심 의존성**
```gradle
// Spring Boot Actuator
implementation "org.springframework.boot:spring-boot-starter-actuator"

// Prometheus 메트릭 수집
implementation "io.micrometer:micrometer-registry-prometheus"

// 추가 메트릭 라이브러리
implementation "io.dropwizard.metrics:metrics-core"
```

**주요 라이브러리:**
- `spring-boot-starter-actuator`: Actuator 핵심 기능
- `micrometer-registry-prometheus`: Prometheus 형식 메트릭 출력
- `metrics-core`: 추가 메트릭 수집 기능

### 2. **Actuator 엔드포인트 설정**

#### 🎯 **노출된 엔드포인트**
```yaml
management:
  endpoints:
    web:
      base-path: /management
      exposure:
        include:
          - 'configprops'      # 설정 속성 정보
          - 'env'              # 환경 변수
          - 'health'            # 헬스 체크
          - 'info'              # 애플리케이션 정보
          - 'jhimetrics'        # JHipster 메트릭
          - 'jhiopenapigroups'  # API 그룹 정보
          - 'logfile'           # 로그 파일
          - 'loggers'           # 로거 설정
          - 'prometheus'        # Prometheus 메트릭
          - 'threaddump'        # 스레드 덤프
          - 'caches'           # 캐시 정보
          - 'liquibase'         # 데이터베이스 마이그레이션
```

### 3. **헬스 체크 설정**

#### 🏥 **헬스 체크 구성**
```yaml
management:
  endpoint:
    health:
      show-details: when_authorized  # 인증된 사용자만 상세 정보
      roles: 'ROLE_ADMIN'            # 관리자 역할 필요
      probes:
        enabled: true                # Kubernetes 프로브 활성화
      group:
        liveness:                   # 생존성 체크
          include: livenessState
        readiness:                   # 준비성 체크
          include: readinessState,db
```

**헬스 체크 그룹:**
- **Liveness**: 애플리케이션이 살아있는지 확인
- **Readiness**: 애플리케이션이 요청을 처리할 준비가 되었는지 확인
- **Database**: 데이터베이스 연결 상태 확인

### 4. **메트릭 설정**

#### 📊 **Prometheus 메트릭 설정**
```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true    # Prometheus 메트릭 활성화
        step: 60         # 60초 간격으로 메트릭 수집
    enable:
      http: true         # HTTP 메트릭
      jvm: true          # JVM 메트릭
      logback: true      # 로그백 메트릭
      process: true      # 프로세스 메트릭
      system: true       # 시스템 메트릭
    distribution:
      percentiles-histogram:
        all: true        # 모든 메트릭에 히스토그램 적용
      percentiles:
        all: 0, 0.5, 0.75, 0.95, 0.99, 1.0  # 백분위수 설정
    tags:
      application: ${spring.application.name}  # 애플리케이션 태그
    web:
      server:
        request:
          autotime:
            enabled: true  # HTTP 요청 시간 자동 측정
```

### 5. **정보 엔드포인트 설정**

#### ℹ️ **애플리케이션 정보**
```yaml
management:
  info:
    git:
      mode: full         # Git 정보 전체 노출
    env:
      enabled: true      # 환경 변수 정보 활성화
```

**노출되는 정보:**
- Git 커밋 정보
- 빌드 정보
- 환경 변수
- 설정 속성

### 6. **JHipster 특화 설정**

#### 🎯 **JHipster 메트릭**
```yaml
management:
  endpoint:
    jhimetrics:
      enabled: true      # JHipster 메트릭 활성화
```

**JHipster 메트릭 포함:**
- HTTP 요청 메트릭
- 데이터베이스 연결 풀 메트릭
- 캐시 메트릭
- 보안 메트릭

### 7. **환경별 설정 차이**

#### 🔧 **개발 환경 (application.yml)**
```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true    # Prometheus 메트릭 활성화
```

#### 🚀 **운영 환경 (application-prod.yml)**
```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: false   # 보안상 비활성화
```

### 8. **접근 가능한 엔드포인트**

#### 🌐 **주요 엔드포인트 URL**

| 엔드포인트 | URL | 설명 |
|-----------|-----|------|
| **헬스 체크** | `/management/health` | 애플리케이션 상태 |
| **메트릭** | `/management/prometheus` | Prometheus 형식 메트릭 |
| **정보** | `/management/info` | 애플리케이션 정보 |
| **환경** | `/management/env` | 환경 변수 |
| **스레드 덤프** | `/management/threaddump` | 스레드 상태 |
| **캐시** | `/management/caches` | 캐시 정보 |
| **로그** | `/management/loggers` | 로거 설정 |

### 9. **보안 설정**

#### 🔒 **인증 및 권한**
```yaml
management:
  endpoint:
    health:
      show-details: when_authorized  # 인증된 사용자만 상세 정보
      roles: 'ROLE_ADMIN'            # 관리자 역할 필요
```

**보안 고려사항:**
- 민감한 정보는 인증된 사용자만 접근
- 관리자 역할이 필요한 엔드포인트
- 프로덕션에서는 Prometheus 메트릭 비활성화

### 10. **메트릭 수집 예시**

#### 📈 **수집되는 메트릭 유형**

**JVM 메트릭:**
```
jvm_memory_used_bytes{area="heap"}
jvm_gc_pause_seconds{action="end of minor GC"}
jvm_threads_live_threads
```

**HTTP 메트릭:**
```
http_server_requests_seconds_count{method="GET",status="200"}
http_server_requests_seconds_sum{method="GET",status="200"}
```

**시스템 메트릭:**
```
system_cpu_usage
process_memory_rss_bytes
process_open_fds
```

### 11. **실행 및 테스트**

#### 🚀 **애플리케이션 실행**
```bash
./gradlew bootRun
```

#### 🧪 **엔드포인트 테스트**
```bash
# 헬스 체크
curl http://localhost:8080/management/health

# Prometheus 메트릭
curl http://localhost:8080/management/prometheus

# 애플리케이션 정보
curl http://localhost:8080/management/info
```

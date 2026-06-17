---
title       : "JHipster 모니터링 — Actuator·Prometheus·Grafana 스택 구성"
description : "Actuator가 /management/prometheus로 메트릭을 노출하고, Prometheus가 스크래핑해 시계열로 저장하고, Grafana가 시각화하는 3요소 연동 + Docker compose 구성을 한 번에 정리."
date        : 2025-10-05 15:16:51 +0900
updated     : 2026-06-17 10:00:00 +0900
categories  : [spring-boot, "모니터링·로깅"]
tags        : [jhipster, monitoring, prometheus, grafana, docker]
pin         : false
hidden      : false
---

JHipster 기준 모니터링 스택은 **Actuator(메트릭 생산) → Prometheus(스크래핑·저장) → Grafana(시각화)** 3단으로 구성된다. 각 구간의 설정 파일과 Docker compose까지 한 번에 본다.

Actuator 쪽 세부 설정(exposure 정책, health probes, 보안)은 [Spring Boot Actuator 상세 설정 분석](/posts/spring-boot/2025-10-05-actuator/) 글에서 별도로 다룬다. 이 글은 Actuator는 "메트릭이 나가는 엔드포인트"로만 다룬다.

## 1. 데이터 흐름

```
Spring Boot App (Actuator)
        |
        |  GET /management/prometheus
        v
Prometheus  ─ 스크래핑 + 시계열 저장 + PromQL 평가
        |
        |  HTTP query
        v
Grafana  ─ 대시보드·알림
```

스크래핑은 **pull 방식**(Prometheus가 시간 맞춰 가져옴)이라 애플리케이션 쪽엔 추가 outbound가 필요 없다. 그게 push형 모니터링(StatsD 등)과의 가장 큰 차이다.

## 2. Actuator 측 (메트릭 생산)

```yaml
# application.yml — 최소한의 노출만
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

`/management/prometheus`로 Prometheus 텍스트 포맷 메트릭이 나간다. JVM·HTTP·시스템 메트릭은 자동 수집된다. 세부 옵션(히스토그램, 보안, health probes)은 [Actuator 글](/posts/spring-boot/2025-10-05-actuator/) 참고.

## 3. Prometheus 측 (스크래핑·저장)

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: jhipster

scrape_configs:
  - job_name: 'app'
    scrape_interval: 5s
    metrics_path: /management/prometheus
    static_configs:
      - targets: ['localhost:8080']
```

- `scrape_interval` — 글로벌 기본 15초, job별 override 가능.
- `metrics_path` — Actuator의 `base-path + /prometheus`와 정확히 맞춰야 한다.
- `targets` — host:port 목록. Kubernetes 환경이면 service discovery로 대체.

## 4. Grafana 측 (시각화)

데이터소스를 Prometheus로 연결한다. 프로비저닝 파일로 자동 설정.

```yaml
# grafana/provisioning/datasources/datasource.yml
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
```

대시보드도 파일로 프로비저닝.

```yaml
# grafana/provisioning/dashboards/dashboard.yml
providers:
  - name: Prometheus
    orgId: 1
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards
```

`/etc/grafana/provisioning/dashboards/JVM.json` 같은 대시보드 JSON을 같이 마운트하면 첫 기동부터 차트가 떠 있다.

## 5. Docker Compose 스택

```yaml
# src/main/docker/monitoring.yml
services:
  myapp-prometheus:
    image: prom/prometheus:v2.38.0
    volumes:
      - ./prometheus/:/etc/prometheus/
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    ports:
      - 127.0.0.1:9090:9090
    network_mode: host

  myapp-grafana:
    image: grafana/grafana:9.1.0
    volumes:
      - ./grafana/provisioning/:/etc/grafana/provisioning/
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    ports:
      - 127.0.0.1:3000:3000
    network_mode: host
```

포인트:

- `127.0.0.1:` prefix로 **로컬 루프백만** 노출 — 외부 접근 차단.
- `network_mode: host` — 로컬에서 도는 Spring Boot 앱(8080)에 그대로 닿게 하기 위함. macOS에선 host 모드 대신 `host.docker.internal`을 target으로 써야 한다.
- 환경변수로 Grafana 초기 비밀번호/가입 정책 박아둠.

디렉토리 구조:

```
src/main/docker/
├── monitoring.yml
├── prometheus/
│   └── prometheus.yml
└── grafana/
    └── provisioning/
        ├── datasources/datasource.yml
        ├── dashboards/dashboard.yml
        └── dashboards/JVM.json
```

## 6. 실행

```bash
./gradlew bootRun                                            # 앱
docker-compose -f src/main/docker/monitoring.yml up -d        # 스택
docker-compose -f src/main/docker/monitoring.yml logs -f      # 로그
docker-compose -f src/main/docker/monitoring.yml down         # 중지
docker-compose -f src/main/docker/monitoring.yml down -v      # 볼륨까지 삭제
```

접근 URL:

| 서비스 | URL | 설명 |
| --- | --- | --- |
| 앱 (Actuator) | `http://localhost:8080/management/prometheus` | 메트릭 엔드포인트 |
| Prometheus | `http://localhost:9090` | 수집기 + PromQL UI |
| Grafana | `http://localhost:3000` | 대시보드 (admin/admin) |

## 7. 보는 메트릭

기본 자동 수집 항목.

```promql
# JVM
jvm_memory_used_bytes{area="heap"}
jvm_gc_pause_seconds{action="end of minor GC"}
jvm_threads_live

# HTTP
http_server_requests_seconds_count{method="GET", status="200"}
http_server_requests_seconds_sum{method="GET", status="200"}
http_server_requests_seconds_max{method="GET", status="200"}

# 시스템
system_cpu_usage
process_memory_rss_bytes
process_open_fds
```

`http_server_requests_seconds_*`는 Actuator의 `metrics.web.server.request.autotime: true`로 켜진다.

## 8. 프로덕션 메모

- 개발 compose는 `127.0.0.1:` + `host` 네트워크 + 인증 없음 — 프로덕션엔 그대로 못 쓴다.
- `127.0.0.1:` 떼고 별도 모니터링 네트워크에 붙이고, Grafana는 OIDC/LDAP 같은 SSO를 앞에 둔다.
- Actuator의 `/prometheus`는 nginx에서 사내 IP 화이트리스트로 막는 게 일반적이다.

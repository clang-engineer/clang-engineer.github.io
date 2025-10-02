---
title       : Jhipster Docker 개요
description : >- 
date        : 2025-03-06 09:00:45 +0900
updated     : 2025-10-02 20:32:25 +0900
categories  : [dev, jhipster]
tags        : [jhispter]
pin         : false
hidden      : false
---

## Docker 기본 구성 요소와 역할

- app.yml: 애플리케이션 컨테이너(snuheras)와 DB(PostgreSQL)를 함께 띄우는 컴포즈 파일
  - 앱이 :8080을 외부로 노출하고, DB는 :5432로 대기
  - 앱은 Spring Actuator를 통해 /management/prometheus 엔드포인트로 메트릭을 노출
- monitoring.yml: 모니터링 스택(Prometheus + Grafana)을 띄우는 컴포즈 파일
  - Prometheus: 정해진 타깃(애플리케이션)의 메트릭 엔드포인트를 주기적으로 “Pull” 방식으로 수집
  - Grafana: Prometheus를 데이터 소스로 삼아 대시보드 시각화
- prometheus/prometheus.yml: Prometheus가 스크레이핑할 대상 설정
  - 기본값: <http://localhost:8080/management/prometheus를> 주기적으로 수집
- grafana/provisioning/datasources/datasource.yml: Grafana가 접속할 데이터 소스 설정
  - 기본값: <http://localhost:9090의> Prometheus API
- grafana/provisioning/dashboards/\*: JVM/애플리케이션용 대시보드 자동 프로비저닝
- 선택 요소
  - zipkin.yml: 분산 추적(Tracing) 수집기
  - sonar.yml: 코드 품질 분석기(SonarQube)
  - jhipster-control-center.yml: JHipster Control Center(서비스 헬스/등록 관제)


## 포트 매핑

| 서비스 | 포트 | 접근 URL | 용도 |
|--------|------|----------|------|
| 애플리케이션 | 8080 | http://localhost:8080 | 메인 애플리케이션 |
| PostgreSQL | 5432 | localhost:5432 | 데이터베이스 |
| Prometheus | 9090 | http://localhost:9090 | 메트릭 수집기 |
| Grafana | 3000 | http://localhost:3000 | 대시보드 시각화 |
| SonarQube | 9001 | http://localhost:9001 | 코드 품질 분석기 |
| Zipkin | 9411 | http://localhost:9411 | 분산 추적  | 
| JHipster Control Center | 7419 | http://localhost:7419 | 마이크로서비스 관리 |


## 도커 로컬 환경 구성
```sh
docker-compose -f src/main/docker/app.yml up  # 애플리케이션 + 데이터베이스 실행
docker-compose -f src/main/docker/monitoring.yml up  # 모니터링 스택 실행
docker-compose -f src/main/docker/sonar.yml up  # 코드 품질 분석 실행
docker-compose -f src/main/docker/zipkin.yml up  # 분산 추적 실행
docker-compose -f src/main/docker/jhipster-control-center.yml up  # JHipster Control Center 실행
```

## 통신 흐름(데이터 흐름)

```
[사용자 브라우저] ─HTTP─> [Grafana:3000] ─HTTP(API)─> [Prometheus:9090]
                                            │
                                            └─(Pull)─> [앱:8080/management/prometheus]
[앱:8080] ─JDBC─> [PostgreSQL:5432]
(선택) [앱] ─HTTP─> [Zipkin:9411]
```

- 왜 Pull 모델(Prometheus)? 에이전트를 각 서비스에 넣는 Push 모델보다 운영 제어가 단순하고, 타깃 추가/제거가 쉬움.
- 왜 Micrometer+Prometheus? Spring 진영 표준 조합으로 계측 라이브러리(Micrometer)와 시계열 저장/질의 엔진(Prometheus)이 분리되어 유연함.
- 왜 Grafana? PromQL 기반 시계열을 대시보드/알림으로 빠르게 시각화 가능, 팀 공용 템플릿화 용이.

### 왜 이렇게 나눴나(설계 의도)

- 책임 분리: 앱은 비즈니스 로직과 메트릭 노출만 담당, 수집/보관/시각화는 외부 시스템이 담당
- 독립적 확장: 트래픽 증가 시 앱은 수평 확장, 메트릭 수집량 증가 시 Prometheus/Grafana를 별도로 스케일
- 이식성: 로컬/스테이징/운영에서 동일한 Docker 컴포즈 조합을 재사용

### 네트워킹 관점 포인트

- 포트 매핑: app.yml이 8080, postgres 5432; monitoring.yml이 9090(Prometheus), 3000(Grafana)를 호스트로 매핑
- 타깃 주소 지정: Prometheus가 “컨테이너 네트워크 관점”에서 앱을 어떻게 볼지 설정 필요
  - 로컬 맥/윈도에서는 localhost 대신 host.docker.internal을 쓰는 경우가 많음
  - 같은 Compose 네트워크에 둘 경우 서비스명(snuheras-app:8080)으로 접근하기도 함
- 보안/격리: 개발 편의를 위해 열린 포트/host 네트워크를 쓰지만, 운영에선 네트워크/인증/SSL을 별도 강화

### 운영에서의 의미

- 메트릭: 지연시간, 에러율, 스레드/GC, DB 커넥션 풀, 커스텀 비즈니스 카운터 등 추적
- 대시보드/경보: SLO/SLA, 장애 징후 조기 탐지, 추세 분석
- 추적(선택): Zipkin으로 요청 단위 지연 구간 파악
- 품질(선택): Sonar로 코드 품질/취약점 분석


## sonarqube
```sh
./gradlew test jacocoTestReport
./gradlew sonarqube -Dsonar.login=<token>

```

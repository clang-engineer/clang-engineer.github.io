---
title       : Kibana 개념 정리 — Saved Objects, Lens, Alerting, 7.x vs 8.x
description : "환경 간 대시보드 이전(Saved Objects), 차트 종류별 적합한 데이터, Index threshold·ES query 룰, 그리고 8.x 보안 기본 활성과 Index Pattern → Data View 변경."
date        : 2026-06-07 12:00:00 +0900
categories  : [db, "도구·연동"]
tags        : [kibana, elasticsearch, lens, alerting]
pin         : false
hidden      : false
---

Kibana를 쓰면서 한 번씩 정리가 필요한 부분 — Saved Objects 이전, Lens 시각화 선택, Alerting 룰, 그리고 7.x → 8.x 버전 차이.

## Saved Objects

Management → Stack Management → Saved Objects.

| 동작 | 설명 |
|------|------|
| Export | 대시보드/검색/시각화/Data View를 NDJSON으로 내보내기 |
| Import | 다른 환경으로 이전 시 `Include related objects` 체크 |
| Tags | 8.x 이상에서 saved object 태깅 |

> CI/CD나 환경 마이그레이션은 `GET kbn:/api/saved_objects/_export` API로 자동화 가능.

대시보드를 dev → staging → prod로 옮기거나, 버전 백업 시 사용한다. `Include related objects`를 켜야 Data View, Saved Search, Visualization 등 의존 객체가 함께 따라간다.

## Lens / Visualization — 어떤 차트를 언제 쓸까

| 시각화 | 적합한 데이터 |
|--------|---------------|
| Bar / Line | 시계열, 집계 비교 |
| Pie / Donut | 비율 (카테고리 5~7개 이하) |
| Data table | 집계 결과 표 |
| Metric | 단일 큰 숫자 |
| Heatmap | 두 차원 밀도 |
| Maps | geo_point 좌표 |
| TSVB | 복잡한 시계열 (다중 인덱스, %change 등) |

> Lens가 기본 권장. 복잡한 시계열 분석(다중 인덱스, % 변화율, 누적 등)은 여전히 TSVB가 강력.

## Alerting (Stack Alerts)

Management → Stack Management → Rules에서 룰을 만든다.

| 항목 | 설명 |
|------|------|
| Index threshold | 특정 집계가 임계값 초과 시 알림 |
| Elasticsearch query | KQL/DSL 결과 건수 기반 |
| Connectors | Slack, Email, Webhook, PagerDuty 등 |

운영 알림은 Index threshold(집계가 한계 넘으면)와 ES query(특정 패턴의 로그가 N건 이상이면)로 거의 다 커버된다. Connector는 한 번 등록해두면 여러 룰에서 재사용한다.

## 7.x vs 8.x — 주요 변경점

| 항목 | 7.x | 8.x |
|------|-----|-----|
| 데이터 뷰 명칭 | Index Pattern | Data View |
| 보안 기본값 | 옵션 | 기본 활성 (TLS, password 필수) |
| Fleet/Agent | 베타 | 기본 |
| Logs/Metrics UI | Observability 일부 | Observability 솔루션으로 통합 |
| Vega | 지원 | 지원 (Lens 권장으로 비중 ↓) |

8.x로 올리면 보안이 기본 활성이라 클라이언트(앱, beats, logstash)가 password 없이 붙던 상태면 모두 끊긴다. 업그레이드 전에 인증서 + 계정 작업이 선행되어야 한다.

Index Pattern → Data View로 이름이 바뀐 게 8.x 첫 진입 시 가장 헷갈리는 부분. 같은 개념이고 메뉴 위치만 Management → Data Views로 옮겨졌다.

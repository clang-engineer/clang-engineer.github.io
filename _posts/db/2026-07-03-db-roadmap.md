---
title       : "DB 로드맵 — 설계·동시성·성능·운영·분산, 다섯 질문으로 나눈 글 지도"
description : "DB 글을 '각 구역이 답하는 질문'으로 나눈다. 데이터를 어떻게 담나(설계) → 동시 접근을 어떻게 안전하게(트랜잭션·동시성) → 어떻게 빨리 읽나(성능) → 어떻게 살려두나(운영) → 여러 노드로 어떻게(분산). 기초 개념 지식은 정보관리기술사 Knowledge 영역에서, 블로그는 DBMS 구현·운영·튜닝·실전 사례 중심으로 연결한다."
date        : 2026-07-03 15:00:00 +0900
updated     : 2026-09-05 20:55:00 +0900
categories  : [db, "개요·인덱스"]
tags        : [roadmap, database, rdb, postgresql]
pin         : false
hidden      : false
---

DB 블로그는 기초 개념을 작은 글로 다시 복제하는 Knowledge Base가 아니라, **DBMS 구현·성능·운영·도구·실전 문제를 찾아가는 지도**로 둔다. 트랜잭션·인덱스 같은 기초 개념 자체는 정보관리기술사 Knowledge 영역에서 체계적으로 학습하고, 여기서는 그 개념이 실제 DBMS에서 어떻게 구현되고 운영 문제로 이어지는지를 다룬다.

```text
Knowledge
정보관리기술사
→ Transaction / Isolation / Lock / MVCC
→ B-Tree / B+Tree / Index 구조
→ DB 이론과 개념 관계

Practice / Blog
→ PostgreSQL MVCC / VACUUM
→ Query Plan / Tuning
→ Backup / Replication / Monitoring
→ Tool / Troubleshooting / 실전 설계
```

블로그 안에서는 다음 다섯 질문을 줄기로 사용한다.

| 구역 | 답하는 질문 | 블로그에서의 초점 |
|---|---|---|
| 설계 | 데이터를 어떻게 담나 | 실제 스키마·역정규화 판단 |
| 트랜잭션·동시성 | 동시 접근을 어떻게 안전하게 | DBMS 구현과 운영 |
| 성능 | 어떻게 빨리 읽나 | 실행계획·튜닝·캐시 |
| 운영 | 어떻게 살려두나 | 백업·복제·모니터링·업그레이드 |
| 분산 | 여러 노드로 어떻게 | 실제 분산 저장·확장 판단 |

## 설계 — 데이터를 어떻게 담나

| 글 | 핵심 |
|---|---|
| [정규화와 스키마 설계 — 1NF~BCNF와 역정규화](/posts/db/2026-07-03-database-normalization/) | 정규화 이론을 실제 스키마 설계와 역정규화 판단으로 연결 |
| [RECORD_ID를 레벨 테이블에 사전 적재해 조인 제거](/posts/db/2026-06-09-preload-record-id-to-level-table/) | 수천만 건 Fact Table JOIN을 INSERT 시점으로 옮긴 실전 설계 사례 |

정규화 자체가 Knowledge 영역으로 충분히 정리되면 첫 글도 중복 여부를 다시 판단한다. 두 번째 글은 실제 시스템 설계 사례이므로 별도 가치가 있다.

## 트랜잭션·동시성 — 동시 접근을 어떻게 안전하게

Isolation Level·Lock·2PL·MVCC 자체의 개념 체계는 정보관리기술사 세부학습에서 관리한다. 블로그에서는 특정 DBMS 구현과 그 운영 결과에 집중한다.

| 글 | 핵심 |
|---|---|
| [MVCC와 VACUUM](/posts/db/2026-07-03-mvcc-vacuum/) | PostgreSQL의 xmin/xmax·Snapshot·Dead Tuple과 VACUUM/autovacuum/wraparound이라는 구현·운영 문제 |

```text
Knowledge
Isolation / Lock / MVCC
        ↓
PostgreSQL 구현
xmin / xmax / Snapshot
        ↓
운영 결과
Dead Tuple / Bloat / VACUUM
```

따라서 삭제한 `isolation-level` 블로그 Concept을 다시 별도 글로 만들지 않는다.

## 성능 — 어떻게 빨리 읽나

| 글 | 핵심 |
|---|---|
| [RDB 조인(Join) 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) | Nested Loop·Hash·Sort-Merge와 Optimizer 선택 기준. 기술사 Knowledge에 상세 본문이 생기면 중복 여부 재검토 |
| [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) | Index 구조를 실제 조회·복합 Index·Covering Index·Full Scan 판단으로 연결. 기술사 Index 문서와 대조 대상 |
| [쿼리 옵티마이저 작동 원리와 실행계획(EXPLAIN) 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | Optimizer의 비용 판단과 실제 EXPLAIN/ANALYZE 튜닝 |
| [실행계획(EXPLAIN) 노드·필드 사전](/posts/db/2026-07-03-postgresql-explain-node-reference/) | PostgreSQL 실행계획을 실제로 읽기 위한 Reference |
| [쿼리 튜닝 — 페이지네이션·N+1](/posts/db/2026-07-03-query-tuning-pagination-nplus1/) | OFFSET·Keyset Pagination·ORM N+1 실전 문제 |
| [테이블 파티셔닝](/posts/db/2026-07-03-table-partitioning/) | Partition Pruning과 대용량 운영 설계 |
| [DBCP — HikariCP 커넥션 풀 사이징](/posts/db/2024-03-06-dbcp/) | 애플리케이션 Connection Pool과 DB Connection 한계의 조율 |
| [DB 앞단 캐싱 전략 — Redis](/posts/db/2026-07-03-caching-strategy-redis/) | Cache-Aside·무효화·정합성·Stampede 등 실전 Cache Layer 설계 |

> 📎 **치트시트** · [sql-snippets](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/sql-snippets.md) — information_schema·인덱스·튜닝 실전 SQL 빠른 참조 (GitHub)
{: .prompt-tip }

## 운영 — 어떻게 살려두나

| 글 | 핵심 |
|---|---|
| [pg_dump / pg_restore 사용법](/posts/db/2025-01-14-postgresql-pgdump/) | 논리 Backup/Restore 실전 사용 |
| [PITR와 백업 전략](/posts/db/2026-07-03-postgresql-pitr-backup/) | WAL Archiving·pg_basebackup·RPO/RTO |
| [복제와 고가용성](/posts/db/2026-07-03-postgresql-replication-ha/) | PostgreSQL Streaming Replication·Lag·Failover |
| [모니터링 — pg_stat·슬로우 쿼리](/posts/db/2026-07-03-postgresql-monitoring/) | pg_stat 계열과 pg_stat_statements를 이용한 운영 관측 |
| [PostgreSQL 메이저 업그레이드 14→17](/posts/db/2026-07-03-postgresql-major-upgrade/) | pg_upgrade와 Dump/Restore의 실제 Upgrade 절차 |
| [PostgreSQL 마운트 경로(PGDATA) 변경](/posts/db/2024-10-16-postgresql-change-mount-path/) | Data Disk 이전을 위한 일회성 운영 절차 |

## 분산 — 여러 노드로 어떻게

이 구역은 기술사 Knowledge와 중복 가능성이 높은 영역이다. 현재 블로그 글을 바로 삭제하지 않고, 기술사 세부학습에 동등한 상세 본문이 생기는 순서대로 대조한다.

| 글 | 핵심 |
|---|---|
| [CAP 정리 — P는 고르는 게 아니라 주어진다](/posts/db/2026-07-03-cap-theorem/) | CAP·PACELC 개념. Knowledge 영역과 향후 통합 후보 |
| [분산 DB 확장 — 샤딩·분산 트랜잭션·합의](/posts/db/2026-07-03-distributed-db-scaling/) | Sharding·2PC·Saga·Raft. Knowledge 영역과 향후 통합 후보 |
| [NoSQL 개요 — 문서·키밸류·컬럼·그래프](/posts/db/2026-07-03-nosql-overview/) | NoSQL Model과 RDB 선택 기준. Knowledge 영역과 향후 통합 후보 |

## 도구·연동

| 글 | 핵심 |
|---|---|
| [MyBatis 사용 패턴 기록](/posts/db/2021-11-22-mybatis/) | 실제 사용 중 마주친 Mapping Pattern |
| [JPA/ORM 핵심 — 영속성 컨텍스트·지연 로딩·N+1](/posts/db/2026-07-03-jpa-persistence-context/) | ORM 동작과 실제 Application 문제 |
| [Liquibase 설정과 사용 패턴](/posts/db/2025-10-17-liquibase/) | Schema Migration 실무 Pattern |
| [Kibana 개념 정리 — Saved Objects·Lens·Alerting](/posts/db/2026-06-07-kibana-saved-objects-lens-alerting/) | Kibana 사용·운영 관점의 정리 |

## Troubleshooting

| 글 | 핵심 |
|---|---|
| [IntelliJ DB SSH 터널 — JDBC URL 주의점](/posts/db/2026-04-29-intellij-ssh-tunnel-jdbc-url/) | SSH Tunnel 환경의 JDBC 연결 문제 |
| [ORA-12514 리스너 서비스 오류](/posts/db/2026-07-03-oracle-ora-12514/) | Oracle Listener Service 등록 문제 |
| [Vertica에서 OR 조건 JOIN은 성능을 죽인다](/posts/db/2026-04-15-vertica-or-join-kills-performance/) | 실제 Vertica Join Filter 성능 장애와 해결 |

## 탐색 기준

```text
개념 자체를 알고 싶다
→ 정보관리기술사 Knowledge

PostgreSQL에서 어떻게 구현되는지 궁금하다
→ DB Blog

실행계획·튜닝·운영 방법이 필요하다
→ DB Blog

특정 오류를 해결해야 한다
→ Troubleshooting
```

블로그의 Concept 성격 글은 기술사 Knowledge가 채워지는 순서대로 계속 대조해 중복을 줄인다.

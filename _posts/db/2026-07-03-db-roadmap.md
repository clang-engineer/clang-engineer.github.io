---
title       : "DB 로드맵 — 트랜잭션 원리·성능 설계·운영·분산 이론 글을 어떻게 읽을까"
description : "트랜잭션 동시성과 조인 원리 → 커넥션 풀·조인 회피 같은 성능 설계 → PostgreSQL 운영(경로 이전·백업·메이저 업그레이드) → CAP 분산 이론 → MyBatis·Liquibase·Kibana 도구 연동 → 연결·성능 장애 트러블슈팅까지, 이 블로그의 DB 글 15편을 단계별로 큐레이션."
date        : 2026-07-03 15:00:00 +0900
updated     : 2026-07-03 15:00:00 +0900
categories  : [db, "개요·인덱스"]
tags        : [roadmap, database, rdb, postgresql]
pin         : false
hidden      : false
---

DB는 "쿼리 짜는 법"에서 멈추기 쉽다. 그런데 한 겹만 걷어내면 — 트랜잭션이 왜 이상 현상을 막는지, 옵티마이저가 조인 전략을 어떻게 고르는지, 커넥션 수를 무엇으로 정하는지, 운영 중 데이터를 어떻게 옮기고 올리는지 — 서비스의 안정성과 성능이 갈린다. 이 블로그의 DB 글 15편을 그 층위대로 묶었다. 본인 위치에서 가까운 단계부터 진입하면 된다.

## 원리 — 트랜잭션과 조인

쿼리를 던지기 전에, DB 엔진이 동시 트랜잭션을 어떻게 다루고 테이블을 어떻게 이어 붙이는지부터. 여기가 흔들리면 이후 성능·설계 판단이 다 감으로 흐른다.

| 글 | 핵심 |
|---|---|
| [트랜잭션 동시성 제어 — 격리 수준과 락](/posts/db/2024-05-03-isolation-level/) | Schedule·Serializability, S/X Lock과 2PL, READ COMMITTED·REPEATABLE READ·SERIALIZABLE이 각각 막아주는 이상 현상을 한 흐름으로 |
| [RDB 조인(Join) 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) | Nested Loop·Hash·Sort-Merge의 원리·시간 복잡도·메모리 패턴, 옵티마이저가 테이블 크기·인덱스·정렬 상태로 전략을 고르는 기준 |
| [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) | B+tree 구조가 조회를 `O(log N)`으로 만드는 원리, 복합 인덱스 선두 컬럼 규칙, 커버링 인덱스, 그리고 인덱스를 만들고도 풀스캔이 도는 흔한 이유들 |

여기까지면 "왜 같은 쿼리가 어떤 날은 느린가", "격리 수준을 왜 올리고 내리나" 같은 판단에 근거가 생긴다.

## 성능 — 최적화와 설계

원리를 잡았으면, 성능이 실제로 갈리는 두 지점 — 커넥션을 몇 개나 열지, 무거운 조인을 아예 없앨 수 있는지.

| 글 | 핵심 |
|---|---|
| [DBCP — HikariCP 커넥션 풀 사이징](/posts/db/2024-03-06-dbcp/) | `minimumIdle`·`maximumPoolSize`·`maxLifetime`이 DB의 `max_connections`·`wait_timeout`과 맞물리는 방식, 적정 커넥션 수를 부하 테스트로 찾는 흐름 |
| [RECORD_ID를 레벨 테이블에 사전 적재해 조인 제거](/posts/db/2026-06-09-preload-record-id-to-level-table/) | 수천만 건 팩트 테이블 JOIN을 INSERT 시점에 미리 옮겨 조회 시 JOIN 자체를 없애는 설계. 위 조인 원리의 "회피" 각도 |

조인 원리(위)를 알고 나면, 사전 적재가 왜 "옵티마이저를 이기는" 게 아니라 "옵티마이저가 일할 필요를 없애는" 설계인지 읽힌다.

## 운영 — PostgreSQL 실무

설계가 끝나도 DB는 살아 움직인다. 디스크를 옮기고, 백업을 뜨고, 버전을 올리는 — 운영 중 마주치는 세 관문.

| 글 | 핵심 |
|---|---|
| [PostgreSQL 마운트 경로(PGDATA) 변경](/posts/db/2024-10-16-postgresql-change-mount-path/) | 데이터 디스크 분리·이전을 위해 PGDATA를 옮기는 절차. 서비스 중지 → 디렉토리 이동 → systemd `Environment=PGDATA` 수정 → 재시작 → `SHOW data_directory` 확인 |
| [pg_dump / pg_restore 사용법](/posts/db/2025-01-14-postgresql-pgdump/) | plain/custom/directory/tar 포맷 선택 기준, psql로는 plain만 복원되는 이유, `pg_restore`의 병렬(`-j`)·선택 복원(`-n`/`-t`) |
| [PostgreSQL 메이저 업그레이드 14→17](/posts/db/2026-07-03-postgresql-major-upgrade/) | 왜 바이너리 교체만으로 안 되는지, `pg_upgrade --link` vs dump/restore 트레이드오프, encoding·locale 관문과 `--check`→실행 절차 |

## 이론 — 분산 시스템

단일 DB를 넘어 여러 노드로 갈 때 반드시 부딪히는 이론. 실무 결정(어떤 스토어를 고를지)의 밑그림이 된다.

| 글 | 핵심 |
|---|---|
| [CAP 정리 — P는 고르는 게 아니라 주어진다](/posts/db/2026-07-03-cap-theorem/) | CAP은 셋 중 둘 고르기가 아니라 파티션 발생 시 일관성·가용성 중 무엇을 살릴지의 문제. CA/CP/AP의 실제 의미와 PACELC까지 |

## 도구·연동

DB 자체가 아니라 그 주변 — 매핑, 마이그레이션, 시각화. 애플리케이션과 DB를 잇는 레이어.

| 글 | 핵심 |
|---|---|
| [MyBatis 사용 패턴 기록](/posts/db/2021-11-22-mybatis/) | 시퀀스 채번, 1:N 컬렉션 매핑, `${}` vs `#{}` 차이, Map 동적 컬럼 바인딩 등 실사용 중 마주친 패턴들 |
| [Liquibase 설정과 사용 패턴](/posts/db/2025-10-17-liquibase/) | `master.xml` 구성, changeset 작성 규칙, CSV·타임스탬프 처리 등 스키마 마이그레이션 실무 패턴 |
| [Kibana 개념 정리 — Saved Objects·Lens·Alerting](/posts/db/2026-06-07-kibana-saved-objects-lens-alerting/) | 환경 간 대시보드 이전(Saved Objects), 차트별 적합 데이터, Index threshold·ES query 룰, 7.x→8.x 변화 |

## 트러블슈팅 — 연결·성능 장애

실력 향상 흐름과 분리해 둔다. 특정 상황에서 막혔을 때 직행하는 글들.

| 글 | 핵심 |
|---|---|
| [IntelliJ DB SSH 터널 — JDBC URL 주의점](/posts/db/2026-04-29-intellij-ssh-tunnel-jdbc-url/) | 내장 SSH 터널 사용 시 JDBC URL에 localhost가 아니라 베스천에서 본 원격 주소를 넣어야 하는 이유 |
| [ORA-12514 리스너 서비스 오류](/posts/db/2026-07-03-oracle-ora-12514/) | 리스너까지는 붙었는데 서비스 이름이 없어 나는 오류를 PMON 동적 등록부터 `lsnrctl` 진단까지 |
| [Vertica에서 OR 조건 JOIN은 성능을 죽인다](/posts/db/2026-04-15-vertica-or-join-kills-performance/) | LEFT OUTER JOIN의 ON 절 OR가 Join Filter로 빠지며 풀스캔이 나는 문제와 UNION ALL 분리 해법. 위 조인 원리의 "장애" 각도 |

---

본인 위치에 따라:

- **쿼리는 짜지만 엔진 동작이 흐릿하다면** 원리 두 글로 트랜잭션·조인부터.
- **성능이 어디서 갈리는지 감을 잡고 싶다면** 성능 단계 — 커넥션 사이징과 조인 회피 설계.
- **운영 중 디스크 이전·백업·업그레이드가 닥쳤다면** PostgreSQL 운영 세 글로 직행.
- **분산 스토어 선택의 밑그림이 필요하다면** CAP 정리.
- **MyBatis·Liquibase·Kibana를 붙이는 중이라면** 도구·연동.
- **특정 에러(ORA-12514, SSH 터널, Vertica 조인)로 막혔다면** 트러블슈팅 글로 바로.

조인은 이 카테고리를 관통한다 — [원리](/posts/db/2026-01-04-rdb-join-strategy/)로 전략을 이해하고, [사전 적재](/posts/db/2026-06-09-preload-record-id-to-level-table/)로 회피하고, [Vertica 사례](/posts/db/2026-04-15-vertica-or-join-kills-performance/)로 장애를 피한다. 세 각도를 함께 보면 조인을 입체적으로 다룰 수 있다.

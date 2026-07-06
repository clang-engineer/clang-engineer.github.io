---
title       : "DB 로드맵 — 설계·동시성·성능·운영·분산, 다섯 질문으로 나눈 글 지도"
description : "DB 글 28편을 '각 구역이 답하는 질문' 하나로 갈랐다. 데이터를 어떻게 담나(설계) → 동시 접근을 어떻게 안전하게(트랜잭션·동시성) → 어떻게 빨리 읽나(성능) → 어떻게 살려두나(운영) → 여러 노드로 어떻게(분산). 추상 대 응용으로 나누지 않고 질문으로 나눠, 한 글이 두 구역에 걸치지 않게 했다. 애플리케이션 연동과 장애 트러블슈팅은 결이 다른 축이라 부록으로 분리."
date        : 2026-07-03 15:00:00 +0900
updated     : 2026-07-06 09:00:00 +0900
categories  : [db, "개요·인덱스"]
tags        : [roadmap, database, rdb, postgresql]
pin         : false
hidden      : false
---

DB는 "쿼리 짜는 법"에서 멈추기 쉽다. 그런데 한 겹만 걷어내면 — 데이터를 어떻게 담고, 동시 트랜잭션을 어떻게 안전하게 다루고, 어떻게 빨리 읽고, 운영 중 어떻게 살려두고, 여러 노드로 어떻게 확장하는지 — 서비스의 안정성과 성능이 갈린다. 이 블로그의 DB 글 28편을 그 다섯 질문으로 묶었다. 본인 위치에서 가까운 구역부터 진입하면 된다.

**나눈 기준은 "추상이냐 응용이냐"가 아니라 "무슨 질문에 답하느냐"다.** 인덱스를 *이해하는* 것과 *거는* 것을 원리·성능으로 찢으면 경계가 흐려진다 — 둘 다 "어떻게 빨리 읽나"라는 한 질문의 답이기 때문이다. 그래서 구역마다 질문을 하나씩 걸고, 그 질문에 답하는 글만 넣었다. 한 글이 두 구역에 걸치지 않는다.

**설계 → 동시성 → 성능 → 운영 → 분산**이 데이터를 다루는 자연스러운 흐름이자 실력이 쌓이는 학습 척추다. 애플리케이션과 DB를 잇는 **도구·연동**, 그리고 특정 장애 **트러블슈팅**은 이 질문들 어디에도 안 들어가는 결이 다른 축이라 아래 **부록**으로 분리했다 — 학습 흐름과 별개로, 필요할 때 찾아 들어오면 된다.

**전제와 범위** — 이 로드맵은 `SELECT`·`JOIN`·`GROUP BY` 같은 기본 SQL은 쓸 줄 안다고 보고 그 위층부터 시작한다. 두 갈래는 의도적으로 척추 밖에 뒀다: 윈도우 함수·CTE·재귀 쿼리 같은 **SQL 작성 심화**(*어떻게 작성하나*는 여기서 안 다루고, *어떻게 실행·튜닝하나*만 성능 구역에서 짚는다), 그리고 heap/page 레이아웃·buffer·WAL 같은 **저장 엔진 물리 내부**(인덱스·MVCC 글이 필요한 만큼만 걸치고, 그 자체를 독립 구역으로 두진 않았다).

## 한눈에 보기

다섯 구역은 각각 질문 하나에 답한다. 이 질문이 곧 "이 글이 왜 여기 있나"의 답이다. 부록은 이 질문들 밖의 다른 축이다.

| 구역 | 답하는 질문 | 성격 |
|---|---|---|
| 설계 | 데이터를 어떻게 담나 | 척추 |
| 트랜잭션·동시성 | 동시 접근을 어떻게 안전하게 | 척추 |
| 성능 | 어떻게 빨리 읽나 | 척추 |
| 운영 | 어떻게 살려두나 | 척추 |
| 분산 | 여러 노드로 어떻게 | 척추 |
| 부록 A | 도구·연동 — MyBatis·JPA·Liquibase·Kibana | 다른 축 |
| 부록 B | 연결·성능 장애 트러블슈팅 | 다른 축 |

## 설계 — 데이터를 어떻게 담나

무엇을 최적화하기 전에, 데이터를 어떤 모양으로 담을지부터. 스키마를 잘못 잡으면 이후의 모든 쿼리·성능 판단이 그 위에서 흔들린다. 정규화로 이상 현상을 없애고, 필요하면 의도적으로 되돌리는(역정규화) 트레이드오프가 이 구역의 전부다.

| 글 | 핵심 |
|---|---|
| [정규화와 스키마 설계 — 1NF~BCNF와 역정규화](/posts/db/2026-07-03-database-normalization/) | 함수 종속으로 이해하는 정규형이 이상 현상을 없애는 원리와, 읽기 성능을 위해 조인을 줄이는 역정규화 트레이드오프 |
| [RECORD_ID를 레벨 테이블에 사전 적재해 조인 제거](/posts/db/2026-06-09-preload-record-id-to-level-table/) | 수천만 건 팩트 테이블 JOIN을 INSERT 시점에 미리 옮겨 조회 시 JOIN 자체를 없애는 설계. 위 역정규화 트레이드오프를 극단까지 민 실전 사례 |

정규화로 "왜 나누는가"를 잡고, 사전 적재로 "언제 되돌리는가"를 본다. 설계는 이 둘 사이의 판단이다.

## 트랜잭션·동시성 — 동시 접근을 어떻게 안전하게

여러 트랜잭션이 같은 데이터를 동시에 건드릴 때 무엇이 깨지고, DB가 그걸 어떻게 막는지. 성능을 논하기 전에 서야 하는 정합성의 토대다 — 격리 수준이 무엇을 막아주는지 모르면 이후 튜닝은 "빠른데 틀린" 결과로 흐른다.

| 글 | 핵심 |
|---|---|
| [트랜잭션 동시성 제어 — 격리 수준과 락](/posts/db/2024-05-03-isolation-level/) | Schedule·Serializability, S/X Lock과 2PL, READ COMMITTED·REPEATABLE READ·SERIALIZABLE이 각각 막아주는 이상 현상을 한 흐름으로 |
| [MVCC와 VACUUM](/posts/db/2026-07-03-mvcc-vacuum/) | 격리 수준이 xmin/xmax·스냅샷으로 구현되는 방식과, 그 대가인 dead tuple·bloat를 청소하는 VACUUM·autovacuum·wraparound |

격리 수준이 "무엇을 막나"라면, MVCC는 "그걸 어떻게 구현하나", VACUUM은 "그 구현의 대가를 어떻게 치르나"다. 격리·MVCC·VACUUM이 한 흐름의 동시성 이야기다.

## 성능 — 어떻게 빨리 읽나

여기가 실무 시간의 대부분이 쏠리는 구역이다. 엔진이 테이블을 어떻게 이어 붙이고 인덱스로 찾고 실행 계획을 세우는지(원리)부터, 그 원리를 근거로 파티셔닝·쿼리·커넥션·캐시를 다루는 데(응용)까지 — "빨리 읽기"라는 한 질문의 답이라 한 구역에 뒀다.

| 글 | 핵심 |
|---|---|
| [RDB 조인(Join) 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) | Nested Loop·Hash·Sort-Merge의 원리·시간 복잡도·메모리 패턴, 옵티마이저가 테이블 크기·인덱스·정렬 상태로 전략을 고르는 기준 |
| [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) | B+tree 구조가 조회를 `O(log N)`으로 만드는 원리, 복합 인덱스 선두 컬럼 규칙, 커버링 인덱스, 그리고 인덱스를 만들고도 풀스캔이 도는 흔한 이유들 |
| [쿼리 옵티마이저 작동 원리와 실행계획(EXPLAIN) 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | 비용 기반 옵티마이저가 통계로 카디널리티를 추정해 계획을 고르는 원리, EXPLAIN/ANALYZE로 추정과 실제의 괴리를 읽어 튜닝 |
| [실행계획(EXPLAIN) 노드·필드 사전](/posts/db/2026-07-03-postgresql-explain-node-reference/) | EXPLAIN에 뜨는 스캔·조인·집계·정렬 노드와 Buffers·Heap Fetches·Sort Method 계측 라인을 찾아보는 레퍼런스. 위 옵티마이저 글의 짝 |
| [쿼리 튜닝 — 페이지네이션·N+1](/posts/db/2026-07-03-query-tuning-pagination-nplus1/) | OFFSET이 깊은 페이지에서 느려지는 이유와 keyset 대안, ORM에서 흔한 N+1을 조인·배치 로딩으로 없애기 |
| [테이블 파티셔닝](/posts/db/2026-07-03-table-partitioning/) | Range·List·Hash로 대용량 테이블을 나누고 파티션 프루닝으로 스캔량을 줄이는 설계. 오래된 파티션 DROP으로 대량 삭제를 순식간에 |
| [DBCP — HikariCP 커넥션 풀 사이징](/posts/db/2024-03-06-dbcp/) | `minimumIdle`·`maximumPoolSize`·`maxLifetime`이 DB의 `max_connections`·`wait_timeout`과 맞물리는 방식, 적정 커넥션 수를 부하 테스트로 찾는 흐름 |
| [DB 앞단 캐싱 전략 — Redis](/posts/db/2026-07-03-caching-strategy-redis/) | Cache-Aside·Write-Through 패턴과 무효화, DB-캐시 정합성, 스탬피드·침투·핫키 장애 대응 |

> 📎 **치트시트** · [sql-snippets](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/sql-snippets.md) — information_schema·인덱스·튜닝 실전 SQL 빠른 참조 (GitHub)
{: .prompt-tip }

조인·인덱스·옵티마이저로 "엔진이 어떻게 찾나"를 잡으면, 파티셔닝·쿼리 튜닝이 왜 그렇게 동작하는지, 커넥션·캐시를 앞단에 어떻게 두는지가 원리 위에서 읽힌다. 설계 구역의 사전 적재가 왜 "옵티마이저를 이기는" 게 아니라 "옵티마이저가 일할 필요를 없애는" 설계인지도 여기 조인 원리를 알아야 보인다.

## 운영 — 어떻게 살려두나

설계·성능이 끝나도 DB는 살아 움직인다. 백업을 걸고, 원하는 시점으로 되돌리고, 복제로 이중화하고, 지표를 보고, 버전을 올리는 — 운영 중 마주치는 관문들. 정석 순서(백업 → 시점 복구 → 복제 → 모니터링 → 업그레이드)로 뒀고, 일회성 작업인 마운트 경로 이전은 맨 뒤에 부수적으로 둔다.

| 글 | 핵심 |
|---|---|
| [pg_dump / pg_restore 사용법](/posts/db/2025-01-14-postgresql-pgdump/) | plain/custom/directory/tar 포맷 선택 기준, psql로는 plain만 복원되는 이유, `pg_restore`의 병렬(`-j`)·선택 복원(`-n`/`-t`) |
| [PITR와 백업 전략](/posts/db/2026-07-03-postgresql-pitr-backup/) | pg_dump 논리 백업을 넘어 WAL 아카이빙·pg_basebackup으로 원하는 시점으로 복구하는 PITR과 RPO/RTO 설계 |
| [복제와 고가용성](/posts/db/2026-07-03-postgresql-replication-ha/) | 스트리밍 복제가 WAL을 standby로 흘려보내는 원리, 동기·비동기 트레이드오프, 읽기 복제본의 replication lag, failover 승격 |
| [모니터링 — pg_stat·슬로우 쿼리](/posts/db/2026-07-03-postgresql-monitoring/) | pg_stat_activity·user_tables·pg_stat_statements로 느린 쿼리·안 쓰는 인덱스·dead tuple·복제 지연을 잡기 |
| [PostgreSQL 메이저 업그레이드 14→17](/posts/db/2026-07-03-postgresql-major-upgrade/) | 왜 바이너리 교체만으로 안 되는지, `pg_upgrade --link` vs dump/restore 트레이드오프, encoding·locale 관문과 `--check`→실행 절차 |
| [PostgreSQL 마운트 경로(PGDATA) 변경](/posts/db/2024-10-16-postgresql-change-mount-path/) | 데이터 디스크 분리·이전을 위해 PGDATA를 옮기는 절차. 서비스 중지 → 디렉토리 이동 → systemd `Environment=PGDATA` 수정 → 재시작 → `SHOW data_directory` 확인. 상시 관문이 아니라 디스크를 옮길 때만 찾는 일회성 작업 |

## 분산 — 여러 노드로 어떻게

단일 DB를 넘어 여러 노드로 갈 때 반드시 부딪히는 이론. 실무 결정(어떤 스토어를 고를지)의 밑그림이 된다.

| 글 | 핵심 |
|---|---|
| [CAP 정리 — P는 고르는 게 아니라 주어진다](/posts/db/2026-07-03-cap-theorem/) | CAP은 셋 중 둘 고르기가 아니라 파티션 발생 시 일관성·가용성 중 무엇을 살릴지의 문제. CA/CP/AP의 실제 의미와 PACELC까지 |
| [분산 DB 확장 — 샤딩·분산 트랜잭션·합의](/posts/db/2026-07-03-distributed-db-scaling/) | 샤드 키로 여러 노드에 나눌 때의 원자성 문제를 2PC·Saga로, 복제 노드의 동의를 Raft로 — CAP 이후의 실무 확장 |
| [NoSQL 개요 — 문서·키밸류·컬럼·그래프](/posts/db/2026-07-03-nosql-overview/) | 네 가지 NoSQL 데이터 모델과 적합 사례, ACID vs BASE·최종 일관성, 스키마·조인·확장 기준으로 RDB와 고르기 |

---

## 부록 A — 도구·연동 (다른 축)

여기서부터는 위 다섯 질문 어디에도 안 들어가는 **다른 축**이다 — 애플리케이션과 DB를 잇는 매핑(MyBatis·JPA)·마이그레이션(Liquibase), 그리고 성격이 또 다른 데이터 관측·시각화(Elasticsearch/Kibana). 학습 흐름과 분리해, 해당 도구를 붙일 때 찾아 들어오면 된다.

| 글 | 핵심 |
|---|---|
| [MyBatis 사용 패턴 기록](/posts/db/2021-11-22-mybatis/) | 시퀀스 채번, 1:N 컬렉션 매핑, `${}` vs `#{}` 차이, Map 동적 컬럼 바인딩 등 실사용 중 마주친 패턴들 |
| [JPA/ORM 핵심 — 영속성 컨텍스트·지연 로딩·N+1](/posts/db/2026-07-03-jpa-persistence-context/) | 영속성 컨텍스트의 1차 캐시·변경 감지, 지연 로딩 프록시, N+1을 fetch join·@EntityGraph·@BatchSize로 없애기. MyBatis와 대비되는 ORM 접근 |
| [Liquibase 설정과 사용 패턴](/posts/db/2025-10-17-liquibase/) | `master.xml` 구성, changeset 작성 규칙, CSV·타임스탬프 처리 등 스키마 마이그레이션 실무 패턴 |
| [Kibana 개념 정리 — Saved Objects·Lens·Alerting](/posts/db/2026-06-07-kibana-saved-objects-lens-alerting/) | 환경 간 대시보드 이전(Saved Objects), 차트별 적합 데이터, Index threshold·ES query 룰, 7.x→8.x 변화 |

> 📎 **치트시트** · [kibana](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/kibana.md) · [elasticsearch](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/elasticsearch.md) — KQL·Dev Tools / ES 쿼리·관리 빠른 참조 (GitHub)
{: .prompt-tip }

## 부록 B — 트러블슈팅 (다른 축)

학습 척추와 분리해 둔다. 특정 에러·성능 장애로 막혔을 때 직행하는 글들.

| 글 | 핵심 |
|---|---|
| [IntelliJ DB SSH 터널 — JDBC URL 주의점](/posts/db/2026-04-29-intellij-ssh-tunnel-jdbc-url/) | 내장 SSH 터널 사용 시 JDBC URL에 localhost가 아니라 베스천에서 본 원격 주소를 넣어야 하는 이유 |
| [ORA-12514 리스너 서비스 오류](/posts/db/2026-07-03-oracle-ora-12514/) | 리스너까지는 붙었는데 서비스 이름이 없어 나는 오류를 PMON 동적 등록부터 `lsnrctl` 진단까지 |
| [Vertica에서 OR 조건 JOIN은 성능을 죽인다](/posts/db/2026-04-15-vertica-or-join-kills-performance/) | LEFT OUTER JOIN의 ON 절 OR가 Join Filter로 빠지며 풀스캔이 나는 문제와 UNION ALL 분리 해법. 성능 구역 조인 원리의 "장애" 각도 |

---

본인 위치에 따라:

- **테이블을 어떻게 나눌지 감이 안 잡히면** 설계 구역 — 정규화와 역정규화 트레이드오프부터.
- **동시 트랜잭션이 데이터를 깨뜨릴까 불안하면** 트랜잭션·동시성 — 격리 수준·MVCC·VACUUM.
- **쿼리가 왜 느린지, 어떻게 빠르게 할지가 급하면** 성능 구역 — 조인·인덱스·옵티마이저 원리 위에 파티셔닝·튜닝·커넥션·캐싱.
- **운영 중 백업·복제·모니터링·업그레이드가 닥쳤다면** 운영 구역으로 직행.
- **분산 스토어 선택·확장의 밑그림이 필요하다면** 분산 구역 — CAP·샤딩·NoSQL.
- **MyBatis·JPA·Liquibase·Kibana를 붙이는 중이라면** 부록 A(도구·연동).
- **특정 에러(ORA-12514, SSH 터널, Vertica 조인)로 막혔다면** 부록 B(트러블슈팅)로 바로.

조인은 이 세 구역을 관통한다 — [성능](/posts/db/2026-01-04-rdb-join-strategy/)에서 전략을 이해하고, [설계](/posts/db/2026-06-09-preload-record-id-to-level-table/)에서 회피하고, [부록 B의 Vertica 사례](/posts/db/2026-04-15-vertica-or-join-kills-performance/)로 장애를 피한다. 세 각도를 함께 보면 조인을 입체적으로 다룰 수 있다.

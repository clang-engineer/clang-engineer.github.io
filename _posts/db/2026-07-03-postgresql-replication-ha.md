---
title       : "PostgreSQL 복제와 고가용성 — 스트리밍 복제·읽기 복제본·failover"
description : "PostgreSQL 스트리밍 복제가 WAL을 standby로 흘려보내는 원리, 동기·비동기 트레이드오프, 읽기 복제본의 replication lag, 그리고 failover 승격과 복제 지연 모니터링."
date        : 2026-07-03 16:50:00 +0900
updated     : 2026-07-03 16:50:00 +0900
categories  : [db, "PostgreSQL·운영"]
tags        : [postgresql, replication, high-availability]
pin         : false
hidden      : false
---

DB 서버 한 대는 언젠가 죽는다. 디스크가 나가거나, 커널 패닉이 나거나, AZ 전체가 내려간다. 단일 인스턴스로 운영하면 그 순간 서비스가 멈추고, 마지막 백업 이후의 데이터가 날아간다. PostgreSQL의 복제(replication)는 primary의 변경을 다른 서버로 실시간 흘려보내 이 문제를 푼다. 이 글은 스트리밍 복제의 동작 원리부터 동기·비동기 선택, 읽기 복제본의 함정, 그리고 장애 시 승격까지 운영 관점으로 정리한다. 기준은 PostgreSQL 16/17이다.

## 1. 왜 복제인가

복제는 세 가지 목적을 동시에 만족한다.

- **고가용성(HA)**: primary가 죽으면 standby를 primary로 승격(promote)해 서비스를 이어간다. 복구 시간을 분 단위로 줄인다.
- **읽기 부하 분산**: standby에서 읽기 쿼리를 받아 primary의 부하를 덜어낸다. 리포트·검색처럼 무거운 SELECT를 복제본으로 몰 수 있다.
- **백업·재해복구(DR)**: 물리적으로 떨어진 위치에 복제본을 두면 데이터센터 단위 장애에도 데이터가 살아남는다. 백업 작업을 복제본에서 돌려 primary I/O를 아낀다.

세 목적은 겹치지만 요구사항이 다르다. HA는 데이터 손실 최소화(RPO)와 빠른 승격(RTO)을 원하고, 읽기 분산은 지연(lag)을 신경 쓰고, DR은 지리적 분리와 지속성을 본다. 어느 쪽에 무게를 둘지가 뒤에 나올 동기/비동기 선택을 가른다.

## 2. 스트리밍 복제의 원리

PostgreSQL의 모든 변경은 먼저 **WAL(Write-Ahead Log)**에 기록된다. 스트리밍 복제는 이 WAL을 그대로 이용한다.

1. primary가 트랜잭션을 처리하며 WAL 레코드를 생성한다.
2. standby가 `primary_conninfo`로 primary의 WAL 발신 프로세스(walsender)에 접속한다.
3. primary는 WAL을 **실시간으로** standby에 스트리밍한다. standby의 walreceiver가 이를 받는다.
4. standby는 받은 WAL을 **재생(replay)**해 자신의 데이터 파일에 그대로 반영한다.

이것이 **physical replication**이다. WAL은 "테이블 orders에 이 값을 INSERT"가 아니라 "블록 X의 바이트 오프셋 Y를 이렇게 바꿔라" 수준의 물리적 변경을 담는다. 그래서 standby는 primary와 **바이트 단위로 동일한 복제본**이 된다. 전체 클러스터가 통째로 복제되며, 일부 테이블만 고를 수 없다.

설정의 핵심은 다음과 같다.

```ini
# primary — postgresql.conf
wal_level = replica          # 스트리밍 복제에 필요한 최소 수준
max_wal_senders = 10         # 동시 walsender(복제본 + 백업) 상한
```

standby는 primary의 베이스 백업(`pg_basebackup`)으로 초기화한 뒤, `standby.signal` 빈 파일을 데이터 디렉토리에 두어 복구 모드로 부팅한다. PostgreSQL 12부터 복제 설정은 별도 `recovery.conf`가 아니라 `postgresql.conf`(또는 `postgresql.auto.conf`)에 들어간다.

```ini
# standby — postgresql.auto.conf
primary_conninfo = 'host=10.0.0.1 port=5432 user=replicator'
primary_slot_name = 'standby1'   # 복제 슬롯 사용 시
```

> 스트리밍 복제 = primary가 WAL을 실시간으로 흘려보내고 standby가 그대로 재생해 바이트 단위로 동일한 복제본을 유지하는 것. 클러스터 전체가 대상이며, 부분 복제는 불가능하다.

## 3. 동기 vs 비동기 복제

기본값은 **비동기(asynchronous)** 복제다. primary는 로컬 WAL에 커밋을 기록하면 즉시 클라이언트에 성공을 반환하고, standby로의 전송은 그와 무관하게 뒤따른다. 빠르지만, primary가 커밋을 반환한 직후 죽으면 아직 standby에 도달하지 못한 트랜잭션은 **사라진다**.

**동기(synchronous)** 복제는 이 데이터 손실 창을 닫는다. `synchronous_standby_names`에 지정된 standby가 WAL을 확인할 때까지 primary가 커밋을 **대기**한다. 동작 강도는 `synchronous_commit`으로 조절한다.

| `synchronous_commit` | primary가 커밋 반환 전 기다리는 조건 | 데이터 손실 위험 | 지연 |
| --- | --- | --- | --- |
| `off` | 로컬 WAL 디스크 flush조차 기다리지 않음 | 로컬 크래시 시 일부 손실 | 가장 낮음 |
| `local` | 로컬 WAL flush만 (standby 무시) | primary 손실 시 미전송분 손실 | 낮음 |
| `on` (기본) | 로컬 flush + (동기 standby 지정 시) standby WAL flush | 없음(동기 standby 존재 시) | 중간 |
| `remote_write` | standby가 WAL을 OS에 write(디스크 flush 전) | standby OS 크래시 시 손실 가능 | 중간 |
| `remote_apply` | standby가 WAL을 **재생 완료**까지 | 없음 | 가장 높음 |

`remote_apply`는 커밋이 반환되는 순간 그 변경을 동기 standby에서 읽어도 보이도록 보장한다. 읽기 복제본의 stale read를 원천 차단하지만, 재생까지 기다리므로 primary 쓰기 지연이 가장 크다.

동기 복제의 함정: 동기 standby가 하나뿐인데 그 standby가 죽으면, primary는 확인을 받을 수 없어 **모든 쓰기가 멈춘다**. 그래서 동기 복제를 쓸 땐 동기 후보 standby를 여러 대 두거나(`ANY 1 (s1, s2)` 같은 정족수 설정), 손실을 감수하고 비동기로 자동 강등하는 운영 정책을 함께 설계한다.

> 비동기는 빠르지만 primary 장애 시 마지막 몇 트랜잭션을 잃을 수 있다. 동기는 손실 0(RPO=0)을 보장하는 대신 쓰기 지연이 늘고, 동기 standby가 죽으면 primary가 멈출 수 있다. 금융처럼 손실이 치명적이면 동기, 대부분의 웹 서비스는 비동기가 현실적이다.

## 4. 읽기 복제본(hot standby)

`hot_standby = on`(PostgreSQL 기본값)이면 standby는 WAL을 재생하는 동안에도 **읽기 전용 쿼리**를 받는다. 이 상태의 standby를 hot standby, 실무에서는 읽기 복제본이라 부른다. 애플리케이션은 쓰기를 primary로, 읽기를 복제본으로 라우팅해 부하를 나눈다.

주의할 것은 **replication lag(복제 지연)**이다. standby의 재생은 primary보다 항상 조금 뒤처진다. 그 결과 **stale read**가 생긴다. 사용자가 글을 쓰고(primary) 바로 목록을 조회했는데(복제본) 방금 쓴 글이 안 보이는 식이다. 비동기 복제에서는 이 지연이 네트워크·부하 상황에 따라 수 초까지 벌어질 수 있다.

대응책:

- **읽기-쓰기 일관성이 필요한 경로는 primary로**. "쓰고 바로 읽는" 흐름(내 게시글, 결제 확인)은 복제본으로 보내지 않는다.
- **lag 기반 라우팅**: 지연이 임계치를 넘은 복제본은 라우팅 풀에서 뺀다.
- 강한 일관성이 필수면 3절의 `synchronous_commit = remote_apply`를 고려하되, 쓰기 지연 비용을 감수한다.

또 하나, standby의 긴 읽기 쿼리와 primary의 VACUUM이 충돌하면 **쿼리가 취소**될 수 있다(recovery conflict). `hot_standby_feedback = on`으로 두면 standby가 실행 중인 쿼리 정보를 primary에 보내 필요한 튜플을 미리 청소하지 않게 막지만, 대신 primary에서 테이블 부풀림(bloat)이 늘 수 있다. 트레이드오프다.

## 5. Failover와 승격(promote)

primary가 죽으면 standby 하나를 새 primary로 올려야 한다. 이것이 **failover**이고, standby를 primary로 바꾸는 동작이 **promote**다.

수동 승격은 standby에서 다음 중 하나를 실행한다.

```bash
pg_ctl promote -D /var/lib/postgresql/data
```

```sql
SELECT pg_promote();
```

승격되면 standby는 복구 모드를 벗어나 쓰기를 받는 정상 primary가 된다. 다만 수동 failover에는 사람이 개입해야 하므로 RTO가 길고, 밤중 장애에 취약하다. 그래서 운영에서는 **자동 failover 도구**를 얹는다.

- **Patroni** — etcd/Consul 같은 분산 합의 저장소로 클러스터 상태를 관리하고, primary 장애를 감지해 남은 standby 중 가장 앞선 것을 자동 승격한다. Kubernetes·베어메탈 모두에서 사실상 표준.
- **repmgr** — PostgreSQL 전용의 가벼운 복제·failover 관리 도구.
- 클라우드 관리형(AWS RDS/Aurora, Cloud SQL 등)은 자체 failover를 내장한다.

자동 failover의 핵심 위험은 **split-brain** — 옛 primary가 죽은 줄 알고 새 primary를 세웠는데 옛 primary가 되살아나 둘 다 쓰기를 받는 상황이다. Patroni는 분산 합의로 "한 시점에 primary는 하나"를 강제하고, 승격 시 옛 primary를 격리(fencing)해 이를 막는다. 자동화를 직접 짜기 어려운 이유가 여기 있고, 검증된 도구를 쓰는 게 정답이다.

failover 후 남은 standby들은 새 primary를 바라보게 재설정해야 한다. PostgreSQL 17은 물리 standby로 논리 복제 슬롯을 동기화하는 기능(`sync_replication_slots`)을 도입해, 승격 후 논리 구독자가 끊기지 않고 새 primary에서 이어받을 수 있게 개선했다 — 16에는 없던 내장 메커니즘이다.

## 6. 논리 복제와의 차이

지금까지의 스트리밍 복제는 물리 복제다. PostgreSQL은 **논리 복제(logical replication)**도 제공하며, 목적이 다르다.

| | 물리 복제(스트리밍) | 논리 복제 |
| --- | --- | --- |
| 단위 | 클러스터 전체 (통째로) | 테이블/행 단위로 선택 |
| 전송 내용 | WAL의 물리적 블록 변경 | 논리적 변경(INSERT/UPDATE/DELETE 행) |
| 버전 | primary·standby 동일 major 필요 | **서로 다른 major 간 가능** |
| standby 쓰기 | 읽기 전용 | 구독 측에서 쓰기·인덱스·다른 스키마 가능 |
| 구조 | primary → standby (`wal_level=replica`) | publication/subscription (`wal_level=logical`) |

논리 복제를 선택하는 전형적 경우:

- **무중단 major 업그레이드**: PG 16 → 17을 논리 복제로 데이터를 흘리며 전환해 다운타임을 줄인다.
- **부분 복제**: 특정 테이블만 분석 DB나 데이터 웨어하우스로 보낸다.
- **이기종 통합**: 여러 소스 DB의 일부 테이블을 한 곳으로 모은다.

반대로 **HA·DR·전체 읽기 복제본이 목표라면 물리 복제**가 맞다. 클러스터 전체를 최소 오버헤드로, 바이트 단위 동일하게 유지하기 때문이다. 논리 복제는 유연하지만 DDL이 자동 전파되지 않고 오버헤드가 크다.

## 7. 실무 — 지연 모니터링과 슬롯

### 복제 지연 보기: pg_stat_replication

primary에서 이 뷰를 조회하면 연결된 복제본과 각 단계별 지연을 볼 수 있다.

```sql
SELECT client_addr,
       state,                       -- streaming 이면 정상
       sync_state,                  -- async / sync / quorum
       write_lag, flush_lag, replay_lag,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_bytes
FROM pg_stat_replication;
```

- `state`가 `streaming`이면 정상 스트리밍 중이다.
- `replay_lag`은 primary 커밋 시점 대비 standby가 재생을 끝내기까지의 시간 지연이다. stale read의 크기를 가늠하는 지표다.
- `replay_bytes`(LSN 차이)로 얼마나 많은 WAL이 아직 재생 안 됐는지 바이트로 본다.

이 값을 알람에 걸어 지연이 튀면 감지하고, 임계치를 넘은 복제본은 읽기 라우팅에서 빼는 게 표준이다.

### WAL 보존: replication slot

비동기 복제본이 잠깐 끊겼다 돌아왔을 때, primary가 그 사이 필요한 WAL을 이미 지웠다면 복제본은 재동기화 불가 상태가 된다(`pg_basebackup`부터 다시). **복제 슬롯(replication slot)**은 이를 막는다. 슬롯은 "이 복제본이 아직 못 받은 WAL"을 primary가 함부로 삭제하지 못하게 표시한다.

```sql
-- primary에서 물리 복제 슬롯 생성
SELECT pg_create_physical_replication_slot('standby1');

-- 슬롯 상태와 보존 중인 WAL 확인
SELECT slot_name, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
```

standby는 `primary_slot_name`으로 이 슬롯을 지정해 접속한다. 슬롯의 대가는 위험과 짝을 이룬다 — 복제본이 오래 죽어 있으면 primary가 WAL을 계속 쌓아 **디스크가 가득 찰 수 있다**. `max_slot_wal_keep_size`(PG 13+)로 보존 상한을 걸어, 그 이상이면 슬롯을 무효화하고 디스크를 보호한다. 슬롯을 쓰되 상한과 함께 쓰는 게 실무 기본이다.

> 운영의 두 축: `pg_stat_replication`으로 지연을 상시 감시하고, 복제 슬롯으로 WAL 유실을 막되 `max_slot_wal_keep_size`로 디스크 폭주를 막는다.

## 관련 글

| 글 | 관계 |
| --- | --- |
| [PostgreSQL PITR와 백업 전략](/posts/db/2026-07-03-postgresql-pitr-backup/) | 같은 WAL을 백업·시점복구에 쓰는 법 |
| [PostgreSQL 모니터링 — pg_stat 뷰와 슬로우 쿼리 추적](/posts/db/2026-07-03-postgresql-monitoring/) | pg_stat_replication으로 복제 지연 보기 |

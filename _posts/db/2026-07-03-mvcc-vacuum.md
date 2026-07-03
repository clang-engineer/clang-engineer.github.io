---
title       : "MVCC와 VACUUM — 격리 수준은 어떻게 구현되고 왜 청소가 필요한가"
description : "PostgreSQL이 xmin/xmax와 스냅샷으로 MVCC를 구현해 읽기·쓰기 충돌을 없애는 원리, 그 대가인 dead tuple·bloat, 그리고 VACUUM·autovacuum·wraparound freeze가 하는 일."
date        : 2026-07-03 16:20:00 +0900
updated     : 2026-07-03 16:20:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [mvcc, vacuum, postgresql, isolation]
pin         : false
hidden      : false
---

격리 수준은 이론이지만, 실제 DB는 그 이론을 어떤 방식으로든 구현해야 한다. PostgreSQL의 답은 MVCC다. 읽는 쪽과 쓰는 쪽이 서로를 막지 않게 각 행의 여러 버전을 동시에 유지한다. 우아하지만 공짜는 아니다. 낡은 버전이 계속 쌓이고, 그걸 치우지 않으면 테이블이 부풀고 심하면 DB가 멈춘다. 이 글은 MVCC가 격리 수준을 구현하는 원리부터, 그 대가인 bloat, 그리고 청소부인 VACUUM까지를 한 줄로 잇는다.

## 1. MVCC란 — 읽기가 쓰기를 막지 않는다

전통적인 락 기반 동시성 제어에서는 한 트랜잭션이 행을 읽는 동안 다른 트랜잭션이 그 행을 쓰지 못한다(공유 락 vs 배타 락). 읽기와 쓰기가 서로를 차단하므로, 조회가 많은 시스템에서 쓰기가 대기하거나 그 반대가 된다.

MVCC(Multi-Version Concurrency Control, 다중 버전 동시성 제어)는 발상을 바꾼다. 행을 덮어쓰지 않고 **새 버전을 추가**한다. 그러면 이미 조회 중인 트랜잭션은 옛 버전을 그대로 보고, 새 트랜잭션은 새 버전을 본다.

> 핵심 원칙: **읽기는 쓰기를 막지 않고, 쓰기는 읽기를 막지 않는다.** 읽기 일관성을 락이 아니라 "버전 선택"으로 보장한다.

| 구분 | 락 기반 | MVCC |
| --- | --- | --- |
| 읽기 중 쓰기 | 차단됨 | 허용됨 |
| 일관성 보장 | 락 유지 | 스냅샷으로 버전 선택 |
| 대가 | 락 경합·대기 | 옛 버전 누적(공간) |

같은 행을 동시에 **쓰는** 경우는 여전히 행 단위 락으로 직렬화된다. MVCC가 없애는 것은 읽기-쓰기 충돌이지, 쓰기-쓰기 충돌이 아니다.

## 2. PostgreSQL 구현 — xmin/xmax와 스냅샷

PostgreSQL은 모든 트랜잭션에 단조 증가하는 트랜잭션 ID(txid, XID)를 부여한다. 그리고 각 행 버전(튜플)의 헤더에 두 개의 시스템 컬럼을 숨겨 둔다.

- `xmin` — 이 튜플을 **생성한**(INSERT 또는 UPDATE) 트랜잭션의 XID
- `xmax` — 이 튜플을 **삭제·갱신한** 트랜잭션의 XID (아직 살아 있으면 0)

실제로 조회할 수 있다.

```sql
SELECT xmin, xmax, * FROM accounts WHERE id = 1;
```

UPDATE는 제자리 수정이 아니다. **옛 튜플의 `xmax`에 자기 XID를 찍고, 새 값을 담은 새 튜플을 추가**한다. DELETE는 새 튜플 없이 `xmax`만 찍는다. 즉 갱신·삭제된 옛 버전은 물리적으로 즉시 사라지지 않고 "죽은(dead) 튜플"로 남는다.

### 가시성(visibility)은 스냅샷이 판단한다

트랜잭션은 시작 시점(또는 문장 시작 시점)에 **스냅샷**을 뜬다. 스냅샷은 대략 "그 순간 이미 커밋된 트랜잭션은 어디까지인가, 아직 실행 중인 트랜잭션은 무엇인가"를 담는다. 어떤 튜플이 내게 보이는지는 이렇게 결정된다.

```text
튜플이 보인다 ⇔
  xmin 트랜잭션이 내 스냅샷 기준 커밋됨  (생성이 확정)
  그리고
  xmax가 0이거나, xmax 트랜잭션이 내 스냅샷 기준 아직 커밋 안 됨  (삭제가 미확정)
```

같은 물리 행에 버전이 여러 개 있어도, 각 트랜잭션은 자기 스냅샷 규칙으로 정확히 하나의 버전만 "본다". 이것이 락 없이 읽기 일관성을 만드는 메커니즘이다. 참고로 페이지 전체가 모든 트랜잭션에 보이는 경우를 표시하는 **visibility map**이 있어, 이런 검사를 통째로 건너뛰고 index-only scan을 가능하게 한다.

## 3. 격리 수준과의 연결 — 스냅샷을 언제 찍는가

MVCC가 격리 수준을 구현하는 핵심은 결국 **스냅샷을 뜨는 시점**이다.

| 격리 수준 | 스냅샷 시점 | 결과 |
| --- | --- | --- |
| Read Committed (기본값) | **문장(statement)마다** 새로 | 매 쿼리가 최신 커밋을 반영 → non-repeatable read 가능 |
| Repeatable Read | **트랜잭션 첫 문장에서 한 번** | 트랜잭션 내내 같은 스냅샷 → 반복 조회 결과 고정 |

Read Committed에서는 문장을 실행할 때마다 스냅샷을 새로 뜨므로, 같은 트랜잭션 안에서 같은 행을 두 번 읽어도 그 사이 다른 트랜잭션이 커밋했다면 값이 달라질 수 있다.

Repeatable Read는 트랜잭션이 처음 데이터를 건드릴 때 스냅샷을 한 번 뜨고 끝까지 고정한다. 그래서 트랜잭션 내내 세상이 얼어붙은 것처럼 보인다. PostgreSQL의 Repeatable Read는 표준의 Repeatable Read보다 강해 phantom read까지 막는다(스냅샷 격리). 격리 수준의 이론적 배경은 아래 관련 글에서 다룬다.

> 스냅샷 시점만 바꿔서 서로 다른 격리 수준을 만든다 — 이것이 MVCC가 격리를 "구현"하는 방식이다.

## 4. Dead tuple과 bloat — MVCC의 대가

우아함에는 청구서가 따라온다. UPDATE·DELETE가 남긴 옛 튜플은 **어떤 살아 있는 트랜잭션도 더 이상 보지 않게 되는 순간** 완전히 쓸모없어진다. 이걸 dead tuple이라 한다.

문제는 이 죽은 튜플이 **디스크에서 자동으로 사라지지 않는다**는 점이다. 계속 쌓이면:

- **테이블 bloat** — 유효 데이터는 그대로인데 파일 크기가 계속 커진다. 순차 스캔이 죽은 공간까지 읽어 느려진다.
- **인덱스 bloat** — 인덱스에도 옛 튜플을 가리키는 엔트리가 남아 부푼다.
- **캐시 효율 저하** — 같은 데이터를 담는 데 더 많은 페이지가 필요해 버퍼 캐시 적중률이 떨어진다.

갱신이 잦은 테이블(큐, 카운터, 세션 등)일수록 bloat가 빠르게 쌓인다. 그래서 누군가는 죽은 튜플을 주기적으로 회수해야 한다. 그 청소부가 VACUUM이다.

## 5. VACUUM — 죽은 튜플 회수

`VACUUM`은 dead tuple이 차지하던 공간을 **테이블 내부에서 재사용 가능하게** 표시한다. 이후 INSERT·UPDATE가 그 공간을 다시 쓴다.

```sql
VACUUM accounts;              -- 일반 VACUUM: 락 최소, 공간을 내부 재사용용으로 회수
VACUUM (VERBOSE, ANALYZE) accounts;  -- 청소 + 통계 갱신 + 리포트 출력
```

주의할 점은 일반 VACUUM은 보통 **OS에 디스크를 반납하지 않는다**는 것이다. 파일 크기는 대개 그대로 두고, 내부 빈 공간만 재활용한다. 물리적으로 파일을 줄이려면 `VACUUM FULL`이다.

| 구분 | VACUUM | VACUUM FULL |
| --- | --- | --- |
| 동작 | 죽은 공간을 내부 재사용 표시 | 테이블을 통째로 새 파일로 재작성 |
| 락 | SHARE UPDATE EXCLUSIVE (읽기·쓰기 계속 가능) | ACCESS EXCLUSIVE (해당 테이블 완전 차단) |
| 디스크 반납 | 대개 안 함 | 함 (파일 축소) |
| 추가 공간 | 거의 없음 | 테이블 크기만큼 임시로 더 필요 |
| 용도 | 일상적·상시 | 이미 심하게 부푼 것을 최후에 정리 |

`VACUUM FULL`은 대상 테이블을 완전히 잠그므로 운영 중 함부로 돌리면 서비스가 멈춘다. 상시 청소는 일반 VACUUM에 맡기는 게 정석이다. (참고로 PostgreSQL 17부터 VACUUM의 죽은 튜플 추적 메모리 구조가 개선되어, 대형 테이블에서 더 적은 메모리로 효율적으로 청소한다.)

## 6. autovacuum — 알아서 청소하기

죽은 튜플을 사람이 매번 청소할 수는 없다. PostgreSQL은 **autovacuum** 데몬을 기본 켜 두고, 테이블별로 죽은 튜플이 임계치를 넘으면 자동으로 VACUUM(과 ANALYZE)을 돌린다.

발동 임계치는 대략 이 식이다.

```text
vacuum 임계치 = autovacuum_vacuum_threshold
              + autovacuum_vacuum_scale_factor × (테이블의 대략적 행 수)
```

기본값 기준으로 보면:

| 파라미터 | 기본값 | 의미 |
| --- | --- | --- |
| `autovacuum_vacuum_threshold` | 50 | 고정 베이스 (죽은 튜플 최소 개수) |
| `autovacuum_vacuum_scale_factor` | 0.2 | 테이블 행의 20%가 죽으면 발동 |
| `autovacuum_analyze_scale_factor` | 0.1 | 통계 갱신은 10% 변경 시 |
| `autovacuum_naptime` | 1min | 데몬이 대상 테이블을 점검하는 주기 |

기본값의 함정은 `scale_factor 0.2`다. 행이 1억 개인 대형 테이블은 죽은 튜플이 **2천만 개** 쌓여야 autovacuum이 발동한다. 그때는 이미 bloat가 심하고 한 번의 VACUUM 부담도 크다. 그래서 큰 테이블·갱신 잦은 테이블은 테이블 단위로 임계치를 낮추는 튜닝이 흔하다.

```sql
-- 갱신 잦은 큰 테이블: 더 자주, 더 일찍 청소
ALTER TABLE events SET (
  autovacuum_vacuum_scale_factor = 0.02,   -- 2%만 죽어도
  autovacuum_vacuum_threshold    = 1000
);
```

INSERT만 되는 append-only 테이블은 죽은 튜플이 안 생겨 위 규칙으로는 청소가 안 걸리지만, PostgreSQL 13+의 `autovacuum_vacuum_insert_threshold`(기본 1000)가 삽입 누적 기준으로 freeze·통계용 VACUUM을 걸어 준다.

## 7. 트랜잭션 ID wraparound와 freeze — 청소를 안 하면 DB가 멈춘다

VACUUM은 공간 회수만 하는 게 아니다. 더 무서운 임무가 있다. **트랜잭션 ID wraparound 방지**다.

XID는 32비트라 약 42억(2^32) 개를 쓰면 한 바퀴 돌아 재사용된다. PostgreSQL의 가시성 판단은 "이 XID가 내 XID보다 과거냐 미래냐"의 비교에 기대는데, XID가 순환하면 아주 오래된 튜플이 갑자기 "미래"로 보여 **보이던 데이터가 사라진 것처럼** 되는 재앙이 발생한다.

이를 막는 장치가 **freeze**다. VACUUM은 충분히 오래되고 모두에게 확정적으로 보이는 튜플의 XID를 특수한 "frozen(항상 과거)" 상태로 표시한다. 한 번 frozen 된 튜플은 XID 순환과 무관하게 영원히 보이므로 wraparound 문제에서 제외된다.

| 파라미터 | 기본값 | 의미 |
| --- | --- | --- |
| `vacuum_freeze_min_age` | 5천만 | 이보다 오래된 XID의 튜플을 freeze 대상으로 |
| `autovacuum_freeze_max_age` | 2억 | 테이블의 가장 오래된 XID가 이 나이에 도달하면 **강제** anti-wraparound VACUUM 발동 |

`autovacuum_freeze_max_age`에 도달하면, **autovacuum을 꺼 두었더라도** PostgreSQL은 wraparound를 막기 위해 강제로 freeze VACUUM을 돌린다. 그마저 계속 방치돼 한계(약 20억)에 근접하면, DB는 데이터 손상을 막으려 **새 쓰기를 거부하고 읽기 전용으로 잠긴다.** "청소를 안 하면 DB가 멈춘다"는 말은 과장이 아니다.

> VACUUM은 공간 청소부이자 wraparound 방화벽이다. autovacuum을 함부로 끄면 안 되는 진짜 이유가 여기 있다.

## 8. 실무 — bloat와 autovacuum 상태 보기

관리의 출발점은 **죽은 튜플이 얼마나 쌓였고 마지막 청소가 언제였는지**다. `pg_stat_user_tables`가 답을 준다.

```sql
SELECT
  relname,
  n_live_tup,                  -- 살아 있는 튜플(대략)
  n_dead_tup,                  -- 죽은 튜플 — bloat 신호
  round(n_dead_tup::numeric
        / nullif(n_live_tup, 0), 3) AS dead_ratio,
  last_autovacuum,             -- 마지막 autovacuum 시각
  autovacuum_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;
```

- `n_dead_tup`이 크고 `dead_ratio`가 높은데 `last_autovacuum`이 오래됐다면 → autovacuum이 못 따라가고 있다. scale_factor를 낮추거나 워커·비용 설정을 손봐야 한다.
- wraparound 여유는 테이블별 XID 나이로 본다.

```sql
SELECT relname, age(relfrozenxid) AS xid_age
FROM pg_class
WHERE relkind = 'r'
ORDER BY xid_age DESC
LIMIT 10;
```

`xid_age`가 `autovacuum_freeze_max_age`(기본 2억)에 다가가는 테이블이 있으면 anti-wraparound VACUUM이 임박했거나 지연되고 있다는 뜻이다. 이 지표들을 상시 관측하는 방법은 모니터링 글에서 이어 다룬다.

## 관련 글

| 글 | 왜 |
| --- | --- |
| [트랜잭션 동시성 제어 — 격리 수준과 락](/posts/db/2024-05-03-isolation-level/) | MVCC가 구현하는 격리 수준의 이론적 배경 |
| [PostgreSQL 모니터링 — pg_stat 뷰와 슬로우 쿼리 추적](/posts/db/2026-07-03-postgresql-monitoring/) | dead tuple·autovacuum 상태를 실제로 보는 법 |

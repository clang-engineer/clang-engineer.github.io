---
title       : "쿼리 튜닝 실전 — 페이지네이션(keyset vs offset)과 N+1"
description : "OFFSET 페이지네이션이 깊은 페이지에서 느려지는 이유와 keyset 페이지네이션 대안, 그리고 ORM에서 흔한 N+1 쿼리를 조인·배치 로딩으로 없애는 법."
date        : 2026-07-03 16:40:00 +0900
updated     : 2026-07-03 16:40:00 +0900
categories  : [db, "최적화·설계"]
tags        : [pagination, query-tuning, performance, orm]
pin         : false
hidden      : false
---

목록 화면과 상세 조회는 어느 서비스에나 있다. 그리고 성능 문제도 대부분 여기서 터진다. 페이지가 뒤로 갈수록 목록이 느려지거나, 목록 하나 여는데 쿼리 수백 건이 나가는 두 가지 패턴은 실무에서 압도적으로 자주 만난다. 원인은 다르지만 둘 다 "행 수가 늘어나면 비용도 같이 늘어난다"는 공통점을 가진다.

## 1. OFFSET 페이지네이션의 함정

가장 흔한 페이지네이션은 `LIMIT`/`OFFSET`이다.

```sql
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 10000;
```

문제는 `OFFSET`이 "앞의 N개 행을 건너뛴다"가 아니라 **"앞의 N개 행을 실제로 읽고 나서 버린다"**는 데 있다. 위 쿼리는 20건을 반환하려고 10,020건을 정렬 순서대로 훑은 뒤 앞 10,000건을 폐기한다. 페이지가 깊어질수록 스캔량이 선형으로 늘어 사실상 `O(offset)`이 된다. 1페이지는 즉답하지만 501페이지는 눈에 띄게 느리다.

또 하나의 함정은 **정합성**이다. 사용자가 1페이지를 보는 사이 새 글이 하나 추가되면 전체 행이 한 칸씩 밀려, 2페이지 첫 행이 1페이지 마지막 행과 겹치거나 누락된다. OFFSET은 "위치"로 페이지를 세기 때문에 데이터가 바뀌면 경계가 흔들린다.

> OFFSET은 임의 페이지 번호로 점프할 수 있어 편하지만, 깊은 페이지에서 스캔 비용이 커지고 삽입/삭제에 취약하다.

## 2. Keyset 페이지네이션 (cursor / seek)

Keyset(= seek method, cursor 방식)은 위치 대신 **마지막으로 본 행의 키**를 기억한다. 그리고 다음 페이지를 "그 키보다 뒤"라는 `WHERE` 조건으로 뽑는다.

```sql
-- 첫 페이지
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- 다음 페이지: 직전 페이지 마지막 행이 (created_at = :ts, id = :id) 였다면
SELECT id, title, created_at
FROM posts
WHERE (created_at, id) < (:ts, :id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

`(created_at, id) < (:ts, :id)`는 표준 SQL의 **행 값 비교(row value comparison)**로, PostgreSQL·MySQL에서 그대로 동작한다. "created_at이 더 작거나, 같으면서 id가 더 작은" 행을 사전식으로 정확히 골라낸다. `(created_at DESC, id DESC)`에 걸린 복합 인덱스가 있으면 옵티마이저는 인덱스에서 시작 지점으로 **바로 진입해** 20건만 읽고 멈춘다. 앞 페이지를 훑지 않으므로 1페이지든 5,000페이지든 비용이 일정하다.

행 값 비교 문법을 쓰지 않는다면 논리적으로 동일한 아래 형태로 풀어 쓸 수 있다.

```sql
WHERE created_at < :ts
   OR (created_at = :ts AND id < :id)
```

### 장단점

- 임의 페이지 점프가 불가능하다. "487페이지로 가기"를 못 한다. 무한 스크롤·"더 보기" UI와 궁합이 좋다.
- 정렬 키가 **유일**해야 한다. `created_at`만으로는 동점이 생겨 행을 건너뛰거나 중복될 수 있으므로, 위 예시처럼 `id` 같은 유니크 컬럼을 tie-breaker로 덧붙인다.
- 정렬 컬럼 전체가 `ORDER BY`와 `WHERE`에 함께 있어야 인덱스를 온전히 탄다.

### 언제 무엇을 쓰나

| 상황 | 권장 |
| --- | --- |
| 무한 스크롤 / 피드 / "더 보기" | keyset |
| API 페이징(대량 데이터 순회, export) | keyset |
| 깊은 페이지까지 자주 접근 | keyset |
| "3페이지로 점프", 총 페이지 수·번호 UI 필수 | offset |
| 데이터가 작고(수천 건) 얕은 페이지만 | offset (단순함 우선) |

## 3. N+1 문제

N+1은 목록을 가져온 뒤 **각 행마다 연관 데이터를 한 번씩 더 조회**하면서 생긴다. 목록 쿼리 1번 + 행마다 1번씩 N번 = 1+N 쿼리. ORM(JPA)에서 지연 로딩(lazy)이 걸린 연관을 반복 접근하거나, MyBatis에서 결과 매핑에 하위 조회를 걸어 두면 흔히 발생한다.

```sql
-- 1번: 주문 20건
SELECT * FROM orders LIMIT 20;

-- N번: 루프 돌며 주문마다 회원을 따로 조회 (20번 반복)
SELECT * FROM members WHERE id = 1;
SELECT * FROM members WHERE id = 2;
-- ... id = 20 까지
```

20건이면 21쿼리라 눈에 안 띄지만, 목록이 1,000건이면 1,001쿼리가 된다. 각 쿼리가 빨라도 왕복(round-trip) 횟수 자체가 병목이 된다.

### 어떻게 발견하나

**같은 모양의 쿼리가 파라미터만 바뀌며 반복**되면 N+1을 의심한다.

- 쿼리 로그를 켠다. JPA는 `spring.jpa.show-sql=true`(또는 `p6spy`), MyBatis는 매퍼 로거를 `DEBUG`로.
- 슬로우 로그·APM에서 "요청 1건당 쿼리 수"가 목록 크기에 비례해 늘어나면 확정이다.
- 개별 쿼리는 슬로우 로그 임계치에 안 걸릴 만큼 빨라서, 총량으로만 드러나는 경우가 많다.

## 4. N+1 해결

핵심은 **N번의 개별 조회를 1~2번의 묶음 조회로 바꾸는 것**이다.

**(1) 조인으로 한 방에** — 연관을 JOIN으로 함께 가져온다. JPA에서는 fetch join.

```sql
SELECT o.*, m.*
FROM orders o
JOIN members m ON m.id = o.member_id
LIMIT 20;
```

단, 컬렉션(1:N)을 fetch join 하면 행이 곱해져 페이지네이션과 충돌한다. 이때는 아래 IN 절 배치 방식이 안전하다.

**(2) IN 절 배치 로딩** — 목록을 먼저 뽑고, 거기서 모은 키들을 `IN`으로 한 번에 조회한 뒤 애플리케이션에서 매핑한다.

```sql
-- 1번: 주문 20건
SELECT * FROM orders LIMIT 20;

-- 2번: 앞에서 모은 member_id들을 한 번에
SELECT * FROM members WHERE id IN (1, 2, 3, /* ... */ 20);
```

1+N이 1+1로 줄어든다. JPA는 `@BatchSize`(또는 `hibernate.default_batch_fetch_size`)로 지연 로딩을 자동으로 IN 배치로 묶어 준다. MyBatis는 별도 쿼리로 키 목록을 IN 조회하고 매퍼에서 조립하거나, `collection` 매핑에 조인 결과를 쓴다.

> N+1은 "조회를 없애는" 게 아니라 "N번을 1~2번으로 합치는" 문제다. 단일 연관은 조인/fetch join, 컬렉션은 IN 배치 로딩이 기본 처방이다.

## 관련 글

| 글 | 이 글과의 접점 |
| --- | --- |
| [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) | keyset 페이지네이션이 타는 인덱스 |
| [MyBatis 관련 기록](/posts/db/2021-11-22-mybatis/) | ORM/매퍼에서 N+1이 생기는 지점 |

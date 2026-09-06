---
title       : "쿼리 튜닝 실전 — 페이지네이션(keyset vs offset)과 N+1"
description : "OFFSET 페이지네이션이 깊은 페이지에서 느려지는 이유와 keyset 페이지네이션 대안, 그리고 ORM에서 흔한 N+1 쿼리를 조인·배치 로딩으로 없애는 법."
date        : 2026-07-03 16:40:00 +0900
updated     : 2026-09-06 20:00:00 +0900
categories  : [db, "최적화·설계"]
tags        : [pagination, query-tuning, performance, orm]
pin         : false
hidden      : false
---

목록 화면과 상세 조회는 어느 서비스에나 있다. 그리고 성능 문제도 대부분 여기서 터진다. 페이지가 뒤로 갈수록 목록이 느려지거나, 목록 하나 여는데 쿼리 수백 건이 나가는 두 가지 패턴은 실무에서 자주 만난다. 원인은 다르지만 둘 다 **행 수가 늘어나면 비용도 같이 늘어난다**는 공통점이 있다.

## 1. OFFSET 페이지네이션의 함정

가장 흔한 페이지네이션은 `LIMIT`/`OFFSET`이다.

```sql
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 10000;
```

`OFFSET`은 앞의 N개 행을 공짜로 건너뛰는 것이 아니다. DB는 정렬 순서상 앞에 있는 행을 읽고 버린 뒤 필요한 행을 반환해야 한다. 페이지가 깊어질수록 읽고 버리는 행 수가 늘어나므로 비용도 커진다.

또 데이터가 계속 추가·삭제되는 동안 위치 기반 경계가 흔들려 중복·누락이 생길 수 있다.

> OFFSET은 임의 페이지 번호로 점프하기 쉽지만, 깊은 페이지에서 비용이 커지고 변경 중인 데이터의 경계가 흔들릴 수 있다.

## 2. Keyset 페이지네이션

Keyset(Seek/Cursor) 방식은 위치 대신 **마지막으로 본 행의 정렬 키**를 기억한다.

```sql
-- 첫 페이지
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- 다음 페이지
SELECT id, title, created_at
FROM posts
WHERE (created_at, id) < (:ts, :id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

복합 인덱스가 정렬 조건과 맞으면 직전 Cursor 다음 위치로 바로 접근할 수 있어 깊은 페이지에서도 앞쪽 행을 계속 버리는 비용을 피할 수 있다.

정렬 키에는 동점이 생기지 않도록 `id` 같은 Tie-breaker를 함께 두는 편이 안전하다.

| 상황 | 권장 |
| --- | --- |
| 무한 스크롤 / 더 보기 | Keyset |
| API 대량 순회 | Keyset |
| 깊은 페이지 접근 | Keyset |
| 임의 페이지 번호 점프 필수 | Offset |
| 데이터가 작고 얕은 페이지 중심 | Offset |

## 3. N+1 문제

N+1은 목록 1회를 조회한 뒤 각 Row의 연관 데이터를 다시 하나씩 조회하면서 발생한다.

```sql
-- 1회
SELECT * FROM orders LIMIT 20;

-- N회
SELECT * FROM members WHERE id = 1;
SELECT * FROM members WHERE id = 2;
-- ...
```

개별 Query가 빠르더라도 Network Round-trip과 DB 처리 횟수가 N에 비례해 증가한다.

### 어떻게 발견하나

같은 모양의 Query가 Parameter만 바뀌며 반복되는지 본다.

- SQL Log
- APM의 요청당 Query 수
- 동일 Statement의 반복 호출 수

목록 크기가 커질수록 Query 수도 함께 늘어나면 N+1 가능성이 높다.

## 4. N+1 해결

핵심은 N번의 개별 조회를 **한 번의 Join 또는 소수의 Batch 조회**로 바꾸는 것이다.

### Join / Fetch Join

```sql
SELECT o.*, m.*
FROM orders o
JOIN members m ON m.id = o.member_id
LIMIT 20;
```

JPA에서는 Fetch Join이나 `@EntityGraph`를 사용할 수 있다.

### IN Batch Loading

```sql
SELECT * FROM orders LIMIT 20;

SELECT *
FROM members
WHERE id IN (1, 2, 3, /* ... */ 20);
```

JPA의 `@BatchSize`나 `hibernate.default_batch_fetch_size`처럼 여러 Lazy Load를 묶는 방법도 있다.

컬렉션 Fetch Join은 Row 수를 증폭시켜 Pagination과 충돌할 수 있으므로, **단일 연관은 Join, 컬렉션은 Batch Loading**처럼 조회 형태에 맞게 선택한다.

## 정리

```text
깊은 Offset
→ 앞 Row를 계속 읽고 버림
→ Keyset으로 시작 위치를 Cursor로 지정

N+1
→ Row마다 연관 Query 반복
→ Join / Batch Loading으로 묶음 조회
```

이 두 문제는 모두 **데이터 양이 늘 때 반복 비용이 함께 커지는 구조를 제거하는 것**이 핵심이다.

## 관련 글

| 글 | 이 글과의 접점 |
| --- | --- |
| [MyBatis 관련 기록](./2021-11-22-mybatis.md) | Mapper에서 N+1이 생기는 지점 |

인덱스 구조와 질의 최적화 원리는 정보관리기술사 Knowledge의 `BTree-클러스터드-넌클러스터드-인덱스.md`, `쿼리-옵티마이저-통계-카디널리티-실행계획.md`에서 관리한다.

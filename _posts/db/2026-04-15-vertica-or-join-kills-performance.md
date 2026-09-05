---
title       : "Vertica OR JOIN 성능 저하 — Join Filter로 빠질 때 진단과 재작성"
description : "Vertica LEFT JOIN의 ON 절 OR 조건이 Join Cond가 아니라 Join Filter로 처리될 때 실행계획에서 이를 식별하고, outer join 의미를 보존하면서 후보 매칭 쌍을 분리해 재작성하는 방법을 정리한다."
date        : 2026-04-15 10:00:00 +0900
updated     : 2026-09-05 21:30:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [vertica, join, performance, troubleshooting]
pin         : false
hidden      : false
---

LEFT JOIN 하나가 갑자기 수십 분 이상 걸릴 때, 단순히 `OR` 자체가 느리다고 결론내리면 문제를 정확히 못 잡는다. 핵심은 **Vertica가 ON 절의 조건을 실제 Join Cond로 쓰는지, 아니면 Join 이후의 Filter로 미루는지**다.

```text
LEFT JOIN ... ON
  key 조건
  AND (조건 A OR 조건 B)
          ↓
실행계획 확인
          ↓
Join Cond에 포함?
├─ yes → 조인 단계에서 후보 축소
└─ no  → Join Filter로 후처리
          ↓
대량 Row가 먼저 조인 후보가 된 뒤 필터링
```

이 글은 실제 실행계획에서 이 차이를 확인하고, 원래 LEFT JOIN 의미를 보존하면서 조건을 재작성하는 방법을 다룬다.

> 옵티마이저 동작은 Vertica 버전·통계·Projection 구성에 따라 달라질 수 있다. 재현할 때는 `SELECT version();`과 `EXPLAIN` 결과를 함께 남긴다.

## 증상 — OR 조건을 넣은 뒤 급격히 느려졌다

문제가 된 형태는 다음과 같다.

```sql
LEFT OUTER JOIN DW.FT_VIDEO_FILES vid
  ON vid.ENTITY_ID = TGT.ENTITY_ID
 AND vid.TENANT_CD = TGT.TENANT_CD
 AND (vid.CATEGORY = LVL.col1 OR vid.FORMAT = LVL.col2)
```

실행계획에서 중요한 부분은 비용 숫자보다 **조건이 어느 단계에 걸렸는지**다.

```text
Join Cond:
  ENTITY_ID
  TENANT_CD

Join Filter:
  CATEGORY = ... OR FORMAT = ...

STORAGE ACCESS:
  Rows 9M
```

이 경우 `CATEGORY/FORMAT` 조건은 조인 후보를 만드는 데 직접 쓰이지 않고, 많은 Row를 읽고 결합한 뒤 후처리될 수 있다.

## 비교 — 단일 조건은 Join Cond로 들어간다

같은 Join에서 OR을 없애고 한 조건만 남겼을 때:

```sql
LEFT OUTER JOIN DW.FT_VIDEO_FILES vid
  ON vid.ENTITY_ID = TGT.ENTITY_ID
 AND vid.TENANT_CD = TGT.TENANT_CD
 AND vid.FORMAT = LVL.col2
```

실행계획이 다음처럼 바뀌었다면 원인을 좁힐 수 있다.

```text
Join Cond:
  ENTITY_ID
  TENANT_CD
  FORMAT = ...
```

즉 문제의 좌표는 이렇게 잡힌다.

```text
OR 문법 자체
≠ 항상 느림

이번 문제
= OR이 Join Cond로 활용되지 못하고 Join Filter로 밀림
```

## 진단 순서

비슷한 문제를 만나면 먼저 SQL을 바꾸기보다 실행계획에서 다음을 본다.

1. `Join Cond`에 실제 선택도를 높이는 조건이 포함되는가
2. 조건이 `Join Filter`로 빠졌는가
3. Storage Access에서 읽는 Row 수가 예상보다 큰가
4. 단일 조건으로 바꿨을 때 Plan이 어떻게 달라지는가

```sql
EXPLAIN
SELECT ...;
```

이 비교가 있어야 "OR 때문"이라는 추측을 "이 Plan에서는 OR 조건이 후처리됐다"는 관측으로 바꿀 수 있다.

## 해결 — OR을 후보 매칭 쌍으로 분리한다

원래 의미는 다음과 같다.

```text
같은 왼쪽 Row에 대해
조건 A로 맞는 오른쪽 Row
        OR
조건 B로 맞는 오른쪽 Row
```

따라서 두 조건을 각각 단일 Join으로 분리해 **왼쪽 Row ID + 오른쪽 Row ID의 후보 쌍**을 만든 뒤 합칠 수 있다.

```sql
WITH matched_pairs AS (
  SELECT left_rows.left_row_id, vid.id AS vid_id
  FROM left_rows
  JOIN vid
    ON ...
   AND vid.category = left_rows.col1

  UNION

  SELECT left_rows.left_row_id, vid.id AS vid_id
  FROM left_rows
  JOIN vid
    ON ...
   AND vid.format = left_rows.col2
)
SELECT ...
FROM left_rows
LEFT JOIN matched_pairs m
  ON m.left_row_id = left_rows.left_row_id
LEFT JOIN vid
  ON vid.id = m.vid_id;
```

각 Branch는 단일 AND 조건이므로 옵티마이저가 Join 조건으로 활용하기 쉬워지고, `UNION`은 같은 `(left_row_id, vid_id)` 쌍이 두 조건을 모두 만족할 때 중복을 제거한다.

## 왜 단순 UNION ALL로 두 SELECT를 합치면 안 되나

원래 Query가 `LEFT JOIN`이라는 점이 중요하다.

두 완성 Query를 단순히 `UNION ALL`하면:

- 매칭되지 않은 왼쪽 Row가 두 Branch에서 각각 한 번씩 나올 수 있고
- 같은 오른쪽 Row가 두 조건을 모두 만족하면 중복될 수 있다

즉 성능만 좋아지고 결과 의미가 달라질 수 있다.

따라서 먼저 **매칭 관계만 합집합**한 뒤, 원본 왼쪽 Row에 Outer Join을 한 번 적용하는 편이 안전하다.

```text
조건 A 매칭 쌍 ─┐
                ├─ UNION → 후보 매칭 쌍
조건 B 매칭 쌍 ─┘
                         ↓
                 원본 left_rows와 LEFT JOIN
```

## left_row_id는 반드시 왼쪽 행을 유일하게 식별해야 한다

`left_rows`가 `TGT + LVL` 조합이라면 `TGT.id`만으로는 한 왼쪽 Row를 구분하지 못할 수 있다.

```text
TGT 1개
  ↓
LVL 여러 행
```

이 경우 `left_row_id`는 복합 Key나 사전에 부여한 Row Identifier처럼 **실제 왼쪽 결과 행 하나를 유일하게 식별**해야 한다.

그렇지 않으면 후보 매칭 쌍을 합치는 과정에서 서로 다른 LVL Row가 섞일 수 있다.

## 결과 의미가 같은지 검증한다

SQL 재작성은 Plan만 빨라졌다고 끝나지 않는다. 특히 Outer Join은 미매칭 Row와 중복 의미가 중요하다.

가능하면 동일 입력에서 기존 Query와 새 Query 결과를 비교한다.

```sql
-- 개념 예시
old_query
EXCEPT ALL
new_query;

new_query
EXCEPT ALL
old_query;
```

두 방향 모두 결과가 없다면 Row 중복까지 포함해 동일한 결과인지 검증할 수 있다.

검증 포인트는 다음 세 가지다.

- 매칭되지 않은 왼쪽 Row가 그대로 남는가
- 두 OR 조건을 모두 만족하는 오른쪽 Row가 한 번만 나와야 하는 상황인지
- 한 왼쪽 Row가 여러 오른쪽 Row와 매칭되는 원래 1:N 의미가 유지되는가

## 정리

이 문제의 핵심은 "Vertica에서는 OR JOIN을 쓰면 안 된다"가 아니다.

```text
느린 LEFT JOIN
      ↓
EXPLAIN
      ↓
선택 조건이 Join Cond인가?
      ↓ no
Join Filter로 후처리
      ↓
후보 Row 과다
      ↓
조건별 매칭 쌍 분리
      ↓
LEFT JOIN 의미·중복 검증
```

**문법을 금지 규칙으로 외우기보다 실행계획에서 조건이 어느 단계에 적용되는지를 확인하는 것**이 재사용 가능한 진단 방법이다.

## 관련 글

| 글 | 다루는 것 |
| --- | --- |
| [RDB JOIN 전략 — Nested Loop·Hash·Merge를 어떻게 선택하나](/posts/db/2026-01-04-rdb-join-strategy/) | 논리 JOIN과 물리 Join Algorithm의 관계 |
| [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | 실행계획과 추정/실제 Row를 읽는 일반 원리 |
| **Vertica OR JOIN 성능 저하 (현재 글)** | OR 조건이 Join Filter로 빠지는 사례와 의미 보존 재작성 |
| [RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선](/posts/db/2026-06-09-preload-record-id-to-level-table/) | 조회 시 JOIN 자체를 줄인 설계 사례 |

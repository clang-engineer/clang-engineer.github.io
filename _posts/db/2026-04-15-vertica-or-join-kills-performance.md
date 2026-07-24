---
title       : "Vertica에서 OR 조건 JOIN은 성능을 죽인다"
description : "LEFT OUTER JOIN의 ON 절 OR 조건이 Join Filter로 빠지면서 풀스캔이 발생하는 문제와, 왼쪽 행의 의미를 보존하며 후보 매칭 쌍을 분리하는 해법."
date        : 2026-04-15 10:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [vertica, join, performance, troubleshooting]
pin         : false
hidden      : false
---

Vertica에서 LEFT OUTER JOIN의 ON 절에 OR 조건을 쓰면, 옵티마이저가 **Join Cond이 아닌 Join Filter(후처리)**로 빠뜨려서 대용량 테이블을 풀스캔한다.

> 옵티마이저 거동은 버전에 따라 달라질 수 있으니, 재현·비교 시 테스트 환경의 Vertica 버전을 함께 명시하는 것을 권장한다(`SELECT version();`).

## 느린 쿼리 (OR 조건)

```sql
LEFT OUTER JOIN DW.FT_VIDEO_FILES vid
  ON vid.ENTITY_ID = TGT.ENTITY_ID AND vid.TENANT_CD = TGT.TENANT_CD
  AND (vid.CATEGORY = LVL.col1 OR vid.FORMAT = LVL.col2)
```

실행 계획:
```
Join Cond: (ENTITY_ID) AND (TENANT_CD)        ← 여기만 Join 조건
Join Filter: (CATEGORY = ... OR FORMAT = ...)  ← 후처리 필터!
STORAGE ACCESS: Rows 9M (풀스캔)
Cost: 150M → 1시간+ 소요
```

## 빠른 쿼리 (AND 단일 조건)

```sql
LEFT OUTER JOIN DW.FT_VIDEO_FILES vid
  ON vid.ENTITY_ID = TGT.ENTITY_ID AND vid.TENANT_CD = TGT.TENANT_CD
  AND vid.FORMAT = LVL.col2
```

실행 계획:
```
Join Cond: (ENTITY_ID) AND (TENANT_CD) AND (FORMAT = ...)  ← 전부 Join 조건
→ 즉시 완료
```

## 해결: 후보 쌍을 분리하되 의미를 보존

```sql
WITH matched_pairs AS (
  SELECT left_rows.left_row_id, vid.id AS vid_id
  FROM left_rows
  JOIN vid ON ... AND vid.category = left_rows.col1

  UNION  -- 같은 (left_row, vid) 쌍이 두 조건을 모두 만족해도 한 번만 유지

  SELECT left_rows.left_row_id, vid.id AS vid_id
  FROM left_rows
  JOIN vid ON ... AND vid.format = left_rows.col2
)
SELECT ...
FROM left_rows
LEFT JOIN matched_pairs m ON m.left_row_id = left_rows.left_row_id
LEFT JOIN vid ON vid.id = m.vid_id
```

여기서 `left_rows`는 원래 `TGT + LVL` 왼쪽 관계 전체이며, `left_row_id`는 그 관계의 각 행을 유일하게 식별하는 키다. `tgt.id`만으로 여러 LVL 행을 구분할 수 없다면 복합 키나 사전에 부여한 행 식별자를 써야 한다.

각 후보 쿼리는 단일 AND 조건을 사용하므로 Join Cond에 포함될 여지가 커진다. 단, 원래 쿼리가 `LEFT JOIN`이면 두 완성 쿼리를 단순히 `UNION ALL`로 합쳐서는 안 된다. 매칭되지 않은 왼쪽 행이 두 번 나오고, 한 오른쪽 행이 두 조건을 모두 만족하면 중복될 수 있기 때문이다. 반드시 안정적인 **왼쪽 행 키와 오른쪽 행 키의 쌍**을 먼저 합집합한 뒤 한 번만 outer join하고, `EXCEPT ALL`로 기존 결과와 동일한지 검증한다.

## Vertica 실행 계획 확인

```sql
EXPLAIN SELECT ...
```

`Join Filter`가 보이면 해당 조건이 후처리로 빠진 것 → OR 후보를 분리하되, 중복과 미매칭 행을 보존하는지 함께 검토.

## 관련 글

| 글 | 다루는 것 |
| --- | --- |
| [RDB에서 조인(Join) 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) | 조인 알고리즘과 옵티마이저의 전략 선택 |
| **Vertica에서 OR 조건 JOIN은 성능을 죽인다 (현재 글)** | OR 조건이 Join Filter로 빠지는 문제와 매칭 쌍 분리 해법 |
| [RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선](/posts/db/2026-06-09-preload-record-id-to-level-table/) | INSERT 시점에 컬럼을 옮겨 조회 JOIN 자체를 제거 |

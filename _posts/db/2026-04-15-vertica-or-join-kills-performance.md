---
title       : "Vertica에서 OR 조건 JOIN은 성능을 죽인다"
description : "LEFT OUTER JOIN의 ON 절 OR 조건이 Join Filter로 빠지면서 풀스캔이 발생하는 문제와 UNION ALL 분리 해법"
date        : 2026-04-15 10:00:00 +0900
updated     : 2026-06-19 09:00:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [vertica, join, performance, troubleshooting]
pin         : false
hidden      : false
---

Vertica에서 LEFT OUTER JOIN의 ON 절에 OR 조건을 쓰면, 옵티마이저가 **Join Cond이 아닌 Join Filter(후처리)**로 빠뜨려서 대용량 테이블을 풀스캔한다.

## 느린 쿼리 (OR 조건)

```sql
LEFT OUTER JOIN CDW.FT_DICOM_RECORDS dicom
  ON dicom.PT_NO = TGT.PT_NO AND dicom.HSP_TP_CD = TGT.HSP_TP_CD
  AND (dicom.BODY_PART = LVL.col1 OR dicom.MODALITY = LVL.col2)
```

실행 계획:
```
Join Cond: (PT_NO) AND (HSP_TP_CD)        ← 여기만 Join 조건
Join Filter: (BODY_PART = ... OR MODALITY = ...)  ← 후처리 필터!
STORAGE ACCESS: Rows 9M (풀스캔)
Cost: 150M → 1시간+ 소요
```

## 빠른 쿼리 (AND 단일 조건)

```sql
LEFT OUTER JOIN CDW.FT_DICOM_RECORDS dicom
  ON dicom.PT_NO = TGT.PT_NO AND dicom.HSP_TP_CD = TGT.HSP_TP_CD
  AND dicom.MODALITY = LVL.col2
```

실행 계획:
```
Join Cond: (PT_NO) AND (HSP_TP_CD) AND (MODALITY = ...)  ← 전부 Join 조건
→ 즉시 완료
```

## 해결: UNION ALL로 분리

```sql
SELECT ... JOIN dicom ON ... AND dicom.BODY_PART = LVL.col1
UNION ALL
SELECT ... JOIN dicom ON ... AND dicom.MODALITY = LVL.col2
```

각 서브쿼리가 단일 AND 조건이라 Join Cond에 포함됨. 9M 풀스캔 → 조건별 필터 스캔으로 개선.

## Vertica 실행 계획 확인

```sql
EXPLAIN SELECT ...
```

`Join Filter`가 보이면 해당 조건이 후처리로 빠진 것 → OR을 UNION ALL로 분리 검토.

## 관련 글

| 글 | 다루는 것 |
| --- | --- |
| [RDB에서 조인(Join) 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) | 조인 알고리즘과 옵티마이저의 전략 선택 |
| **Vertica에서 OR 조건 JOIN은 성능을 죽인다 (현재 글)** | OR 조건이 Join Filter로 빠지는 문제와 UNION ALL 해법 |
| [RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선](/posts/db/2026-06-09-preload-record-id-to-level-table/) | INSERT 시점에 컬럼을 옮겨 조회 JOIN 자체를 제거 |

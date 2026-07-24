---
title       : "비정형 도메인 RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선"
description : "수천만 건 팩트 테이블 JOIN을 INSERT 시점에 미리 옮겨두면 조회 시 JOIN 자체가 사라진다. 조회 성능을 위해 컬럼을 사전 적재하는 역정규화의 실전 사례."
date        : 2026-06-09 11:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [db, "최적화·설계"]
tags        : [performance, join]
pin         : false
hidden      : false
---

대형 팩트 테이블(이미지·영상 등 비정형 파일)을 매번 JOIN하는 대신, 중간 테이블 INSERT 시점에 필요한 컬럼을 미리 넣어두면 조회 시 JOIN을 제거할 수 있다.

> 이 기법은 조회 성능을 위해 다른 테이블의 컬럼을 의도적으로 중복 저장하는 **역정규화**의 구체 사례다. 언제 역정규화를 택해야 하는지에 대한 이론과 판단 기준은 [정규화와 스키마 설계 — 1NF~BCNF와 역정규화](/posts/db/2026-07-03-database-normalization/) 글을 참조.
{: .prompt-tip }

## 문제

비정형 도메인의 `RECORD_ID`, `FILE_PATH`를 가져오기 위해 데이터 조회(COUNT 포함)마다 수천만 건 팩트 테이블을 LEFT OUTER JOIN → COUNT만으로도 수십 초 소요.

```sql
-- 느림: 조회 시 팩트 테이블 JOIN
SELECT COUNT(*) FROM (
  SELECT ... FROM target_tbl TGT
  INNER JOIN level_tbl LVL ON ...
  LEFT OUTER JOIN DW.FT_IMAGE_FILES IMG ON ...  -- 여기가 병목
) T
```

## 해결

레벨 테이블 CREATE/INSERT 시점에 RECORD_ID, FILE_PATH를 미리 넣어둔다. INSERT 시 이미 팩트 테이블을 접근하므로 추가 비용이 거의 없다.

```sql
-- INSERT 시 RECORD_ID 포함 (기존 JOIN에 컬럼만 추가)
CREATE TABLE level_tbl (ENTITY_ID, TENANT_CD, GRP_CD, IMAGE_RECORD_ID, FILE_PATH)
INSERT INTO level_tbl
  SELECT DISTINCT IMG.ENTITY_ID, IMG.TENANT_CD, IMG.GRP_CD,
         IMG.IMAGE_RECORD_ID, IMG.FILE_PATH  -- 추가
  FROM DW.FT_IMAGE_FILES IMG ...

-- 빠름: 조회 시 팩트 테이블 JOIN 불필요
SELECT COUNT(*) FROM (
  SELECT ... LVL.IMAGE_RECORD_ID AS RECORD_ID
  FROM target_tbl TGT
  INNER JOIN level_tbl LVL ON ...
  -- 팩트 테이블 JOIN 없음
) T
```

## 다중 비정형 도메인 시 UNION ALL은 유지

이미지 + 영상처럼 2개 이상이면 UNION ALL이 여전히 필요하다. 없으면 cross product 발생.

```sql
-- 정상: 도메인별 분리 → 이미지 3건 + 영상 2건 = 5행
SELECT 'image' AS DMN_CD, LVL.IMAGE_RECORD_ID AS RECORD_ID FROM ...
UNION ALL
SELECT 'video' AS DMN_CD, LVL.VIDEO_RECORD_ID AS RECORD_ID FROM ...

-- 잘못됨: cross product → 3 × 2 = 6행
SELECT LVL.IMAGE_RECORD_ID, LVL.VIDEO_RECORD_ID FROM ...
```

## 수정 포인트

| 파일 | 변경 |
|------|------|
| DDL (CREATE TABLE) | 비정형 도메인의 RECORD_ID, FILE_PATH 컬럼 추가 |
| INSERT SELECT | 팩트 테이블에서 RECORD_ID, FILE_PATH 가져오도록 추가 |
| 데이터 조회 SELECT | 팩트 테이블 alias → 레벨 테이블 alias로 변경 |
| 데이터 조회 FROM | 팩트 테이블 JOIN 제거 |

## 관련 글

| 글 | 다루는 것 |
| --- | --- |
| [RDB에서 조인(Join) 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) | 조인 알고리즘과 옵티마이저의 전략 선택 |
| [Vertica에서 OR 조건 JOIN은 성능을 죽인다](/posts/db/2026-04-15-vertica-or-join-kills-performance/) | OR 조건이 Join Filter로 빠지는 문제와 의미를 보존한 매칭 쌍 분리 해법 |
| [정규화와 스키마 설계 — 1NF~BCNF와 역정규화](/posts/db/2026-07-03-database-normalization/) | 이 사례가 속한 역정규화의 이론과 판단 기준 |
| **RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선 (현재 글)** | INSERT 시점에 컬럼을 옮겨 조회 JOIN 자체를 제거 |

---
title       : "비정형 도메인 RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선"
description : "수천만 건 팩트 테이블 JOIN을 INSERT 시점에 미리 옮겨두면 조회 시 JOIN 자체가 사라진다."
date        : 2026-06-09 11:00:00 +0900
updated     : 2026-06-09 11:00:00 +0900
categories  : [db, "최적화·설계"]
tags        : [performance, join]
pin         : false
hidden      : false
---

대형 팩트 테이블(ECG/DICOM/VITAL)을 매번 JOIN하는 대신, 중간 테이블 INSERT 시점에 필요한 컬럼을 미리 넣어두면 조회 시 JOIN을 제거할 수 있다.

## 문제

비정형 도메인의 `RECORD_ID`, `FILE_PATH`를 가져오기 위해 데이터 조회(COUNT 포함)마다 수천만 건 팩트 테이블을 LEFT OUTER JOIN → COUNT만으로도 수십 초 소요.

```sql
-- 느림: 조회 시 팩트 테이블 JOIN
SELECT COUNT(*) FROM (
  SELECT ... FROM target_tbl TGT
  INNER JOIN level_tbl LVL ON ...
  LEFT OUTER JOIN CDW.FT_ECG_RECORDS ECG ON ...  -- 여기가 병목
) T
```

## 해결

레벨 테이블 CREATE/INSERT 시점에 RECORD_ID, FILE_PATH를 미리 넣어둔다. INSERT 시 이미 팩트 테이블을 접근하므로 추가 비용이 거의 없다.

```sql
-- INSERT 시 RECORD_ID 포함 (기존 JOIN에 컬럼만 추가)
CREATE TABLE level_tbl (PT_NO, HSP_TP_CD, GENDER, ECG_RECORD_ID, FILE_PATH)
INSERT INTO level_tbl
  SELECT DISTINCT ECG.PT_NO, ECG.HSP_TP_CD, ECG.GENDER,
         ECG.ECG_RECORD_ID, ECG.FILE_PATH  -- 추가
  FROM CDW.FT_ECG_RECORDS ECG ...

-- 빠름: 조회 시 팩트 테이블 JOIN 불필요
SELECT COUNT(*) FROM (
  SELECT ... LVL.ECG_RECORD_ID AS RECORD_ID
  FROM target_tbl TGT
  INNER JOIN level_tbl LVL ON ...
  -- 팩트 테이블 JOIN 없음
) T
```

## 다중 비정형 도메인 시 UNION ALL은 유지

ECG + DICOM처럼 2개 이상이면 UNION ALL이 여전히 필요하다. 없으면 cross product 발생.

```sql
-- 정상: 도메인별 분리 → ECG 3건 + DICOM 2건 = 5행
SELECT 'ecg' AS DMN_CD, LVL.ECG_RECORD_ID AS RECORD_ID FROM ...
UNION ALL
SELECT 'dicom' AS DMN_CD, LVL.DICOM_RECORD_ID AS RECORD_ID FROM ...

-- 잘못됨: cross product → 3 × 2 = 6행
SELECT LVL.ECG_RECORD_ID, LVL.DICOM_RECORD_ID FROM ...
```

## 수정 포인트

| 파일 | 변경 |
|------|------|
| DDL (CREATE TABLE) | 비정형 도메인의 RECORD_ID, FILE_PATH 컬럼 추가 |
| INSERT SELECT | 팩트 테이블에서 RECORD_ID, FILE_PATH 가져오도록 추가 |
| 데이터 조회 SELECT | 팩트 테이블 alias → 레벨 테이블 alias로 변경 |
| 데이터 조회 FROM | 팩트 테이블 JOIN 제거 |

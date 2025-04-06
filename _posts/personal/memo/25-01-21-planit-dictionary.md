---
title       : 플랜잇 용어 정리 
description : >-
date        : 2021-01-21 22:50:30 +0900
updated     : 2025-01-21 22:50:42 +0900
categories  : [personal, memo]
tags        : [planit]
pin         : false
hidden      : true
---

## HIS (Hospital Information System)
- 병원 정보 시스템 
- 실제로 병원에서 사용하는 시스템
- cdw (Clinical Data Warehouse) : 병원 정보 시스템에서 수집된 데이터를 저장하는 데이터 웨어하우스
- edw (Enterprise Data Warehouse) : 기업의 모든 데이터를 저장하는 데이터 웨어하우스

## EMR (Electronic Medical Record)
- 환자의 의료정보를 전자적으로 기록하는 시스템

## ODS (for planit)
- 야간시간을 이용해서 HIS를 복사한 시스템
- 조회 성능을 높이기 위해 별도 복제
- lshDtm(최종수정일시)를 기준으로 변경적재, 또는 볼륨작은 것 truncate 후 초기적재

## PT(PACT Table)
- 환자의 정보를 저장하는 테이블
- dw 팀에서 pact table을 위한 별도 작업

## LT(Lookup Table)
- 코드를 저장하는 테이블
- 플랜잇에서 사용하는 코드 테이블
>
- his를 기반으로 ods를 만들고, ods를 기반으로 dw팀에서 lt와 pt를 만든다.
- lt, pt를 또다시 만들어놓은게 코호트 마트

## 코호트 탐색 
- 컨테이너 - 도메인에서 설정한 조건으로 검색한 결과 >> 테이블로 만들어짐
- 레벨 - 컨테이너의 조합 >> 컨테이너가 생성한 테이블 조인
- 타겟 - 레벨의 조합 >> 레벨이 생성한 테이블 조인, 이것이 코호트 마트 검색의 데이터 소스가됨

- case design == 코호트 탐색
- output items == 출력 항목

## PACT ID
- 내원할 때마다 새로운 ID를 부여받는다.
- 내원시 진료부서나 의사가 다르면 새로운 ID를 부여받는다.
ex> 외래환자는 매번 새로운 ID를 부여받는다. 입원환자는 입원시 새로운 ID를 부여받는다.

## 인덱스 데이터
- 코호트 탐색을 효과적으로 검색 위해 날짜를 특정 기준으로 그룹핑하여 조회할 수 있도록 인덱스를 생성한다.

## 전향적 데이터 vs 후향적 데이터
- 전향적 데이터 : 미래를 예측하는 데이터
- 후향적 데이터 : 과거를 분석하는 데이터


---

## api 요청
실행 -> 구독 -> 조회
1. {apiUrl}/api/inquiry/level/run
2. {apiUrl}/sse/subscribe/OUTPUT_ITEMS_RUN
3. {apiUrl}/api/inquiry/level/data

> 조건 변경 없으면 3. 으로 바로 조회

## 코드
- GropuID >> 사용자 id

### 숙지 필요 코드
- core >> JobExecutorTest
- domain >> cds >> sql 

### 확인 필요
- ddl 생성할 때 룩업인 경우 뭘까? (DdlSqlServiceVerticaTest)
- sql mode vs query mode

---

## Planit CTDW
* ctms 스케쥴 정보와 cdw(연구검색)의 데이터를 연결해서 보여주는 시스템
- CTDW / Clinical Trial Data Warehouse / 임상시험 데이터 웨어하우스
- CTMS / Clinical Trial Management System / 임상시험 관리 시스템
- CRC / Clinical Research Coordinator / 병원 소속의 임상시험 조정자
- CRA / Clinical Research Associate / 제약회사 소속의 임상시험 조정자
- DCT / decentralized clinical trial / 분산형 임상시험 (환자가 병원을 방문하지 않고, 환자가 집에서 데이터를 수집하는 임상시험 (원외에서 접근))
- EDC / Electronic Data Capture / 전자 데이터 캡쳐
- OCR / Optical Character Recognition / 광학 문자 인식 (이미지를 기계가 읽을 수 있는 텍스트 포맷으로 변환하는 기술)

## 서울대병원
- EDC / Electronic Data Capture / 전자 데이터 캡쳐
- CTDW / Clinical Trial Data Warehouse / 임상시험 데이터 웨어하우스
- EMR / Electronic Medical Record / 전자 의료 기록
- CDW / Clinical Data Warehouse / 임상 데이터 웨어하우스
- DDC / Direct Data Capture / ?
- CTMS / Clinical Trial Management System / 임상시험 관리 시스템

## 충남대병원
- DCT_COPT / Decentralized Clinical Trial for patients with Chronic Obstructive Pulmonary Disease / 만성폐쇄성폐질환 환자 대상 분산형 임상시험
- DCT_ASTH / Decentralized Clinical Trial for patients with Asthma / 천식 환자 대상 분산형 임상시험
- eCOA / Electronic Clinical Outcome Assessment / 전자적 임상시험 결과 평가 / 대상자의 건강 상태, 질병의 진행, 치료의 효과를 측정하는 데 사용되는 모든 전자적 평가 도구
- ePRO / Electronic Patient-Reported Outcomes / 전자적 환자 보고 결과 / 환자 자신의 상태와 변화 등의 평가를 디지털 기기를 이용하여 입력

## 데브몬
- eIRB / Electronic Institutional Review Board / 연구 윤리 심의를 온라인으로 진행하는 전자 시스템 / 연구자가 연구 계획서를 제출하고, IRB 위원들이 심사 및 승인 과정을 전산화한 시스템
- ZPL / Zebra Programming Language / 제브라 프린터를 제어하기 위한 프로그래밍 언어
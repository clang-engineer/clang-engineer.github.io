---
layout  : wiki
title   : 
summary : 
date    : 2025-01-21 11:43:59 +0900
updated : 2025-02-02 20:06:27 +0900
tags    : 
toc     : true
public  : false
parent  : 
latex   : false
---
* TOC
{:toc}

# HIS (Hospital Information System)
- 병원 정보 시스템 
- 실제로 병원에서 사용하는 시스템
- cdw (Clinical Data Warehouse) : 병원 정보 시스템에서 수집된 데이터를 저장하는 데이터 웨어하우스
- edw (Enterprise Data Warehouse) : 기업의 모든 데이터를 저장하는 데이터 웨어하우스

# EMR (Electronic Medical Record)
- 환자의 의료정보를 전자적으로 기록하는 시스템

# ODS (for planit)
- 야간시간을 이용해서 HIS를 복사한 시스템
- 조회 성능을 높이기 위해 별도 복제
- lshDtm(최종수정일시)를 기준으로 변경적재, 또는 볼륨작은 것 truncate 후 초기적재

# PT(PACT Table)
- 환자의 정보를 저장하는 테이블
- dw 팀에서 pact table을 위한 별도 작업

# LT(Lookup Table)
- 코드를 저장하는 테이블
- 플랜잇에서 사용하는 코드 테이블

* his를 기반으로 ods를 만들고, ods를 기반으로 dw팀에서 lt와 pt를 만든다.
* lt, pt를 또다시 만들어놓은게 코호트 마트

# 코호트 탐색 
- 컨테이너 - 도메인에서 설정한 조건으로 검색한 결과 >> 테이블로 만들어짐
- 레벨 - 컨테이너의 조합 >> 컨테이너가 생성한 테이블 조인
- 타겟 - 레벨의 조합 >> 레벨이 생성한 테이블 조인, 이것이 코호트 마트 검색의 데이터 소스가됨

- case design == 코호트 탐색
- output items == 출력 항목


---
## api 요청
실행 -> 구독 -> 조회
1. {apiUrl}/api/inquiry/level/run
2. {apiUrl}/sse/subscribe/OUTPUT_ITEMS_RUN
3. {apiUrl}/api/inquiry/level/data

> 조건 변경 없으면 3. 으로 바로 조회

## backend
1. sse query 셋팅

# 코드
- GropuID >> 사용자 id


---
# 숙지 필요 코드
- core >> JobExecutorTest
- domain >> cds >> sql 


---
# 확인 필요
- ddl 생성할 때 룩업인 경우 뭘까? (DdlSqlServiceVerticaTest)

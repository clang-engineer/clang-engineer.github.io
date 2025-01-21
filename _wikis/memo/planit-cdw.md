---
layout  : wiki
title   : 
summary : 
date    : 2025-01-21 11:43:59 +0900
updated : 2025-01-21 13:28:22 +0900
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
1. 컨테이너 - 검색한 대상1
2. 레벨
3. 타겟

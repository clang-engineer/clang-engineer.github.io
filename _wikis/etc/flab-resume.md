---
layout  : wiki
title   : Flab resume 
summary : 
date    : 2024-01-23 08:38:09 +0900
updated : 2024-02-06 11:42:21 +0900
tags    : 
toc     : true
public  : false
parent  : [[etc/index]]
latex   : false
---
* TOC
{:toc}

# NAVER

## Scale up이 아닌 Scale out을 선택한 이유

## Scale out 구조로 인한 문제 - 로그인 정보 Session 공유 문제
1. Sticky Session 방식 장단점
2. Tomcat Session Clustering 방식 장단점
3. 외부 Session Clustering 방식 (Redis, Memcached) 장단점

## 이미지 리사이즈 
- 이미지 리사이즈가 필요했던 이유 (대용량 파일 전송 부담 )

1. 서버에서 리사이즈 하는 방식
2. 온디맨드 리사이즈 하는 방식
3. Aws Lambda를 사용한 서버리스 방식 사용 이유 (서버 부담 감소)
  
  
## 캐싱전략
- 캐싱전략을 사용한 이유, 각 캐싱전략의 장단점

1. 로컬 캐싱 전략 장단점
2. 글로벌 캐싱 전략 장단점


## 작업 방식
- 카카오 오븐, slack, google meet

---

# 무신사

## 프로젝트 요약
- Stress Test Tool과 APM Tool을 사용한 성능 튜닝


## 기술명세를 통한 커뮤니케이션

## Database Connection Pool 튜닝
- ngrinder를 통한 부하 테스트와 Pinpoint, Prometheus를 통한 모니터링

---

# 카카오 스타일 

---

# 카카오 페이
- Scale out 고려하여 개발 - session 공유 위해 Redis 사용
- aws s3 사용하여 가용성 및 안정성 확보
- 문서화: api spec (swagger), erd
- db io, 조인 최소화

---

# 넥슨
## 샘플1

### 개요
- Mapper 기반 -> JPA
- ncp 사용
- junit 단위 테스트

### 프로젝트 관리
- jenkins ci/cd -> ci - webhook을 통한 자동 배포 + 빌드 완료 후 shell 사용해서 결과 댓글, cd - shell script


## 샘플2
### 개요
- JPA 대신 Mybatis 사용 (jpa 단점)
 
### 프로젝트 관리
- git-flow (merge request(develop) -> review)
- kakao oven

### 상세 기능
1. 회원관리
- sticky session, session clustering, redis
- memcached vs redis

2. AOP를 사용한 권한 관리

3. MySQL Replication 구성
- Master-Slave 구성방
---

# HYPER CONNECT
- 소개(개발 스타일) -> 경력 -> 프로젝트 -> 학력 및 자격증

## 경력
- 기간, 역할
- 수행 >> 개선

1. 데이터 수집 및 가공 로직 개선하여 db저장 데이터 크기 10% 축소
2. 메모리 누수 추적하여 메모리 사용량 20%이하로 안정화
3. admin 페이지 개발

## 프로젝트
- 개요 >> 사용자 예측 >> 핵심 기능 개요

1. 공간 인덱싱을 통해 latency 20% 감소
2. api 별 latency를 측정하고 기준치 초과시 개선 >> db index, 쿼리 튜닝
3. github action + docker 로 ci/cd 체계 구축


---

# 식스샵
## 브랜치 관리, 문서화 (README, WIKI)

## 분산처리환경 대용량 트래픽 처리 
- sticky session, session clustering, session storage(redis, memcached)

## AOP를 활용한 로그인 체크 로직 분리
- 커스텀 어노테이션 사용

## 단위 테스트 작성

## 캐싱 전략
- 로컬 캐싱, 글로벌 캐싱
- Maxmemory, 데이터 Eviction 정책 LRU, LFU 


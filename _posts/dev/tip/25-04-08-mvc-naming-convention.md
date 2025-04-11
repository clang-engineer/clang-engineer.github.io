---
title       : MVC 계층별 메소드 네이밍 컨벤션
description : >-
date        : 2025-01-14 09:10:09 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, tip]
tags        : [mvc, convention]
pin         : false
hidden      : false
---

## 각 계층별 기본 규칙
- 컨트롤러
get/post/update/delete  >>  요청에 대한 의미를 강조

- 서비스
find/load/create/modify/remove  >> 비지니스 동작 의미 강조

- 리포지토리
findById / insert / delete  >> db 작업에 초점

## 예시
### id로 하나의 개체를 가져올 때 
URL: GET /api/v1/users/{id}

| 계층 | 메소드명 | 설명 |
| --- | --- | --- |
| Controller | getUserById | HTTP 요청 처리, REST 컨벤션에 맞춤 |
| Service | findUserById | 도메인 관점에서 '조회' 강조 |
| Repository | findById | 데이터베이스 관점 일반적인 조회 메소드 |

#### 모든 개체 가져올 때
URI: GET /users

| 계층 | 메소드명 | 설명 |
| --- | --- | --- |
| Controller | getAllUsers | RESTful 응답 처리 |
| Service | findAllUsers | 비즈니스적으로 전체 조회 |
| Repository | findAll | 일반적인 전체 레코드 조회 네이밍 |

###  개체를 생성할 때
URI: POST /api/v1/users

| 계층 | 메소드명 | 설명 |
| --- | --- | --- |
| Controller | createUser | HTTP 요청 처리, REST 컨벤션에 맞춤 |
| Service | createUser | 도메인 관점에서 '생성' 강조 |
| Repository | insert | 데이터베이스 관점 일반적인 삽입 메소드 |

### 개체를 수정할 때
URI: PUT /api/v1/users/{id} or PATCH /api/v1/users/{id}

| 계층 | 메소드명 | 설명 |
| --- | --- | --- |
| Controller | updateUser | HTTP 요청 처리, REST 컨벤션에 맞춤 |
| Service | modifyUser | 도메인 관점에서 '수정' 강조 |
| Repository | update | 데이터베이스 관점 일반적인 수정 메소드 |

### 개체를 삭제할 때
URI: DELETE /api/v1/users/{id}

| 계층 | 메소드명 | 설명 |
| --- | --- | --- |
| Controller | deleteUser | HTTP 요청 처리, REST 컨벤션에 맞춤 |
| Service | removeUser | 도메인 관점에서 '삭제' 강조 |
| Repository | deleteById | 데이터베이스 관점 일반적인 삭제 메소드 |


## respository 계층에서 select 대신 find를 쓰는 이유?
1. 추상화된 레이어
- select는 SQL 문법에 의존적이고, find는 객체지향적인 느낌
- 구현체가 JDBC, JPA, MongoDB 등 바뀌더라도 메서드 이름은 유지 가능.

2. 직관성과 일관성
- findById, findAll, findByName 같은 이름은 사람이 읽기에 명확하고, 익숙함.
- selectById라고 하면 마치 SQL 쿼리처럼 보여서 오히려 Repository가 너무 로우레벨처럼 느껴질 수 있음.

3. ORM과의 일관성
- JPA, Hibernate 같은 ORM 프레임워크에서는 find라는 용어를 많이 사용함.
- select는 SQL 쿼리와 관련된 용어라 ORM의 추상화 레이어와 맞지 않음.
- find는 객체를 찾는다는 의미로, ORM의 목적과 잘 맞음.

> <-> insert, update, delete는 일반적인 CRUD 개념이자 비즈니스 용어와도 가깝다

| 용어 | 뉘앙스 |
| --- | --- |
| select | 데이터를 어떻게 가져오는가 (방법 중심) |
| find | 어떤 데이터를 찾고 싶은가 (목적 중심) |
| insert | 데이터를 추가하다 (동작 자체가 명확) |
| update | 데이터를 수정하다 |
| delete | 데이터를 제거하다 |

→ select만 유독 SQL 냄새가 너무 강해서 Repository 레이어에서는 의미적인 find를 쓰고, 나머지는 자연스럽게 받아들여짐.

## 결론
- Service 계층에서 find, create, modify, remove 같은 의미 중심 동사를 쓰면 가독성이 좋아짐.
- Repository는 최대한 단순하고 DB 친화적인 이름으로 유지 (insert, update, findById, deleteById 등).  
- Controller는 RESTful한 HTTP 동작과 1:1 매핑되는 이름을 쓰는 게 직관적이야.




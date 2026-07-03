---
title       : "MVC 계층별 메소드 네이밍 컨벤션"
description : "Controller/Service/Repository 등 MVC 각 계층의 메소드 네이밍 패턴과 실무 규칙 정리"
date        : 2025-01-14 09:10:09 +0900
updated     : 2026-07-03
categories  : [spring-boot, "설정·아키텍처"]
tags        : [mvc, rest, jpa]
pin         : false
hidden      : false
---

아래 정리한 규칙은 "정답"이 아니라 **널리 쓰이는 관행 중 하나**다. 팀마다 다른 컨벤션(예: 조회를 전부 `get`으로 통일, 서비스도 `create`/`update`로 맞추기)도 충분히 합리적이다. 핵심은 **계층마다 관심사가 다르니, 이름도 그 계층의 관심사를 드러내게 하자**는 것이다. 아래는 그 관점에서 내가 쓰는 방식과 각각의 "왜"다.

## 각 계층별 기본 규칙

- **컨트롤러**: `get/post/update/delete` → HTTP 요청 자체의 의미를 강조
  - 왜: 컨트롤러의 관심사는 "어떤 HTTP 요청을 처리하는가"다. HTTP 메서드와 1:1로 읽히면 엔드포인트를 훑을 때 동작이 바로 보인다.
- **서비스**: `find/load/create/modify/remove` → 비즈니스 동작 의미를 강조
  - 왜: 서비스는 도메인 언어로 말하는 계층이다. HTTP나 DB 용어가 아니라 "무엇을 하는가"(조회/생성/수정/삭제)가 드러나야 유스케이스를 읽기 쉽다.
- **리포지토리**: `findById / insert / delete` → DB 작업에 초점
  - 왜: 리포지토리는 저장소와 가장 가까운 계층이라, DB·ORM에서 관용적으로 쓰는 이름을 그대로 따르는 편이 예측 가능성이 높다.

## URI 네이밍 규칙

엔드포인트 경로는 URL이 아니라 정확히는 **URI**(리소스를 식별하는 문자열)다. `GET /api/v1/users/{id}` 같은 경로가 여기에 해당한다. 아래 예시에서도 라벨을 `URI`로 통일한다.

REST에서 흔히 쓰는 URI 관행과 그 이유:

- **복수 명사로 컬렉션을 표현**한다 (`/users`, `/users/{id}`).
  - 왜: `/users`는 "사용자 컬렉션", `/users/{id}`는 "그 컬렉션 안의 한 항목"으로 자연스럽게 읽힌다. 단수(`/user`)로 쓰면 컬렉션과 단건의 구분이 흐려진다.
- **경로에 동사를 넣지 않고, 동작은 HTTP 메서드로 표현**한다 (`POST /users` ⭕, `POST /users/create` ❌).
  - 왜: 동작(조회/생성/수정/삭제)은 이미 `GET/POST/PUT/PATCH/DELETE`가 담당한다. 경로에까지 동사를 넣으면 의미가 중복되고, 같은 리소스에 대한 URI가 동작마다 갈라진다.
- **여러 단어는 kebab-case로** 잇는다 (`/order-items`).
  - 왜: URI는 대소문자를 구분할 수 있어 camelCase는 실수를 부르고, `_`는 밑줄 표시와 겹쳐 잘 안 보인다. `-`가 사람과 검색엔진 모두에게 가장 무난해 관행으로 굳었다.

> 이 역시 절대 규칙은 아니다. 다만 위 세 가지는 REST 생태계에서 거의 표준처럼 통용되므로 특별한 이유가 없다면 따르는 편이 협업에 유리하다.
{: .prompt-tip }

## 예시

아래 예시는 모두 `/api/v1/users` 리소스를 기준으로 한다.

### id로 하나의 개체를 가져올 때

URI: GET /api/v1/users/{id}

| 계층 | 메소드명 | 설명 |
| --- | --- | --- |
| Controller | getUserById | HTTP 요청 처리, REST 컨벤션에 맞춤 |
| Service | findUserById | 도메인 관점에서 '조회' 강조 |
| Repository | findById | 데이터베이스 관점 일반적인 조회 메소드 |

### 모든 개체 가져올 때

URI: GET /api/v1/users

| 계층 | 메소드명 | 설명 |
| --- | --- | --- |
| Controller | getAllUsers | RESTful 응답 처리 |
| Service | findAllUsers | 비즈니스적으로 전체 조회 |
| Repository | findAll | 일반적인 전체 레코드 조회 네이밍 |

### 개체를 생성할 때

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


## Repository 계층에서 select 대신 find를 쓰는 이유?
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




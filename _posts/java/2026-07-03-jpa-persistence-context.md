---
title       : "JPA/ORM 핵심 — 영속성 컨텍스트·지연 로딩·N+1"
description : "JPA 영속성 컨텍스트의 1차 캐시·변경 감지·쓰기 지연, 지연 로딩 프록시와 LazyInitializationException, 그리고 N+1을 fetch join·@EntityGraph·@BatchSize로 없애는 법."
date        : 2026-07-03 17:30:00 +0900
updated     : 2026-07-03 17:30:00 +0900
categories  : [java, "프레임워크·실무"]
tags        : [jpa, orm, hibernate, n-plus-1]
permalink   : /posts/db/2026-07-03-jpa-persistence-context/
pin         : false
hidden      : false
---

JPA를 SQL을 대신 짜 주는 도구쯤으로 여기면 반드시 두 지점에서 넘어진다. 트랜잭션 밖에서 `LazyInitializationException`이 튀거나, 목록 화면 하나에 쿼리 수백 건이 나가는 N+1이다. 둘 다 원인은 하나 — **영속성 컨텍스트(persistence context)**가 언제 무엇을 하는지 모르는 것이다. JPA는 SQL 생성기가 아니라 엔티티의 생명주기를 관리하는 상태 머신이고, 그 중심에 영속성 컨텍스트가 있다. 이 글은 Hibernate 6.x / Spring Boot 3.x 기준이다.

## 1. ORM이 푸는 문제 — 임피던스 불일치

객체 모델과 관계형 모델은 설계 철학이 다르다. 객체는 참조로 연결되고(`order.getMember()`) 상속·다형성을 쓰지만, 테이블은 외래 키로 연결되고 상속이 없다. 이 간극을 **객체-관계 임피던스 불일치(impedance mismatch)**라 부른다. ORM은 이 변환을 자동화해, 개발자가 SQL이 아니라 객체 그래프를 다루게 한다.

MyBatis와 JPA는 이 문제를 정반대로 접근한다.

| | MyBatis (SQL 매퍼) | JPA (ORM) |
| --- | --- | --- |
| 중심 | 개발자가 쓴 SQL | 엔티티 객체 상태 |
| 매핑 | SQL 결과 ↔ 객체 (수동) | 객체 그래프 ↔ 테이블 (자동) |
| INSERT/UPDATE | 직접 작성 | 상태 변화 감지 후 자동 생성 |
| 상태 추적 | 없음 (조회 즉시 끝) | 영속성 컨텍스트가 추적 |
| 통제력 | SQL 완전 통제 | 추상화 뒤에 SQL 숨음 |

MyBatis는 SQL을 직접 쥐므로 복잡한 쿼리·튜닝에 강하지만 반복 CRUD가 지루하다. JPA는 반복을 없애고 객체 중심으로 생산성이 높지만, 생성되는 SQL을 이해하지 못하면 성능이 무너진다. **"SQL을 안 짜도 된다"가 아니라 "SQL이 어떻게 생성되는지 알아야 한다"**가 JPA다.

## 2. 영속성 컨텍스트

영속성 컨텍스트는 엔티티를 보관·관리하는 논리적 공간이다. `EntityManager`(Spring에선 트랜잭션 범위)를 통해 접근하며, 여기서 JPA의 핵심 기능 대부분이 나온다.

### 1차 캐시와 동일성 보장

영속 상태 엔티티는 영속성 컨텍스트 안 **1차 캐시**에 `@Id`를 키로 저장된다. 같은 트랜잭션에서 같은 ID를 다시 조회하면 DB에 안 가고 캐시에서 반환한다.

```java
Member m1 = em.find(Member.class, 1L); // SELECT 발생
Member m2 = em.find(Member.class, 1L); // 캐시 히트, SELECT 없음
assert m1 == m2;                        // 동일성 보장 (== 성립)
```

같은 영속성 컨텍스트 안에서 같은 엔티티는 **동일한 인스턴스**임이 보장된다(`==` 성립). 이게 애플리케이션 레벨 반복 읽기(repeatable read)를 만든다.

### 쓰기 지연 (write-behind)

`persist()`를 호출해도 INSERT가 즉시 나가지 않는다. SQL은 **쓰기 지연 SQL 저장소**에 모였다가 flush 시점에 한꺼번에 나간다.

```java
em.persist(memberA);
em.persist(memberB);
```

### 변경 감지 (dirty checking)

영속 상태 엔티티는 조회 시점의 **스냅샷**을 함께 보관한다. flush 때 현재 값과 스냅샷을 비교해 달라진 필드가 있으면 UPDATE를 자동 생성한다.

```java
Member m = em.find(Member.class, 1L);
m.setName("변경");
```

### flush 시점

flush는 쌓인 쓰기 지연 SQL을 DB에 반영하는 동작이다(≠ 커밋).

1. 트랜잭션 커밋 직전
2. JPQL 쿼리 실행 직전
3. `em.flush()` 직접 호출

## 3. 엔티티 생명주기

| 상태 | 의미 | 영속성 컨텍스트 관리 |
| --- | --- | --- |
| transient | `new`로 막 만든 객체 | X |
| managed | `persist()`·조회로 관리됨 | O |
| detached | 관리됐다가 분리됨 | X |
| removed | `remove()` 호출, 삭제 예정 | O |

## 4. 지연 로딩과 프록시

연관 엔티티를 항상 함께 로딩하면 낭비다. JPA는 **지연 로딩(lazy)**으로 실제 사용하는 시점까지 조회를 미룬다.

- `FetchType.LAZY` — 연관 엔티티 자리에 프록시를 넣고 접근 시 SELECT
- `FetchType.EAGER` — 엔티티 조회 시 연관도 즉시 조회

```java
@Entity
class Order {
    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;
}
```

### LazyInitializationException

프록시 초기화는 영속성 컨텍스트가 살아 있을 때만 가능하다. 트랜잭션 종료 후 초기화되지 않은 프록시에 접근하면 예외가 발생한다.

해결은 필요한 데이터를 트랜잭션 안에서 fetch join·EntityGraph로 미리 로딩하거나 DTO로 변환하는 것이다.

## 5. N+1 문제

목록 조회 후 지연 연관을 반복 접근하면 최초 조회 1회 + 연관 조회 N회가 발생한다.

```java
List<Order> orders = em.createQuery("select o from Order o", Order.class)
                       .getResultList();

for (Order o : orders) {
    o.getMember().getName();
}
```

EAGER로 바꾸는 것만으로는 근본 해결이 아니다. 조회 방식을 바꿔야 한다.

## 6. N+1 해결

### fetch join

```java
select o from Order o join fetch o.member
```

### `@EntityGraph`

```java
@EntityGraph(attributePaths = "member")
List<Order> findAll();
```

### `@BatchSize`

여러 프록시를 하나씩 조회하지 않고 지정한 크기 단위로 묶어 조회한다.

## 정리

JPA를 이해할 때 핵심은 다음 흐름이다.

```text
Entity
  ↓
Persistence Context
├─ 1차 Cache
├─ Dirty Checking
└─ Write-Behind
  ↓
Lazy Loading / Proxy
  ↓
N+1 / LazyInitializationException
  ↓
Fetch Strategy 설계
```

JPA는 SQL을 숨기는 도구가 아니라 **객체 상태와 DB 반영 시점을 관리하는 ORM 실행 모델**로 이해하는 편이 정확하다.

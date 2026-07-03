---
title       : "JPA/ORM 핵심 — 영속성 컨텍스트·지연 로딩·N+1"
description : "JPA 영속성 컨텍스트의 1차 캐시·변경 감지·쓰기 지연, 지연 로딩 프록시와 LazyInitializationException, 그리고 N+1을 fetch join·@EntityGraph·@BatchSize로 없애는 법."
date        : 2026-07-03 17:30:00 +0900
updated     : 2026-07-03 17:30:00 +0900
categories  : [db, "도구·연동"]
tags        : [jpa, orm, hibernate, n-plus-1]
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
em.persist(memberA); // INSERT를 저장소에 쌓아둠, 아직 DB 안 감
em.persist(memberB); // 마찬가지
// flush 시점에 INSERT 2건이 함께 전송 (JDBC 배치 가능)
```

### 변경 감지 (dirty checking)

영속 상태 엔티티는 조회 시점의 **스냅샷**을 함께 보관한다. flush 때 현재 값과 스냅샷을 비교해 달라진 필드가 있으면 UPDATE를 자동 생성한다. **`update()` 같은 메서드는 없다.**

```java
Member m = em.find(Member.class, 1L);
m.setName("변경");   // set만 하면 끝. 별도 저장 호출 불필요
// flush 시 스냅샷과 비교 → UPDATE 자동 생성
```

이게 JPA에서 가장 많이 놓치는 지점이다. 조회한 엔티티의 필드를 바꾸면, 의도치 않아도 UPDATE가 나간다.

### flush 시점

flush는 쌓인 쓰기 지연 SQL을 DB에 반영하는 동작이다(≠ 커밋). 세 경우에 일어난다.

1. **트랜잭션 커밋 직전** (가장 흔함)
2. **JPQL 쿼리 실행 직전** — 아직 flush 안 된 변경이 쿼리 결과에 반영되도록
3. `em.flush()` 직접 호출

> 영속성 컨텍스트는 1차 캐시(동일성)·쓰기 지연·변경 감지를 제공하는 상태 저장소다. 조회한 엔티티는 트랜잭션이 끝날 때까지 "감시" 아래 있고, 필드를 바꾸면 UPDATE가 자동으로 나간다.

## 3. 엔티티 생명주기

엔티티는 네 상태를 오간다.

| 상태 | 의미 | 영속성 컨텍스트 관리 |
| --- | --- | --- |
| **transient(비영속)** | `new`로 막 만든 객체, JPA가 모름 | X |
| **managed(영속)** | `persist()`·조회로 컨텍스트에 관리됨 | O (변경 감지·1차 캐시 적용) |
| **detached(준영속)** | 관리됐다가 분리됨 (트랜잭션 종료·`detach()`·`clear()`) | X |
| **removed(삭제)** | `remove()` 호출, flush 시 DELETE 예정 | O (삭제 표시) |

```java
Member m = new Member();        // transient
em.persist(m);                  // managed
em.detach(m);                   // detached (변경 감지 안 됨)
Member m2 = em.find(Member.class, 1L);
em.remove(m2);                  // removed
```

핵심은 **detached는 변경 감지가 안 된다**는 것이다. 트랜잭션이 끝나면 엔티티는 준영속이 되고, 이후 필드를 바꿔도 DB에 반영되지 않는다. 다음 절의 예외도 여기서 비롯된다.

## 4. 지연 로딩과 프록시

연관 엔티티를 항상 함께 로딩하면 낭비다. JPA는 **지연 로딩(lazy)**으로, 실제 사용하는 시점까지 조회를 미룬다.

- `FetchType.LAZY` — 연관 엔티티 자리에 **프록시**를 넣고, 접근하는 순간 SELECT.
- `FetchType.EAGER` — 엔티티 조회 시 연관도 즉시 함께 조회.

```java
@Entity
class Order {
    @ManyToOne(fetch = FetchType.LAZY) // 권장 기본값
    private Member member;
}
```

권장은 **모든 연관을 LAZY로** 두는 것이다. `@ManyToOne`·`@OneToOne`은 기본이 EAGER라 명시적으로 LAZY로 바꾼다(`@OneToMany`·`@ManyToMany`는 기본 LAZY). EAGER는 조회 경로를 예측하기 어렵게 만들고 뒤의 N+1을 키운다.

### 프록시 초기화

LAZY 연관은 진짜 엔티티 대신 Hibernate가 만든 **프록시**(상속 기반 가짜 객체)로 채워진다. `getId()`처럼 이미 아는 식별자만 쓰면 프록시는 그대로지만, 다른 필드에 접근하면 그때 SELECT가 나가며 **초기화**된다.

```java
Order order = em.find(Order.class, 1L);
Member member = order.getMember(); // 프록시 (SELECT 없음)
member.getName();                  // 여기서 SELECT 발생, 프록시 초기화
```

### LazyInitializationException

프록시 초기화는 **영속성 컨텍스트가 살아 있을 때만** 가능하다. 트랜잭션이 끝나 엔티티가 준영속(detached)이 된 뒤 초기화 안 된 프록시에 접근하면 이 예외가 터진다.

```java
@Transactional
public Order find(Long id) {
    return orderRepository.findById(id).get(); // member는 프록시
} // 트랜잭션 종료 → 준영속

// 컨트롤러/뷰에서
order.getMember().getName(); // LazyInitializationException
```

전형적으로 서비스에서 엔티티를 반환하고 컨트롤러·JSON 직렬화 단계에서 지연 연관을 건드릴 때 발생한다. 해결은 **필요한 데이터를 트랜잭션 안에서 미리 로딩**(fetch join·EntityGraph)하거나, 애초에 DTO로 변환해 반환하는 것이다. OSIV(7절)로 세션을 늘려 덮는 건 근본 해결이 아니다.

## 5. N+1 문제 (JPA 원인)

목록 조회에서 지연 로딩은 N+1을 부른다. 원인은 단순하다 — **JPQL은 명시한 엔티티만 조회하고, 지연 연관은 접근할 때마다 별도 쿼리**를 내기 때문이다.

```java
// 주문 목록 조회 (1번)
List<Order> orders = em.createQuery("select o from Order o", Order.class)
                       .getResultList();
// SELECT * FROM orders

for (Order o : orders) {
    o.getMember().getName(); // 주문마다 member 프록시 초기화 (N번)
    // SELECT * FROM member WHERE id = ?  ← 행마다 반복
}
```

주문이 20건이면 `1 + 20 = 21`쿼리, 1,000건이면 1,001쿼리다. 개별 쿼리는 빨라도 **왕복 횟수**가 병목이 된다.

주의할 함정 하나 — **EAGER로 바꾼다고 해결되지 않는다.** EAGER여도 JPQL(`select o from Order o`)로 조회하면 Hibernate는 우선 주문만 가져온 뒤, EAGER 연관을 채우려 행마다 추가 SELECT를 낸다. 오히려 조회 시점을 통제 못 해 더 나쁘다. `em.find()`는 EAGER를 조인으로 처리하지만, JPQL은 그렇지 않다는 게 핵심이다.

> N+1은 지연 로딩 자체의 버그가 아니라 **"목록을 엔티티로 조회하고 연관을 루프에서 접근"**하는 패턴에서 필연적으로 나온다. FetchType로는 해결되지 않는다. 조회 방식을 바꿔야 한다.

## 6. N+1 해결

핵심은 **N번의 개별 조회를 1~2번의 묶음 조회로 바꾸는 것**이다. 상황별로 처방이 다르다.

### (1) fetch join — 한 쿼리에 연관까지

JPQL에서 `join fetch`로 연관을 함께 조회한다. 조인 결과를 영속 상태 엔티티로 채우므로 프록시가 남지 않는다.

```java
select o from Order o join fetch o.member
// → orders JOIN member 단일 쿼리
```

- `@ManyToOne`·`@OneToOne` 같은 단일 연관에 최적. 명시적·확실하다.
- 단점: 쿼리마다 fetch 대상을 JPQL에 박아야 해 재사용이 떨어진다.

### (2) @EntityGraph — 애노테이션으로 fetch join

같은 효과를 Spring Data JPA 리포지토리 메서드에 선언적으로 건다. JPQL을 다시 안 써도 된다.

```java
@EntityGraph(attributePaths = "member")
List<Order> findAll();
// findAll을 member까지 fetch join으로 실행
```

fetch join과 사실상 동일한 SQL을 내되, 메서드 시그니처는 그대로 두고 로딩 계획만 얹는다. 표준 리포지토리 메서드에 N+1만 없애고 싶을 때 편하다.

### (3) @BatchSize / default_batch_fetch_size — IN 배치 로딩

지연 로딩은 유지하되, 프록시 초기화를 **행마다 하나씩이 아니라 IN 절로 묶어** 낸다. `1 + N`이 `1 + (N/배치크기)`로 준다.

```yaml
# application.yml — 전역 적용
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 100
```

```java
// 또는 연관별로
@OneToMany(mappedBy = "order")
@BatchSize(size = 100)
private List<OrderItem> items;
```

```sql
-- 행마다 SELECT 대신, 모은 키를 IN으로 한 번에
SELECT * FROM member WHERE id IN (1, 2, 3, /* ... */ 100);
```

**컬렉션(1:N) 연관에 특히 유효하다.** fetch join은 컬렉션에서 행이 곱해지는 문제가 있는데(아래 함정), 배치 로딩은 목록을 먼저 뽑고 컬렉션만 IN으로 채우므로 페이지네이션과 충돌하지 않는다. 실무에서 `default_batch_fetch_size`를 전역으로 켜 두는 게 기본 방어선이다.

### (4) DTO 프로젝션 — 애초에 엔티티를 안 쓴다

조회 전용 화면이면 엔티티가 아니라 필요한 필드만 DTO로 뽑는다. 영속성 컨텍스트·프록시·N+1 자체가 성립하지 않는다.

```java
select new com.app.OrderView(o.id, m.name)
from Order o join o.member m
```

읽기 전용이고 변경 감지가 필요 없다면 가장 가볍고 안전하다. 대신 조회 후 수정은 불가능하다.

### 언제 무엇을 쓰나

| 상황 | 처방 |
| --- | --- |
| 단일 연관(`@ManyToOne`), 특정 쿼리 | fetch join |
| 표준 리포지토리 메서드에 로딩만 얹기 | @EntityGraph |
| 컬렉션 연관 + 페이지네이션 | @BatchSize / default_batch_fetch_size |
| 전역 기본 방어선 | default_batch_fetch_size |
| 읽기 전용 조회 화면 | DTO 프로젝션 |

## 7. 실무 주의

### OSIV 트레이드오프

**OSIV(Open Session In View)**는 영속성 컨텍스트를 트랜잭션이 아니라 **HTTP 요청 전체 수명**에 걸어 둔다. 그래서 컨트롤러·뷰 렌더링·JSON 직렬화 단계에서도 지연 로딩이 가능해 `LazyInitializationException`이 안 난다. Spring Boot는 `spring.jpa.open-in-view`를 **기본 `true`**로 두고, 명시적으로 설정하지 않으면 시작 시 경고를 남긴다.

편해 보이지만 대가가 있다.

- DB 커넥션을 **응답이 끝날 때까지** 붙잡는다. 뷰 렌더링·직렬화가 느리면 커넥션 풀이 오래 점유돼 고부하에서 고갈된다.
- 트랜잭션 밖(뷰·직렬화 단계)에서 지연 로딩이 발생해, 쿼리가 예측 못 한 시점에 나가고 N+1이 숨는다.

트래픽이 큰 서비스나 외부 호출이 섞인 요청이면 `open-in-view: false`로 끄고, **필요한 로딩은 서비스 트랜잭션 안에서 명시적으로**(fetch join·EntityGraph·DTO) 끝내는 편을 권한다. 끄면 준영속 접근이 바로 예외로 드러나 로딩 누락을 개발 단계에서 잡을 수 있다.

### fetch join + 페이지네이션 함정

**컬렉션(1:N)을 fetch join 하면서 페이지네이션(`setFirstResult`/`setMaxResults`)을 걸면 안 된다.** 조인으로 행이 곱해져 DB에서 자를 수 없기 때문에, Hibernate는 전체 결과를 메모리로 읽어와 애플리케이션에서 페이징한다(경고 로그와 함께). 데이터가 크면 OOM이다. 컬렉션 + 페이지네이션은 **fetch join 대신 `default_batch_fetch_size`/`@BatchSize`**로 풀어야 한다.

## 관련 글

| 글 | 이 글과의 접점 |
| --- | --- |
| [MyBatis 관련 기록](/posts/db/2021-11-22-mybatis/) | SQL 매퍼 방식 — JPA와 대비되는 접근 |
| [쿼리 튜닝 — 페이지네이션·N+1](/posts/db/2026-07-03-query-tuning-pagination-nplus1/) | N+1의 SQL 일반 관점과 배치 로딩 |

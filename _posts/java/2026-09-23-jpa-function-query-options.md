---
title       : "JPA에서 함수는 어디에 써야 할까 — JPQL 표준 함수, DB 함수 호출, Repository 확장"
description : "JPA에서 문자열·날짜·DB 전용 함수를 표현하는 여러 방법을 비교하고, JPQL 표준 함수, DB 함수 호출, Repository 확장, QueryDSL, Criteria API, Native Query를 언제 선택할지 정리한다."
date        : 2026-09-23 00:00:00 +0900
updated     : 2026-09-23 00:00:00 +0900
categories  : [java, "프레임워크·실무"]
tags        : [jpa, jpql, querydsl, hibernate, sql, guide]
permalink   : /posts/java/2026-09-23-jpa-function-query-options/
pin         : false
hidden      : false
---

JPA를 쓰다 보면 단순 조회 조건만으로는 부족해지는 순간이 온다. 이름을 대소문자 없이 비교해야 하고, 날짜를 `yyyy-MM-dd`로 잘라야 하며, DB가 제공하는 전용 함수를 써야 할 때도 있다. 이때 선택지는 하나가 아니다. JPQL 표준 함수, `function()`을 통한 DB 함수 호출, Spring Data JPA 메서드 쿼리, Repository 확장, QueryDSL, Criteria API, Native Query가 모두 후보가 된다.

여기서 `upper`, `lower`, `concat` 같은 것은 Java 기본 함수가 아니라 JPQL이 정의한 쿼리 함수다. Hibernate 같은 JPA 구현체가 이를 실제 DB SQL 함수 호출로 번역한다.

문제는 “함수를 어떻게 호출하느냐”보다 “어느 추상화 수준에서 해결하느냐”다. JPA는 SQL을 완전히 숨기는 도구가 아니라, 객체 모델과 SQL 사이의 경계를 관리하는 도구다. 함수 사용 방식도 이 경계 위에서 선택해야 한다.

## 먼저 선택 기준부터 잡기

실무에서는 다음 순서로 생각하면 대체로 무리가 없다.

| 상황 | 우선 선택 |
| --- | --- |
| 표준 문자열·숫자·날짜 함수로 충분하다 | JPQL 표준 함수 |
| DB 전용 함수가 1~2개 필요하다 | DB 함수 호출: JPQL `function()` |
| 공통 조회 로직을 여러 Repository에서 재사용한다 | Repository 확장 |
| 조건 조합이 많고 타입 안정성이 필요하다 | QueryDSL |
| 표준 JPA API만 써야 한다 | Criteria API |
| SQL 자체가 핵심이거나 DB 특화 문법이 크다 | Native Query |

핵심 기준은 이식성, 가독성, 타입 안정성, DB 종속성이다. JPQL 표준 함수는 이식성이 좋지만 표현력이 제한된다. Native Query는 가장 강력하지만 JPA 추상화 밖으로 나간다.

## 1. JPQL 표준 함수 — 표준 안에서 해결할 수 있을 때

가장 먼저 볼 선택지는 JPQL이 기본 제공하는 함수다.

```java
@Query("select upper(u.name) from User u")
List<String> findUpperNames();
```

대표적으로 다음 함수들이 있다.

```text
upper, lower, length, trim, concat, substring, locate
abs, sqrt, mod
current_date, current_time, current_timestamp
coalesce, nullif
```

이 방식의 장점은 JPA 표준에 가깝고 읽기 쉽다는 점이다. 예를 들어 이름을 소문자로 바꿔 비교하거나, null 값을 대체하는 정도라면 굳이 DB 전용 함수까지 내려갈 필요가 없다.

```java
@Query("""
  select u
  from User u
  where lower(u.name) = lower(:name)
""")
List<User> findByNameIgnoreCase(@Param("name") String name);
```

단점은 DB가 제공하는 풍부한 함수 전체를 표현하지 못한다는 점이다. 날짜 포맷팅, JSON 함수, 정규식 함수처럼 DB별 차이가 큰 기능은 JPQL 표준 함수만으로 부족하다.

## 2. `function()` — JPQL 안에서 DB 함수를 호출하기

DB 전용 함수를 써야 하지만 쿼리 전체를 Native SQL로 바꾸고 싶지 않다면 `function()`을 쓴다.

```java
@Query("""
  select function('date_format', u.createdAt, '%Y-%m-%d')
  from User u
""")
List<String> findCreatedDates();
```

`function('함수명', 인자...)` 형태로 DB 함수명을 문자열로 넘긴다. Hibernate는 이를 SQL 함수 호출로 변환한다.

이 방식은 JPQL의 엔티티 중심 표현을 유지하면서 필요한 부분만 DB 함수로 내려갈 수 있다는 점이 좋다. 하지만 함수명과 인자 의미는 DB에 종속된다. 위 예시는 MySQL의 `date_format`에 의존하므로 PostgreSQL로 바꾸면 그대로 동작하지 않는다.

따라서 `function()`은 “쿼리 대부분은 JPQL로 충분하지만 일부 표현만 DB 함수가 필요한 경우”에 적합하다.

## 3. Spring Data JPA 메서드 쿼리 — 함수가 아니라 단순 조건이면 충분할 때

가끔은 함수가 필요한 것처럼 보이지만, 사실 단순 조건 검색이면 충분한 경우가 있다.

```java
List<User> findByNameContaining(String keyword);
List<User> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
```

메서드 쿼리는 SQL 함수를 직접 호출하는 방식은 아니다. 대신 Spring Data JPA가 메서드 이름을 해석해 조건 쿼리를 만든다.

예를 들어 날짜를 문자열로 포맷해서 비교하려는 요구가 있다고 하자. 화면에서 특정 날짜의 데이터를 보고 싶은 것뿐이라면 `date_format(created_at, ...) = ?`보다 시작·끝 시각 범위로 조회하는 편이 나을 수 있다.

```java
List<Order> findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
    LocalDateTime start,
    LocalDateTime end
);
```

이 방식은 인덱스를 활용하기도 쉽다. 컬럼에 함수를 씌우면 DB가 인덱스를 제대로 쓰지 못하는 경우가 많기 때문이다.

## 4. Repository 확장 — 공통 조회 함수를 직접 붙이기

`JpaRepository`를 `extends`해서 쓰는 방식도 있다. 이때 핵심은 DB 함수 호출 문법이 아니라, 반복되는 조회 로직을 Repository 인터페이스에 자연스럽게 붙이는 것이다.

```java
public interface UserRepository
    extends JpaRepository<User, Long>, UserRepositoryCustom {
}

public interface UserRepositoryCustom {
    List<User> searchByKeyword(String keyword);
}
```

구현체에서는 `EntityManager`, QueryDSL, Criteria API 중 하나를 선택해 실제 쿼리를 작성한다.

```java
@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<User> searchByKeyword(String keyword) {
        return queryFactory
            .selectFrom(user)
            .where(user.name.containsIgnoreCase(keyword))
            .fetch();
    }
}
```

이 방식은 다음 상황에 잘 맞는다.

- 메서드 이름 쿼리로 표현하기엔 조건이 길다.
- `@Query` 문자열이 Repository에 계속 쌓인다.
- 여러 조회 조건을 하나의 의미 있는 메서드로 감추고 싶다.
- QueryDSL 같은 구현 기술을 서비스 계층에 노출하고 싶지 않다.

즉 `extends`류의 방식은 “함수를 호출하는 문법”이라기보다 “조회 기능을 Repository API로 설계하는 방식”에 가깝다.

## 5. QueryDSL — 동적 쿼리와 타입 안정성이 필요할 때

조건 조합이 많아지면 문자열 기반 JPQL은 금방 지저분해진다. 이때 QueryDSL을 쓰면 타입 안정성을 유지하면서 쿼리를 조립할 수 있다.

```java
queryFactory
    .select(user.name.upper())
    .from(user)
    .fetch();
```

QueryDSL이 제공하는 기본 표현으로 해결되지 않는 DB 함수는 template으로 표현한다.

```java
StringTemplate createdDate = Expressions.stringTemplate(
    "function('date_format', {0}, {1})",
    user.createdAt,
    ConstantImpl.create("%Y-%m-%d")
);
```

QueryDSL의 장점은 함수 호출 자체보다 동적 조건 구성에서 더 크게 드러난다.

```java
BooleanBuilder builder = new BooleanBuilder();

if (keyword != null && !keyword.isBlank()) {
    builder.and(user.name.containsIgnoreCase(keyword));
}

if (from != null) {
    builder.and(user.createdAt.goe(from));
}

if (to != null) {
    builder.and(user.createdAt.lt(to));
}

return queryFactory
    .selectFrom(user)
    .where(builder)
    .fetch();
```

즉 QueryDSL은 “함수를 쓰기 위한 도구”라기보다, 복잡한 조회 요구를 안전하게 조립하기 위한 선택지다.

## 6. Criteria API — 표준이지만 장황한 동적 쿼리

Criteria API는 JPA 표준 동적 쿼리 API다. DB 함수도 `CriteriaBuilder.function()`으로 호출할 수 있다.

```java
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<String> query = cb.createQuery(String.class);
Root<User> root = query.from(User.class);

query.select(cb.function(
    "date_format",
    String.class,
    root.get("createdAt"),
    cb.literal("%Y-%m-%d")
));
```

표준 API라는 장점은 있지만 코드가 장황하다. 단순 조회에서는 JPQL보다 읽기 어렵고, 복잡한 동적 쿼리에서는 QueryDSL보다 표현력이 답답할 수 있다.

그래도 외부 DSL 의존성을 추가하기 어렵거나, 표준 JPA API만 허용되는 환경이라면 Criteria API가 현실적인 선택지가 된다.

## 7. Native Query — SQL 자체가 답일 때

마지막 선택지는 Native Query다.

```java
@Query(
    value = "select date_format(created_at, '%Y-%m-%d') from users",
    nativeQuery = true
)
List<String> findCreatedDatesNative();
```

Native Query는 SQL을 그대로 쓸 수 있다. CTE, 윈도 함수, DB 전용 JSON 함수, 복잡한 리포트 쿼리처럼 JPQL로 억지로 표현하면 오히려 읽기 어려운 경우에 적합하다.

대신 JPA의 엔티티 필드명이 아니라 실제 테이블·컬럼명을 사용해야 한다. DB 종류와 스키마 변경에도 더 민감하다. 따라서 Native Query는 “JPA로 표현할 수 없어서”가 아니라 “SQL로 표현하는 것이 더 명확해서” 선택하는 편이 좋다.

## 함수보다 중요한 질문 — 컬럼에 함수를 씌워도 되는가

함수 호출 방법을 고르기 전에, 그 함수가 정말 조회 조건에 들어가야 하는지도 봐야 한다.

예를 들어 다음 조건은 직관적이다.

```sql
where date_format(created_at, '%Y-%m-%d') = '2026-09-23'
```

하지만 컬럼에 함수를 씌우면 일반 인덱스를 활용하기 어려울 수 있다. 같은 의미를 범위 조건으로 표현할 수 있다면 다음이 더 낫다.

```sql
where created_at >= '2026-09-23 00:00:00'
  and created_at <  '2026-09-24 00:00:00'
```

JPA에서도 마찬가지다.

```java
@Query("""
  select o
  from Order o
  where o.createdAt >= :start
    and o.createdAt < :end
""")
List<Order> findByCreatedDateRange(
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end
);
```

함수 호출은 편하지만, 조회 성능과 인덱스 사용까지 생각하면 조건식을 바꾸는 편이 나은 경우가 많다.

## 정리

JPA에서 함수 사용 방식은 많지만 선택 기준은 단순하다.

1. 표준 함수로 충분하면 JPQL 표준 함수를 쓴다.
2. 일부 DB 함수만 필요하면 `function()`으로 JPQL 안에서 DB 함수를 호출한다.
3. 공통 조회 로직을 감추고 재사용하려면 Repository 확장을 쓴다.
4. 동적 조건이 많으면 QueryDSL을 고려한다.
5. 표준 API만 필요하면 Criteria API를 쓴다.
6. SQL 자체가 더 명확하면 Native Query를 쓴다.

함수 호출 방식은 문법 문제가 아니라 추상화 경계 문제다. JPA 안에 머물수록 이식성과 엔티티 중심 모델을 얻고, SQL로 내려갈수록 DB 기능과 제어력을 얻는다. 어느 쪽이 더 좋은지가 아니라, 지금 쿼리에서 무엇을 잃고 무엇을 얻는지를 보고 선택해야 한다.

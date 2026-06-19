---
title       : "JPA 메모 — N+1, Hibernate 캐시, 직접/간접 참조, Element Collection"
description : "JPA를 다룰 때 종종 들춰보게 되는 핵심 개념 정리 — N+1 해결, 1차/2차 캐시, 직접 vs 간접 참조, Element Collection, 참조 깊이"
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-06-07 12:00:00 +0900
categories  : [java, "프레임워크·실무"]
tags        : [cache]
pin         : false
hidden      : false
---

JPA를 쓸 때 종종 들춰보게 되는 내용 모음.

## N+1 문제

- 연관관계 매핑 잘못으로 발생하는 대표적인 성능 문제.
- 예: `Member` ↔ `Team` 일대다에서 `Member` 조회하면서 각자의 `Team`도 함께 가져오면 1번 조회 + N번 추가 쿼리.
- 해결: **fetch join**, **EntityGraph**, **batch size** (`@BatchSize`, `hibernate.default_batch_fetch_size`).

## 직접 참조 vs 간접 참조

직접 참조 — `@ManyToOne`/`@OneToOne` 등으로 객체 그래프를 그대로 표현:

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;
    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;
}
```

간접 참조 — FK 컬럼을 그냥 컬럼으로:

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;
    @Column(name = "team_id")
    private Long teamId;
}
```

| 방식 | 장점 | 단점 |
|---|---|---|
| 직접 참조 | 객체 그래프가 명확 | 복잡도·연관 fetch 부담 |
| 간접 참조 | 유연, 단순, 성능 우위 | 객체 관계가 코드에 안 드러남 |

DDD/MSA 문맥에서는 **간접 참조**가 자주 권장된다.

## Hibernate Cache

### 1st level cache (기본 활성)
- `Session` 단위.
- 같은 세션 안에서 같은 엔티티 재조회 시 DB로 가지 않음 (영속성 컨텍스트 식별자 맵).
- 트랜잭션 종료 시 사라짐.

```java
Session session = sessionFactory.openSession();
Member m1 = session.get(Member.class, 1L);  // DB 쿼리
Member m2 = session.get(Member.class, 1L);  // 캐시에서 가져옴
m1 == m2;  // true (같은 객체)
```

### 2nd level cache (옵트인)
- `Session`들 사이에서 공유.
- 기본 비활성, EHCache/Redis/Infinispan 등 외부 캐시 저장소 필요.
- `@Cacheable`로 엔티티 단위로 활성화.
- Entity / Query / Collection 단위로 따로 설정 가능.

## Element Collection

엔티티와 **같은 생명주기**를 가지는 값 컬렉션(주로 단순 값 타입) 매핑.
별도 엔티티로 빼기엔 과한 데이터일 때 사용.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ElementCollection
    @CollectionTable(
        name = "tbl_favorite_foods",
        joinColumns = @JoinColumn(name = "member_id")
    )
    @Column(name = "food_name")
    private Set<String> favoriteFoods = new HashSet<>();
}
```

대조 — `@ManyToOne`은 **독립적인 생명주기**를 가진 엔티티에 사용.

## 중첩 참조 깊이

`a → b → c → d → e`처럼 길게 꼬리를 무는 참조는 복잡도가 빠르게 올라간다.

가능하면 `(a → c → e) + (a → b, c → d)` 같은 식으로 깊이를 줄이고 형제 관계로 분해.

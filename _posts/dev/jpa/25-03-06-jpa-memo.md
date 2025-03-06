---
title       : JPA 사용 메모
description : >-
  JPA 사용 중 참고할 만한 내용을 기록하는 메모장
date        : 2025-03-06 09:00:45 +0900
updated     : 2025-03-06 09:01:11 +0900
categories  : [dev, jpa]
tags        : [dev, jpa]
pin         : false
hidden      : false
---

## N+1 문제
- n + 1 문제는 JPA에서 발생하는 성능 문제 중 하나로, 연관관계 매핑을 잘못하면 발생할 수 있다.
- 예를 들어, Member와 Team이 일대다 관계로 매핑되어 있을 때, Member를 조회할 때 Team을 함께 조회하면 N+1 문제가 발생할 수 있다.
- fetch join, entity graph, batch size 등을 별도로 설정하여 해결할 수 있다.

## 직접참조 vs 간접참조
- 직접참조 - @ManyToOne, @OneToOne 등의 연관 어노테이션을 사용하여 직접 참조하는 방식
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

- 간접참조 - db에서 사용하는 외래키 컬럼을 직접 컬럼으로 매핑하는 방식
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
> 직접참조하는 방식을 사용하면 객체 간 관계를 명확하게 표현할 수 있으나, 복잡도가 증가할 수 있다. 반면, 간접참조 방식을 사용하면 유연성 증가, 성능 향상, 복잡도 감소 등의 장점이 있다.

## hibernate cache
### 1st level cache
- Hibernate의 기본 캐시이며, 별도 설정 없이 자동으로 활성화됨.
- Session 단위로 존재하며, 동일한 Session 내에서는 동일한 엔티티 조회 시 DB 쿼리를 수행하지 않음.
- 트랜잭션이 종료되면 캐시가 사라짐 (지속되지 않음).

```java
Session session = sessionFactory.openSession();
Member member1 = session.get(Member.class, 1L);  // 첫 번째 조회 (DB 쿼리 발생)
Mjember member2 = session.get(Member.class, 1L); // 두 번째 조회 (DB 쿼리 발생 X, 캐시에서 가져옴)

System.out.println(member1 == member2);  // true (같은 객체)
```

### 2nd level cache
- 여러 Session 간 데이터를 공유할 수 있는 캐시.
- 세션을 종료해도 캐시가 유지되어 다음 세션에서 재사용 가능.
- 기본적으로 비활성화되어 있으며, EHCache, Redis, Infinispan 등의 외부 캐시 저장소를 사용해야 함.
- Entity 단위 캐시, Query 캐시, Collection 캐시를 설정할 수 있음.
- @Cacheable 어노테이션을 적용하여 선택적으로 캐싱 가능.
- 자주 변경되지 않는 데이터라면 2nd level cache를 사용하여 성능 향상을 기대할 수 있음.

## element collection
- 맵핑할 정보가 엔티티와 동일한 생명주기를 가질 때 사용한다.  (vs @ManyToOne >> 엔티티와 독립적인 별도 생명주기를 가질 때 사용)
```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;
    @ElementCollection
    @CollectionTable(name = "tbl_favorite_foods", joinColumns = @JoinColumn(name = "member_id"))
    @Column(name = "food_name")
    private Set<String> favoriteFoods = new HashSet<>(); // List, Map 등도 사용 가능
}
```

## 중첩 참조
- a->b->c->d->e 와 같이 꼬리를 물고 참조는 복잡도를 높인다. 되도록이면 참조를 단순하게 하는 것이 좋다.
>  참조를 (a->c->e) + (a->b, c->d) 와 같이 분리하면 복잡도를 낮출 수 있다.

## Specification

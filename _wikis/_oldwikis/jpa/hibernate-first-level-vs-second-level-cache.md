---
layout  : wiki
title   : Hibernate 1st vs 2nd level cache
summary : 
date    : 2023-12-10 17:21:57 +0900
updated : 2023-12-10 17:22:26 +0900
tags    : 
toc     : true
public  : true
parent  : [[jpa/index]]
latex   : false
---
* TOC
{:toc}


# Hibernate
- Hibernate는 자바 기반의 ORM (Object-Relational Mapping) 프레임워크로, 데이터베이스와 자바 객체 간의 매핑을 지원합니다. Hibernate는 캐시를 사용하여 성능을 최적화하고, 이 캐시는 1차 캐시와 2차 캐시로 나눌 수 있습니다.

# 1차 캐시 (First-Level Cache)
- 1차 캐시는 세션(Session) 수준에서 동작합니다. 각각의 세션은 자체의 1차 캐시를 가지고 있습니다. 세션은 데이터베이스로부터 읽어온 엔티티 객체를 캐시에 저장합니다. 이후 동일한 엔티티를 다시 요청할 때, 먼저 1차 캐시에서 찾아보고, 존재하면 데이터베이스에 접근하지 않고 캐시된 객체를 반환합니다.

## 특징
- 세션 단위로 유지되며, 세션이 종료되면 1차 캐시도 함께 사라집니다.
- 여러 세션이 동일한 엔티티를 가져올 경우, 각 세션은 독립적인 1차 캐시를 가집니다.


# 2차 캐시 (Second-Level Cache)
- 2차 캐시는 세션 간에 데이터를 공유하는 레벨의 캐시입니다. 여러 세션이 공통적으로 사용할 수 있는 캐시로, 여러 세션에서 동일한 엔티티를 조회할 때 유용합니다. 2차 캐시는 데이터베이스에서 읽어온 엔티티를 캐시에 저장하고, 이를 여러 세션 간에 공유합니다.

## 특징
- 세션 간에 공유되어 여러 세션에서 동일한 엔티티를 공유할 수 있습니다.
- 애플리케이션 전체에서 사용되므로 세션 단위로 사라지지 않습니다.
- 캐시 구현체에 따라 다양한 전략(Least Recently Used, Time to Live 등)을 사용하여 캐시 관리가 가능합니다.
- Hibernate에서는 다양한 2차 캐시 구현체를 지원하며, Ehcache, Infinispan, Hazelcast 등이 널리 사용됩니다. 개발자는 필요에 따라 2차 캐시를 활성화하고 설정할 수 있습니다.


# 출처 & 참고
* [https://www.baeldung.com/hibernate-second-level-cache](https://www.baeldung.com/hibernate-second-level-cache)
* [https://junghyungil.tistory.com/203](https://junghyungil.tistory.com/203)
* [https://devbksheen.tistory.com/entry/JPA-1%EC%B0%A8-%EC%BA%90%EC%8B%9C%EC%99%80-2%EC%B0%A8-%EC%BA%90%EC%8B%9C-%EC%86%8C%EA%B0%9C](https://devbksheen.tistory.com/entry/JPA-1%EC%B0%A8-%EC%BA%90%EC%8B%9C%EC%99%80-2%EC%B0%A8-%EC%BA%90%EC%8B%9C-%EC%86%8C%EA%B0%9C)
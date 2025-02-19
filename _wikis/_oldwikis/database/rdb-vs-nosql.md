---
layout  : wiki
title   : Relational DB vs NoSQL
summary : 
date    : 2023-12-07 08:30:00 +0900
updated : 2023-12-07 08:30:00 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# RDB 

## RDB 장점
- 정형화된 데이터를 저장하는데 최적화 되어있다.
- 데이터의 일관성을 보장한다. (ACID)
- JOIN을 지원한다.
- 스키마를 가진다. (데이터의 구조를 미리 정의해야 한다.)

## RDB 단점
- 스키마 변경이 어렵다. (확장성이 떨어진다.)
- 정규화 -> JOIN -> read 성능 저하 
- scale out이 어렵다. (기본적으로 scale up만 가능, multi master, sharding 등의 방법이 있지만, 어렵다.)
- ACID를 보장하기 위해 많은 비용이 든다. (트랜잭션, 무결성, 동시성 등을 보장하기 위해 많은 비용이 든다.)


# NoSQL
## NoSQL 장점
- high-throughput, low-latency를 목표로 하는 DB
- 유연한 스키마를 가져 확장성이 높다. (application에서 스키마를 관리한다.)
- scale out이 용이하다. (서버 여러 대로 하나의 클러스터를 구성하여 사용)
- 비정형 데이터를 저장하는데 최적화 되어있다.

## NoSQL 단점
- 중복 데이터를 가진다. (데이터의 일관성을 application에서 관리한다.)
- 데이터의 일관성(ACID)을 보장하지 않는다. (CAP 이론에 따라서, Consistency와 Availability 중 하나만 보장한다.)
- JOIN을 지원하지 않는다.
- 금융 시스템과 같이 데이터의 일관성이 중요한 경우에는 사용하기 어렵다.

## NoSQL 종류
- document-oriented DB (MongoDB)
- key-value store (Redis)
- column-oriented DB (Cassandra)
- graph DB (Neo4j)

### MongoDB
- document-oriented DB
- MongoDB는 multi-threaded로 동작한다. (multi-threaded로 동작하기 때문에, multi-core 환경에서도 잘 동작한다.)
- MongoDB는 disk에 데이터를 저장하기 때문에, 데이터의 크기가 memory보다 큰 경우에도 사용할 수 있다.
- MongoDB는 disk에 데이터를 저장하기 때문에, 일반적인 db에 비해 느리다.

### Redis
- in-memory key-value store
- Redis는 single-threaded로 동작한다. (single-threaded로 동작하기 때문에, multi-core 환경에서는 여러 개의 Redis 인스턴스를 띄워서 사용한다.)
- Redis는 memory에 데이터를 저장하기 때문에, 데이터의 크기가 memory보다 큰 경우에는 사용하기 어렵다. (Redis는 disk에 데이터를 저장할 수 있지만, disk에 데이터를 저장하는 경우에는 성능이 떨어진다.)
- Redis는 memory 이기 때문에, 일반적인 db에 비해 빠르다.


# 참고 & 출처
- [쉬운코드](https://www.youtube.com/@ez./playlists)
- [CAP 이론](https://ko.wikipedia.org/wiki/CAP_%EC%A0%95%EB%A6%AC)
- [ACID](https://ko.wikipedia.org/wiki/ACID)

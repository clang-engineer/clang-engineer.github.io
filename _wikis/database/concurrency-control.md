---
layout  : wiki
title   : Concurrency Control
summary : 
date    : 2024-03-30 20:17:39 +0900
updated : 2024-03-30 20:17:54 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# Schedule
- 여러 트랜잭션이 동시에 실행될 때, 각 트랜잭션의 연산들이 실행되는 순서를 Schedule이라고 한다.
- 각 Schedule 내의 연산 순서는 바뀌지 않지만, Schedule 간의 연산 순서는 바뀔 수 있다.
(한 트랜잭션 내에서 i/o연산이 실행되는 동안 다른 트랜잭션의 연산을 실행)

## Serial Schedule
- 각 트랜잭션들이 겹치지 않고 순차적으로 실행되는 Schedule을 Serial Schedule이라고 한다.
- 각 트랜잭션이 순차적으로 실행되기 때문에 일관성 있는 상태로 실행되지만, 한번에 하나의 트랜잭션만 실행되기 때문에 성능이 좋지 않다.

##  Non-serial Schedule
- 여러 트랜잭션들의 연산들이 서로 섞여서 실행되는 Schedule을 Non-serial Schedule이라고 한다.
- 여러 트랜잭션들이 동시에 실행되기 때문에 성능이 좋지만, 일관성을 유지하기 위한 별도의 병행 제어가 필요하다.

# Confilct Serializable
- Confilct Serializable은 Schedule이 일관성 있는 상태로 실행되는 것을 보장하는 속성이다.

## 1. Conflict of two Operations
- 아래 세가지 조건을 만족하는 각 트랜잭션의 연산이 동시에 실행될 때, Conflict of Operations 이라고 한다.
1. 서로 다른 트랜잭션에 속한 연산이다.
2. 같은 데이터에 접근하는 연산이다.
3. 최소한 하나의 연산이 쓰기 연산이다.

## 2. Conflict equivalent for two Schedules
- 아래 두가지 조건을 만족하는 두 Schedule은 Conflict equivalent하다고 한다.
1. 두 Schedule이 같은 트랜잭션들을 포함하고 있다.
2. 어떤 Conflict of Operations도 양쪽 Schedule에서 동일한 순서로 실행된다.

## 3. Conflict Serializable
- Schedule이 다른 임의의 Serial Schedule과 Conflict equivalent 할때 Conflict Serializable 하다고 한다. (또는 conflict serializablity 속성을 가진다고 한다.)

# Concurrency Control
- 모든 Schedule이 Confilct Serializable 하도록 하는 것을 Concurrency Control이라고 한다.
- 트랜잭션의 ACID 속성 중 I(Isolation)을 사용해 Concurrency Control을 구현할 수 있고 이를 Isolation Level이라고 한다.
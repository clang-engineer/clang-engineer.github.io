---
layout  : wiki
title   : Transaction Isolation Level
summary : 
date    : 2024-05-03 20:13:21 +0900
updated : 2024-05-03 20:13:36 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# transaction들이 동시에  실행될 때  발생할 수 있는 문제점

## Dirty Read
- 한 transaction이 다른 transaction이 commit하지 않은 데이터를 읽는 현상. 
- 다른 transaction이 rollback하면, 읽은 데이터는 무의미해질 수 있다.

## Non-Repeatable Read
- 한 transaction 안에서 같은 데이터를 두번 읽었을 때 값이 다른 현상.
- 다른 transaction이 commit하거나 rollback하면, 읽은 데이터가 변경될 수 있다.

## Phantom Read
- 한 transaction 안에서 같은 쿼리를 두번 실행했을 때 어떤 row가 추가되거나 삭제되는 현상.
- 다른 transaction이 데이터를 추가하거나 삭제하면, 쿼리 결과가 달라질 수 있다.


# Isolation Level
- 제약사항이 강할수록 문제점은 적지만, 동시성이 낮아짐으로 성능이 저하될 수 있다.
- 시스템의 요구사항에 따라 일부 이상 현상을 허용하는 및가지 level 을 만들어서 사용자가 필요에 따라 선택할 수 있도록 한다.

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
| --------------- | ---------- | -------------------- | ------------ |
| Read Uncommitted | O          | O                    | O            |
| Read Committed   | X          | O                    | O            |
| Repeatable Read  | X          | X                    | O            |
| Serializable     | X          | X                    | X            |

## Read Uncommitted
- 다른 transaction이 commit하지 않은 데이터를 읽을 수 있다.
- Dirty Read, Non-Repeatable Read, Phantom Read가 발생할 수 있다.

## Read Committed
- 다른 transaction이 commit한 데이터만 읽을 수 있다.
- Dirty Read는 발생하지 않지만, Non-Repeatable Read, Phantom Read가 발생할 수 있다.

## Repeatable Read
- 한 transaction 안에서 같은 데이터를 두번 읽었을 때 값이 다르지 않다.
- Dirty Read, Non-Repeatable Read는 발생하지 않지만, Phantom Read가 발생할 수 있다.

## Serializable
- 한 transaction 안에서 같은 쿼리를 두번 실행했을 때 결과가 같다.
- Dirty Read, Non-Repeatable Read, Phantom Read가 발생하지 않는다.
- 위 3가지 현상을 완벽하게 제어할 뿐만 아니라, 모든 이상 현상을 제어할 수 있다.


# 추가적인 이상 현상
- 위 3가지 이상 현상 외에도 다음과 같은 이상 현상이 발생할 수 있다.

## Dirty Write
- commit하지 않은 데이터를 다른 transaction이 덮어쓰는 현상.
- rollback시 정상적인 recovery는 매우 중요하기 때문에 모든 isolation level에서 발생하지 않도록 해야 한다.

## Lost Update
- 두 transaction이 같은 데이터를 동시에 수정할 때, 한 transaction의 변경사항이 무시되는 현상.

## Read Skew

## Write Skew


# Snapshot Isolation
- MVCC(Multi-Version Concurrency Control)를 사용하여 Serializable level에서 발생하는 성능 저하를 줄이기 위해, Repeatable Read와 Serializable 사이에 위치한 level을 만들어 사용한다.
- Serializable level에서 발생하는 성능 저하를 줄이기 위해, Read Committed와 Repeatable Read 사이에 위치한 level을 만들어 사용한다.
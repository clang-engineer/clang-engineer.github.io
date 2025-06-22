---
title       : Schedule Recoverablity
description :
date        : 2024-03-06 15:36:25 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [study, database]
tags        : [database, recoverability, schedule, concurrency control]
pin         : false
hidden      : false
---

## Schedule Recoverability
- concurrency control을 위해서는 schedule이 serializable해야 하고, recoverable해야 한다.
- schedule이 serializable하다는 것은 schedule 내의 트랜잭션들이 서로 독립적으로 실행되어 일관성 있는 상태로 실행된다는 것을 의미한다.
- schedule이 recoverable하다는 것은 트랜잭션이 rollback되었을 때, 이전 상태로 회복할 수 있는 것을 의미한다.
- schedule이 recoverable하지 않으면 트랜잭션이 rollback되었을 때, 이전 상태로 회복할 수 없기 때문에 데이터베이스의 일관성이 깨질 수 있다.

## Unrecoverable Schedule
- rollback을 해도 이전 상태로 회복 불가능할 수 있는 schedule을 unrecoverable schedule이라고 한다.
- rollback을 해도 이전 상태로 회복 불가능할 수 있기 때문에 이런 schedule은 dbms에서 허용하지 않는다.
> schedule내에서 transaction T1이 write한 데이터를 transaction T2가 read하고 T2가 commit된 후 T1이 rollback되는 경우. T2은 rollback되어 유효하지 않은 데이터를 읽고 커밋했지만, 이미 commit되었기 때문에 rollback할 수 없다.
(commit된 데이터는 durability 속성에 의해 영구적으로 저장되기 때문에 rollback할 수 없다.)

## Recoverable Schedule
- unrecoverable schedule을 방지하기 위해 recoverable schedule을 사용한다.
- schedule 내에서 그 어떤 transaction도 자신이 읽은 데이터를 write한 transaction이 먼저 commit/rollback하기 전까지 commit하지 않는다면 recoverable하다. (recoverable schedule) 
- rollback시 이전 상태로 온전히 돌아갈 수 있기 때문에 dbms는 이런 schedule을 허용한다.

## Cascadeless Schedule
- 하나의 transaction이 rollback하면 의존성이 있는 다른 transaction도 rollback하는 것을 cascade rollback이라고 한다. cascade rollback은 recoverable하지만 비용이 크고, 때문에 cascade rollback을 방지하는 schedule을 cascadeless schedule이라고 한다.
(cascading schedule vs cascadeless schedule)
- 데이터를 write한 transaction이 commit/rollback한 뒤에만 다른 transaction이 그 데이터를 읽을 수 있도록 하면 cascade rollback을 방지할 수 있다. 이런 schedule을 cascadeless schedule이라고 한다. (커밋 전 읽기 금지)

## Strict Schedule
- cascadeless schedule 의 경우에도 write 연산이 commit 되기 전에 다른 transaction이 그 데이터를 쓸 수 있기 때문에 이상한 결과가 나올 수 있다. 이런 문제를 방지하기 위해 strict schedule을 사용한다. (커밋 전 읽기, 쓰기 모두 금지)
- schedule 내에 어떤 transaction도 commit되지 않는 transaction들이 write한 데이터를 읽지도 쓰지도 않는다면 strict schedule이다.
- strict schedule은 rollback할 때 recovery가 쉽다
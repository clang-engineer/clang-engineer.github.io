---
layout  : wiki
title   : Schedule Reconverablity
summary : 
date    : 2024-04-19 08:48:01 +0900
updated : 2024-04-19 08:49:30 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# Unrecoverable Schedule
- rollback을 해도 이전 상태로 회복 불가능할 수 있는 schedule을 unrecoverable schedule이라고 한다.
- rollback을 해도 이전 상태로 회복 불가능할 수 있기 때문에 이런 schedule은 dbms에서 허용하지 않는다.
> schedule내에서 transaction T1이 write한 데이터를 transaction T2가 read하고, T1이 rollback되는 경우. T2는 rollback된 데이터를 읽게 되어 이전 상태로 회복 불가능하다.

# Recoverable Schedule
- unrecoverable schedule을 방지하기 위해 recoverable schedule을 사용한다.
- schedule 내에서 그 어떤 transaction도 자신이 읽은 데이터를 write한 transaction이 먼저 commit/rollback하기 전까지 commit하지 않는다면 recoverable하다. (recoverable schedule) 
- rollback시 이전 상태로 온전히 돌아갈 수 있기 때문에 dbms는 이런 schedule을 허용한다.

# Cascadeless Schedule
- 하나의 transaction이 rollback하면 의존성이 있는 다른 transaction도 rollback하는 것을 cascade rollback이라고 한다. cascade rollback은 recoverable하지만 비용이 크고, 때문에 cascade rollback을 방지하는 schedule을 cascadeless schedule이라고 한다.
(cascading schedule vs cascadeless schedule)
- 데이터를 write한 transaction이 commit/rollback한 뒤에만 다른 transaction이 그 데이터를 읽을 수 있도록 하면 cascade rollback을 방지할 수 있다. 이런 schedule을 cascadeless schedule이라고 한다.

# Strict Schedule
- cascadeless schedule 의 경우에도 write 연산이 commit 되기 전에 다른 transaction이 그 데이터를 쓸 수 있기 때문에 이상한 결과가 나올 수 있다. 이런 문제를 방지하기 위해 strict schedule을 사용한다.
- schedule 내에 어떤 transaction도 commit되지 않는 transaction들이 write한 데이터를 읽지도 쓰지도 않는다면 strict schedule이다.
- strict schedule은 rollback할 때 recovery가 쉽다
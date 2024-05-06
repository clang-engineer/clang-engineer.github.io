---
layout  : wiki
title   : Mutex vs Semaphore
summary : 
date    : 2024-03-12 13:15:17 +0900
updated : 2024-05-06 11:52:00 +0900
tags    : 
toc     : true
public  : true
parent  : [[os/index]]
latex   : false
---
* TOC
{:toc}

# 관련 용어
- race condition: 여러 프로세스/스레드가 동시에 같은 데이터를 조작할 때 타이밍이나 접근 순서에 따라 결과가 달라지 수 있는 상황
- synchronization(동기화): 여러 프로세스/스레드를 동시에 실행해도 공유 데이터의 일관성을 유지하는 것
- critical section: 공유 데이터의 일관성을 보장하기 위해 하나의 프로세스/스레드만 진입해서 실행 가능한 영역

# Mutex
- 락을 가진 프로세스만이 공유 자원에 접근할 수 있게 하는 방법
- 락을 획득하지 못하면 대기 큐에 들어가고, 락을 획득하면 큐에서 나옴

## 구현 예시
```cpp
mutex->lock();
...critical section...
mutex->unlock();
... 

class Mutex {
    int value =  1;
    int guard = 0;
}

Mutex::lock() {
    while (test_and_set(&guard));
    if (value == 0) {
        // ...현재 스레드를 대기 큐에 넣고 대기...
        guard = 0; // & go to sleep
    } else {
        value = 0;
        guard = 0;
    }
}

Mutex::unlock() {
    while (test_and_set(&guard));
    if (/*큐에 하나라도 대기중이라면*/) {
        // ...대기 큐에서 하나를 깨움...
    } else {
        value = 1;
    }
    guard = 0;
}
```

## Spinlock
- 락을 얻기 위해 프로세스가 반복문을 돌면서 기다리는 것
- 기다리는 동안 CPU를 낭비하는 단점이 있음 

### 구현 예시
```cpp
volatile int lock = 0; // global variable for spinlock, volatile: 컴파일러가 최적화하지 않도록 함

void critical() {
    while (test_and_set(&lock) == 1);
    ...critical section...
    lock = 0;
}
 
// test_and_set은 cpu 명령어로 atomic하게 실행되어야 함
// - 실행 중간에 간섭받거나 중단되지 아니하도록 보장해야 함
// - 같은 메모리 영역에 대해 동시에 실행되지 않음
int test_and_set(int *lock_ptr) {
    int old_lock = *lock_ptr;
    *lock_ptr = 1;
    return old_lock;
}
```

### Q. 뮤텍스가 스핀락보다 항상 좋은 걸까? 
- 싱글 코어 환경에서는 무조건 뮤텍스가 스핀락보다 더 효율적임 (스핀락은 한 스레드가 무한 루프를 돌면서 락을 획득하고 있는 동안 다른 스레드가 실행되지 못하기 때문)
- 멀티 코어 환경이고, critical section에서의 작업이 컨텍스트 스위칭보다 더 빨리 끝난다면 스핀락이 뮤텍스보다 더 효율적일 수 있음

---

# Semaphore
- 공유 자원에 접근할 수 있는 프로세스의 수를 정해 접근을 제어하는 방법
- 세마포어는 작업 간의 순서를 제어하는 데 사용될 수 있음

## Binary Semaphore (이진 세마포어)
- 락의 값이 0 또는 1만을 가질 수 있는 세마포어

## Mutex vs Binary Semaphore
- 뮤텍스와 유사하게 동작함. 하지만 뮤텍스는 락을 획득한 스레드만이 락을 해제할 수 있지만, 이진 세마포어는 락을 획득한 스레드가 아니더라도 락을 해제할 수 있다는 차이가 있음
- 뮤텍스는 priority inheritance를 지원하지만, 이진 세마포어는 지원하지 않음

## 구현 예시
```cpp
class Semaphore {
    int value = 1;  // 0, 1, 2, ...
    int guard = 0;
}

Semaphore::wait() {
    while (test_and_set(&guard));
    if (value == 0) {
        // ...현재 스레드를 대기 큐에 넣고 대기...
        guard = 0; // & go to sleep
    } else {
        value -= 1;
        guard = 0;
    }
}

Semaphore::signal() {
    while (test_and_set(&guard));
    if (/*큐에 하나라도 대기중이라면*/) {
        // ...대기 큐에서 하나를 깨움...
    } else {
        value += 1;
    }
    guard = 0;
}
```

# 참고
- 상호배제만 필요하다면 뮤텍스를 사용하고, 작업 간의 실행 순서 제어가 필요하다면 세마포어를 사용을 권장

---
title       : Java Lock 종류 비교 — synchronized부터 StampedLock까지
description : Java에서 제공하는 Lock 메커니즘의 종류와 특징, 선택 기준을 실무 사례와 함께 정리
date        : 2026-05-11 15:00:00 +0900
categories  : [dev, java]
tags        : [java, lock, concurrency, reentrant-lock, synchronized]
pin         : false
hidden      : false
---

## 문제 상황

Spring `@Scheduled` 스케줄러와 HTTP 엔드포인트가 같은 DB 테이블을 동시에 읽고 쓸 수 있는 상황이 발생했다. 이미 작업 중이면 **기다리지 않고 즉시 skip**해야 했는데, `synchronized`로는 이 요구를 충족할 수 없었다.

```java
// synchronized는 lock을 얻을 때까지 무조건 대기한다
synchronized (this) {
    etlService.etl(); // 다른 스레드가 점유 중이면 여기서 블로킹
}
```

## Java Lock 종류

### 1. synchronized (intrinsic lock)

JVM 내장 모니터 기반. 가장 단순하지만 유연성이 없다.

```java
// 메서드 레벨
public synchronized void doWork() { /* ... */ }

// 블록 레벨
synchronized (lockObject) { /* ... */ }
```

**특징:**
- lock 획득까지 무조건 대기 (블로킹)
- 타임아웃 설정 불가
- 비차단 시도(`tryLock`) 불가
- 자동 해제 (스코프 벗어나면)

**적합한 경우:** 단순한 임계 영역 보호, 대기해도 문제없는 경우

### 2. ReentrantLock

`java.util.concurrent.locks` 패키지. `synchronized`의 상위 호환.

```java
private final ReentrantLock lock = new ReentrantLock();

// 비차단 시도 — 핵심 차별점
if (lock.tryLock()) {
    try {
        doWork();
    } finally {
        lock.unlock(); // 수동 해제 필수
    }
} else {
    log.info("다른 작업 진행 중, 스킵");
}

// 타임아웃 시도
if (lock.tryLock(5, TimeUnit.SECONDS)) { /* ... */ }

// 인터럽트 가능한 대기
lock.lockInterruptibly();
```

**특징:**
- `tryLock()` — lock 실패 시 즉시 `false` 반환
- `tryLock(timeout, unit)` — 일정 시간만 대기
- `lockInterruptibly()` — 대기 중 인터럽트 가능
- fair 모드 지원 (`new ReentrantLock(true)` — FIFO 순서 보장, 성능 트레이드오프)
- 수동 `unlock()` 필요 — `finally` 블록 필수

**적합한 경우:** 비차단 시도, 타임아웃, 조건부 진입이 필요한 경우

### 3. ReentrantReadWriteLock

읽기와 쓰기를 분리하여 읽기 동시성을 높인다.

```java
private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();

// 읽기 — 여러 스레드 동시 가능
rwLock.readLock().lock();
try {
    return readData();
} finally {
    rwLock.readLock().unlock();
}

// 쓰기 — 단독 점유
rwLock.writeLock().lock();
try {
    writeData();
} finally {
    rwLock.writeLock().unlock();
}
```

**특징:**
- 읽기 lock은 동시에 여러 스레드가 획득 가능
- 쓰기 lock은 배타적 (읽기도 차단)
- 읽기가 많고 쓰기가 적은 워크로드에서 성능 이점

**적합한 경우:** 캐시, 설정 조회 등 읽기 비중이 높은 경우

### 4. StampedLock (Java 8+)

`ReentrantReadWriteLock`의 개선판. 낙관적 읽기를 지원한다.

```java
private final StampedLock sl = new StampedLock();

// 낙관적 읽기 — lock 없이 읽고, 쓰기가 없었는지 검증
long stamp = sl.tryOptimisticRead();
int value = this.data;
if (!sl.validate(stamp)) {
    // 쓰기가 있었으면 읽기 lock으로 재시도
    stamp = sl.readLock();
    try {
        value = this.data;
    } finally {
        sl.unlockRead(stamp);
    }
}

// 쓰기
long stamp = sl.writeLock();
try {
    this.data = newValue;
} finally {
    sl.unlockWrite(stamp);
}
```

**특징:**
- 낙관적 읽기 — 충돌이 드물면 lock 오버헤드 거의 없음
- **재진입 불가** (non-reentrant) — 같은 스레드가 중첩 lock 불가
- `ReentrantReadWriteLock`보다 높은 처리량

**적합한 경우:** 읽기 극도로 많고, 쓰기가 극히 드문 고성능 시나리오

### 5. Semaphore

엄밀히 lock이 아니라 동시 접근 수를 제한하는 카운터.

```java
private final Semaphore semaphore = new Semaphore(3); // 동시 3개

if (semaphore.tryAcquire()) {
    try {
        accessResource();
    } finally {
        semaphore.release();
    }
}
```

**적합한 경우:** 커넥션 풀, 동시 요청 수 제한 등 N개 동시 접근 제어

## 비교 요약

| Lock | tryLock | 읽기/쓰기 분리 | 재진입 | 주요 용도 |
|------|---------|---------------|--------|-----------|
| `synchronized` | X | X | O | 단순 임계 영역 |
| `ReentrantLock` | O | X | O | 조건부 진입, 타임아웃 |
| `ReentrantReadWriteLock` | O | O | O | 읽기 많은 워크로드 |
| `StampedLock` | O | O (낙관적) | X | 고성능 읽기 |
| `Semaphore` | O | X | X | 동시 접근 수 제한 |

## 실무 적용 사례

ETL 스케줄러와 초기 적재 엔드포인트의 동시 실행 방지에 `ReentrantLock`을 적용했다.

```java
@RestController
public class EtlController {

    private final ReentrantLock etlLock = new ReentrantLock();

    @Scheduled(cron = "0 0/07 * * * ?")
    public void etl() {
        if (!etlLock.tryLock()) {
            log.info("ETL 스킵: 다른 ETL 작업이 진행 중입니다.");
            return;
        }
        try {
            etlService.etl(hospitalNo, now);
        } finally {
            etlLock.unlock();
        }
    }

    @GetMapping("/init/1")
    public ResponseEntity<?> drToOds(...) {
        if (!etlLock.tryLock()) {
            throw new CustomException(BATCH_WORKING_ERROR);
        }
        try {
            etlService.drToOds(hospitalNo);
        } finally {
            etlLock.unlock();
        }
        return ResponseEntity.ok().build();
    }
}
```

**선택 근거:**
- `synchronized` — `tryLock()` 불가, 스케줄러가 무한 대기
- `ReadWriteLock` — 읽기/쓰기 구분 불필요 (전부 쓰기 작업)
- `StampedLock` — 재진입 불필요, 낙관적 읽기 불필요
- **`ReentrantLock`** — `tryLock()`으로 즉시 skip/에러 반환이 정확히 맞음

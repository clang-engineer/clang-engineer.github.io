---
title       : "Java volatile vs static 차이 - 멀티스레드 환경에서의 변수 관리"
description : "static은 변수가 어디에 속하냐, volatile은 어디서 읽냐의 문제 — 멀티스레드 환경에서 둘의 역할 차이"
date        : 2026-04-01 10:00:00 +0900
updated     : 2026-04-01 10:00:00 +0900
categories  : [java, "동시성"]
tags        : [multithreading, spring]
pin         : false
hidden      : false
---

`static`과 `volatile`은 완전히 다른 개념이다. 멀티스레드 환경에서 변수를 다룰 때 둘의 역할을 정확히 알아야 한다.

## 핵심 차이

```
static    → 변수가 어디에 속하냐 (클래스 vs 인스턴스)
volatile  → 변수를 어디서 읽냐 (메인 메모리 vs CPU 캐시)
```

## 스레드의 메모리 구조

```
스레드 A                    스레드 B
┌──────────┐               ┌──────────┐
│  Stack A │               │  Stack B │   ← 각자 별도 (지역변수, 매개변수)
│  CPU캐시A│               │  CPU캐시B│   ← 각자 별도 (여기가 문제)
└────┬─────┘               └────┬─────┘
     │                          │
     └──────────┬───────────────┘
          ┌─────┴─────┐
          │    Heap    │   ← 공유 (인스턴스 변수, static 변수)
          │  Text/Data │   ← 공유 (클래스 정보, 상수)
          └───────────┘
```

- **스택의 지역변수**: 스레드마다 별도 → `volatile` 필요 없음 (공유 안 함)
- **힙의 인스턴스/static 변수**: 공유하지만, 각 CPU가 캐시에 복사본을 들고 있을 수 있음

## volatile이 필요한 이유

힙의 공유 변수를 CPU가 자기 캐시에 복사해두는 게 문제다. 메뉴판이 1개여도 직원들이 각자 메모해서 들고 다니는 것과 같다.

- `volatile` 없으면: 스레드 A가 값을 바꿔도, 스레드 B는 자기 CPU 캐시(옛날 값)를 계속 봄
- `volatile` 있으면: CPU 캐시 무시, 항상 메인 메모리(힙)에서 직접 읽음 → 최신 값 보장

**싱글톤과의 관계:** 싱글톤 Bean은 힙에 인스턴스 1개 → 모든 스레드가 같은 변수를 공유 → CPU 캐시 불일치 문제 발생 → `volatile` 필요. 매 요청마다 새 인스턴스를 만드는 구조였다면 변수를 공유하지 않으니 `volatile`이 필요 없다.

## 싱글톤인데 상수에 static을 쓰는 이유

싱글톤이면 어차피 인스턴스 1개라 실질적 차이는 없지만:
1. **의도 표현** - "이 값은 인스턴스와 무관하다"
2. **안전장치** - 스코프가 바뀌어도(프로토타입 등) 안전하게 동작
3. **관례** - Logger, 상수는 `private static final`이 표준

## 조합별 예시와 판단 기준

```java
// 1. static final — 절대 안 바뀌는 상수
private static final Logger log = LoggerFactory.getLogger(MyService.class);
private static final int MAX_RETRY = 3;

// 2. volatile — 멀티스레드에서 변하는 공유 값
//    일반 클래스: 스레드 간 플래그
public class Worker implements Runnable {
    private volatile boolean running = true;
    public void run() {
        while (running) { doWork(); } // 다른 스레드가 stop() 호출하면 즉시 반영
    }
    public void stop() { running = false; }
}

//    Spring 싱글톤 Bean: 인메모리 캐싱
@Service
public class DashboardService {
    private static final long CACHE_TTL_MS = 60 * 60 * 1000L;
    private volatile DashboardResponse cachedResponse;
    private volatile long cacheTimestamp;
}

// 3. static volatile — 클래스 레벨 접근 + 멀티스레드 공유
public class AppStatus {
    private static volatile boolean initialized = false;
    public static void init() {
        initialized = true;  // 모든 스레드가 즉시 true를 봄
    }
    public static boolean isReady() { return initialized; }
}
```

**핵심: `volatile`은 Spring Bean 전용이 아니라, 여러 스레드가 하나의 변수를 읽고 쓰는 모든 상황에서 필요하다.**

| 판단 기준 | 키워드 |
|-----------|--------|
| 값이 안 바뀜 | `static final` |
| 값이 바뀜 + 멀티스레드에서 공유 | `volatile` |
| 값이 바뀜 + 클래스 레벨 접근 + 멀티스레드 | `static volatile` |

## Java 동시성 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [Java 동시성 모델](/posts/java/2026-01-04-java-concurrency/) | Thread→Executor→Future→CompletableFuture 흐름과 책임 분리 |
| **volatile vs static (현재 글)** | 메모리 가시성 키워드의 의미와 조합 선택 기준 |
| [Java Lock 비교 — synchronized · ReentrantLock · ReadWriteLock · StampedLock](/posts/java/2026-05-11-java-lock-comparison/) | 락 4종의 보장·재진입성·tryLock·낙관적 읽기 |

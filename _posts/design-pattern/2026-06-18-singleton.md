---
title       : Singleton Pattern
description : "한 클래스의 인스턴스를 단 하나만 보장하고 전역 접근점을 제공하는 패턴. 자주 쓰이지만 안티패턴 비판도 많아 DI 대안과 함께 봐야 한다."
date        : 2026-06-18 22:50:42 +0900
updated     : 2026-06-18 22:50:42 +0900
categories  : [design-pattern, "생성"]
tags        : [creational-pattern]
pin         : false
hidden      : false
---

## 한 줄 요약
어떤 클래스가 프로세스에 단 한 개만 있어야 할 때, 그 인스턴스를 클래스 자신이 보관·반환하게 만든다. **자주 쓰이지만 안티패턴 비판이 많은** 패턴이라 도입 전에 대안(DI)도 함께 본다.

## 어떤 문제를 푸는가

설정 객체·로거·DB 커넥션 풀처럼 "프로세스에 하나만 있어야 의미 있는" 자원이 있다. 그냥 전역 변수로 두면:

```cpp
Logger globalLogger; // 전역 변수
```

- 초기화 순서가 불명확하다 (다른 전역의 생성자에서 쓰면 깨질 수 있음).
- 어디서든 손댈 수 있다 — 진짜로 하나만 있는지 강제할 수 없다.
- 늦게 초기화하고 싶거나(lazy) 초기화 인자가 필요하면 표현 못함.

매번 새로 만드는 것도 답이 아니다.

```cpp
void log(const std::string& msg) {
    Logger logger("app.log"); // 매번 파일 열고 닫기? 로그가 분산됨
    logger.write(msg);
}
```

- 자원 낭비.
- 상태(로그 시퀀스, 캐시)가 인스턴스마다 따로 — 일관성 없음.

## 패턴 적용 후

클래스 스스로 자신의 단 하나뿐인 인스턴스를 들고 있고, 외부에서는 그걸 가져가는 정해진 통로(`instance()`)로만 접근한다.

### Meyers' Singleton — C++의 표준 형태

```cpp
#include <iostream>
#include <string>

class Logger {
public:
    static Logger& instance() {
        static Logger inst;  // C++11부터 thread-safe하게 초기화 보장
        return inst;
    }

    void log(const std::string& msg) {
        std::cout << "[LOG] " << msg << std::endl;
    }

    // 복사·이동 금지
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

private:
    Logger() = default;
};

int main() {
    Logger::instance().log("앱 시작");
    Logger::instance().log("작업 완료");

    // 두 호출 모두 같은 객체. 주소 동일.
    std::cout << &Logger::instance() << " == " << &Logger::instance() << std::endl;
}
```

핵심:
- `static` 지역 변수의 초기화는 **C++11부터 thread-safe**(magic statics) — 별도 락 불필요.
- 생성자를 `private`으로 막아 외부 생성 불가.
- 복사·이동 생성자를 `delete`로 막아 복제 불가.
- lazy: `instance()`를 처음 호출하는 시점에 생성됨.

## 구조

```
┌──────────────────────┐
│ Singleton            │
│ ─────────────────── │
│ -instance: static    │
│ -Singleton()         │  ← private
│ +instance(): &       │  ← static
└──────────────────────┘
```

## 자주 보이는 잘못된 구현

### 1) 락 없는 lazy 초기화 (멀티스레드 환경)

```cpp
// 잘못된 예
class Logger {
    static Logger* inst;
public:
    static Logger* instance() {
        if (!inst) inst = new Logger(); // 두 스레드가 동시에 들어오면 인스턴스 두 개
        return inst;
    }
};
```

→ Meyers' Singleton로 가면 알아서 해결됨.

### 2) Double-checked locking (C++11 이전 잔재)

```cpp
// 옛날에 쓰던 우회. 지금은 불필요.
static Logger* instance() {
    if (!inst) {
        std::lock_guard<std::mutex> lock(mutex);
        if (!inst) inst = new Logger();
    }
    return inst;
}
```

C++11 이후로는 `static` 지역 변수가 같은 보장을 자동으로 해준다. 코드만 복잡해진다.

## 실전 사례

- **`std::cout` / `std::cerr`**: 표준 라이브러리의 전역 스트림. 사실상 싱글톤.
- **Spring의 빈(@Component)**: 기본 스코프가 싱글톤. 다만 코드가 직접 `instance()`를 부르지 않고 컨테이너가 주입 — DI 형태.
- **로깅·메트릭 라이브러리**: SLF4J `LoggerFactory.getLogger()`, Prometheus client.
- **OS·하드웨어 자원 게이트웨이**: 프린터 큐, 디바이스 핸들.

## Singleton vs Dependency Injection

요즘 권장되는 대안. 같은 "하나만 존재" 효과를 다른 방식으로 만든다.

| | Singleton | DI |
|---|---|---|
| 인스턴스 보유 | 클래스 자신 | 외부 컨테이너 또는 호출자 |
| 접근 방식 | `Logger::instance()` 직접 호출 | 생성자/setter로 주입받음 |
| 테스트 | mock 끼우기 어려움 | mock 주입 자유 |
| 의존성 가시성 | 코드에 안 보임 (숨겨진 의존성) | 생성자 시그니처에 노출 |
| 인스턴스 교체 | 어려움 (보통 컴파일 타임 고정) | 런타임/테스트마다 교체 가능 |

> "프로세스에 하나만"이라는 요구사항은 DI 컨테이너로도 충족된다. 실제로 Spring·Guice·Dagger 같은 컨테이너의 기본 스코프가 싱글톤이다. **Singleton 패턴을 직접 코딩하지 않고도 동일 효과**.

## 안티패턴 비판 — 도입 전에 한 번 더

Singleton은 "써도 되나"를 가장 많이 묻는 패턴이다. 주요 비판:

- **숨겨진 의존성**: 함수 시그니처에 안 드러난 의존성이 `instance()` 호출로 생긴다. 코드를 읽는 사람이 의존성을 모르고 지나친다.
- **테스트 어려움**: 단위 테스트마다 다른 mock을 끼우기 어렵다. `instance()`는 늘 같은 객체를 반환하므로 테스트 격리가 깨진다.
- **글로벌 상태**: 상태를 가진 싱글톤은 사실상 전역 변수. 호출 순서에 따라 결과가 달라지는 코드를 만든다.
- **상속·다형성 부적합**: 인스턴스가 클래스에 묶이므로 인터페이스로 추상화하기 어렵다.

**실용적 가이드**:
- 진짜 자원이 하나뿐이고(로그 파일, 하드웨어), 상태 변화가 거의 없다 → Singleton 직접 구현해도 됨.
- 그 외에는 → **DI로 단일 인스턴스 관리**가 더 안전. 생성·수명을 외부가 책임진다.
- "편의를 위한 전역 접근"이 진짜 동기라면 → 안티패턴. 의존성을 명시적으로 넘겨라.


## 스스로 점검

**1. Singleton을 직접 코딩한 클래스를 테스트할 때 mock을 끼우기 어려운 이유는?**

<details markdown="1">
<summary>답</summary>

`Logger::instance()`가 늘 같은 객체를 반환하므로 테스트 격리가 깨진다. 한 테스트의 상태가 다음 테스트에 새어 들어간다. DI라면 매번 다른 mock을 주입할 수 있다.

</details>

**2. C++11 이후 double-checked locking이 불필요해진 이유는?**

<details markdown="1">
<summary>답</summary>

`static` 지역 변수의 초기화가 thread-safe로 보장된다 (magic statics). 별도 mutex/락 없이 lazy 초기화가 안전. `static Logger inst;` 한 줄이면 끝.

</details>

**3. Spring의 `@Component`(기본 스코프 싱글톤)이 GoF Singleton과 다른 점은?**

<details markdown="1">
<summary>답</summary>

컨테이너가 단일 인스턴스를 관리·**주입**한다. 코드가 직접 `instance()`를 부르지 않는다. 결과적으로 의존성이 생성자에 명시되어 보이고, 테스트 시 mock 주입이 자유롭다.

</details>

{% include design-pattern-series.html current="singleton" %}

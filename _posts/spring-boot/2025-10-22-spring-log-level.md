---
title       : "Spring Boot 로그 레벨 — Logger 계층과 Threshold로 이해하기"
description : "Spring Boot 기본 Logback 환경에서 Logger 이름 계층과 TRACE·DEBUG·INFO·WARN·ERROR 임계값이 어떻게 결합되는지, root와 패키지별 override가 실제 로그 필터링으로 이어지는 구조를 정리한다."
date        : 2025-10-22 10:58:33 +0900
updated     : 2026-09-05 21:45:00 +0900
categories  : [spring-boot, "모니터링·로깅"]
tags        : [logging, logback, slf4j, monitoring]
pin         : false
hidden      : false
---

Spring Boot의 로그 설정을 이해할 때 `TRACE`, `DEBUG`, `INFO` 같은 이름부터 외우면 패키지별 설정이 왜 먹고 안 먹는지 헷갈리기 쉽다. 먼저 두 축을 잡는 편이 낫다.

```text
Logger 이름 계층
root
└─ com
   └─ example
      └─ myapp
         └─ payment

각 Logger에 적용되는 Threshold
TRACE < DEBUG < INFO < WARN < ERROR
```

실제 로그 출력 여부는 **어떤 Logger에서 메시지가 발생했는가**와 **그 Logger에 최종적으로 적용된 Threshold가 무엇인가**의 조합으로 결정된다.

Spring Boot 기본 스타터 환경에서는 SLF4J API와 Logback 구현체 조합을 사용한다. 이 글은 그 기본 구성을 기준으로 한다.

## 먼저 Logger 이름과 레벨을 분리해서 본다

코드가 다음과 같다고 하자.

```java
private static final Logger log =
    LoggerFactory.getLogger(PaymentService.class);
```

이 Logger의 이름은 보통 클래스의 FQCN인 다음 값이다.

```text
com.example.myapp.payment.PaymentService
```

설정은 이 이름의 상위 계층에 걸 수 있다.

```yaml
logging:
  level:
    root: INFO
    com.example.myapp: DEBUG
    com.example.myapp.payment: TRACE
```

따라서 실제 적용은 대략 다음처럼 내려간다.

```text
root = INFO
  ↓
com.example.myapp = DEBUG
  ↓
com.example.myapp.payment = TRACE
```

더 구체적인 Logger 설정이 상위 설정을 override한다.

## Threshold는 최소 출력 레벨이다

로그 레벨은 중요도 순서를 가진다.

```text
TRACE < DEBUG < INFO < WARN < ERROR
```

설정한 레벨은 **최소 통과 기준(Threshold)** 으로 동작한다.

예를 들어:

```text
Logger Threshold = INFO
```

라면:

```text
TRACE  → drop
DEBUG  → drop
INFO   → output
WARN   → output
ERROR  → output
```

즉 `INFO`는 "INFO만 출력"이 아니라 **INFO 이상을 출력**한다는 뜻이다.

## 레벨별 의미는 운영 판단을 위한 약속이다

레벨의 기술적 차이는 순서뿐이지만, 의미를 일관되게 써야 운영 시 필터링이 유용해진다.

| 레벨 | 주 용도 |
|---|---|
| `TRACE` | 매우 세밀한 실행 흐름·반복 내부 상태 |
| `DEBUG` | 개발·문제 분석용 내부 상태 |
| `INFO` | 정상 운영에서 남길 주요 상태 변화 |
| `WARN` | 처리는 계속되지만 확인이 필요한 이상 신호 |
| `ERROR` | 요청·작업 실패 등 실제 오류 |

예를 들어 재시도 가능한 일시적 네트워크 실패를 무조건 `ERROR`로 찍으면 장애가 아닌 상황에서도 Error 로그가 넘친다. 반대로 실제 데이터 저장 실패를 `INFO`로 남기면 운영 Alert 기준을 잡기 어렵다.

따라서 로그 레벨은 단순 중요도 숫자가 아니라 **운영자가 무엇을 필터링하고 Alert로 연결할지에 대한 계약**에 가깝다.

## root와 패키지별 설정은 이렇게 결합된다

운영에서는 전체 애플리케이션을 `DEBUG`로 여는 대신 root를 비교적 조용하게 두고 필요한 영역만 낮은 Threshold로 연다.

```yaml
logging:
  level:
    root: INFO
    org.springframework.web: DEBUG
    org.hibernate.SQL: DEBUG
    com.example.myapp.payment: TRACE
```

이 설정을 계층으로 보면:

```text
전체
→ INFO 이상

org.springframework.web
→ DEBUG 이상

org.hibernate.SQL
→ DEBUG 이상

com.example.myapp.payment
→ TRACE 이상
```

즉 특정 패키지 설정은 root를 삭제하는 것이 아니라 **그 하위 Logger의 Threshold를 더 구체적으로 override**한다.

## 실제 로그 호출과 통과 여부

```java
log.trace("payment flow entered");
log.debug("request={}", request);
log.info("payment completed id={}", paymentId);
log.warn("gateway response delayed");
log.error("payment failed", exception);
```

`payment` Logger가 `TRACE`라면 전부 출력된다.

반대로 `INFO`라면:

```text
trace → 제외
debug → 제외
info  → 출력
warn  → 출력
error → 출력
```

이 원리 하나로 대부분의 로그 레벨 동작을 설명할 수 있다.

## OFF와 FATAL의 위치

Logback에는 일반 애플리케이션 로그 레벨로 다음 다섯 단계가 있다.

```text
TRACE / DEBUG / INFO / WARN / ERROR
```

`OFF`는 Logger 출력을 끄기 위한 특수 레벨이다.

SLF4J의 표준 Logger API에는 `fatal()` 메서드가 없고 Logback도 별도 `FATAL` 레벨을 제공하지 않는다. 다른 로깅 생태계에서 `FATAL`이라는 이름을 볼 수 있지만, Spring Boot + SLF4J + Logback 기본 조합에서는 `ERROR`가 가장 높은 일반 로그 레벨이라고 보면 된다.

## application.properties라면 같은 구조다

```properties
logging.level.root=INFO
logging.level.org.springframework.web=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.com.example.myapp.payment=TRACE
```

YAML과 표현 방식만 다를 뿐 Logger 계층과 Threshold 원리는 동일하다.

## 운영에서는 어디까지 열까

기본 원칙은 다음처럼 잡을 수 있다.

```text
평상시
root = INFO

문제 분석
특정 패키지만 DEBUG

아주 세밀한 추적
아주 좁은 범위만 TRACE
```

전체 root를 장시간 `DEBUG`나 `TRACE`로 두면 로그 I/O, 저장량, 검색 비용이 크게 늘 수 있고 민감 정보가 로그에 노출될 가능성도 커진다.

따라서 범위를 좁혀 켜고 문제 분석이 끝나면 다시 원래 레벨로 돌리는 편이 좋다.

## 정리

Spring Boot 로그 레벨은 두 축으로 이해하면 된다.

```text
어디에서 발생했나?
→ Logger 이름 계층

어느 정도 이상을 남길까?
→ Threshold
```

그리고 최종 출력 여부는 다음처럼 결정된다.

```text
로그 메시지
   ↓
Logger 이름 확인
   ↓
가장 구체적인 설정 탐색
   ↓
최종 Threshold 결정
   ↓
메시지 레벨 >= Threshold ?
├─ yes → 출력
└─ no  → 제외
```

이 구조를 이해하면 `root`, 패키지별 로그 레벨, `TRACE~ERROR`를 각각 따로 외울 필요가 없다.

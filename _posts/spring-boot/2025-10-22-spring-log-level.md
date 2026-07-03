---
title       : Spring Boot에서 로그 레벨
description : "Spring Boot 기본 로깅(Logback)의 로그 레벨 TRACE·DEBUG·INFO·WARN·ERROR와 임계값 동작 방식, application.yml에서 루트·패키지별 레벨을 설정했을 때 어떤 메시지가 걸러지고 통과하는지."
date        : 2025-10-22 10:58:33 +0900
updated     : 2026-07-03
categories  : [spring-boot, "모니터링·로깅"]
tags        : [logging, log4j, monitoring]
pin         : false
hidden      : false
---

## 1. 로그 레벨(Log Level)이란?

**로그 레벨(Log Level)**은 로그 메시지의 **중요도**를 나타내는 지표이다.
로깅 시스템은 이 레벨을 기준으로 로그를 **기록할지 여부를 결정**하며,
프로그램의 상태를 추적하고 문제를 분석하는 데 사용된다.

Spring Boot는 별도 설정이 없으면 **Logback(SLF4J 구현체)**을 기본 로깅으로 사용한다.
따라서 이 글에서 다루는 레벨과 동작은 Spring Boot 기본 환경, 즉 Logback 기준이다.

## 2. 로그 레벨 종류

Logback(및 SLF4J)이 정의하는 표준 로그 레벨은 아래 5가지이며, 낮은 쪽에서 높은 쪽 순서다.
여기에 로그를 아예 끄는 `OFF`가 임계값으로 추가된다.

### TRACE

* **가장 상세한 로그 레벨**
* 애플리케이션의 **실행 흐름과 디버깅 정보**를 세밀하게 기록한다.
* 깊은 디버깅이 필요할 때만 켠다.

### DEBUG

* **디버깅 목적**으로 사용된다.
* 개발 단계에서 애플리케이션의 **내부 동작을 분석**할 때 유용하다.
* 예: 변수 값, 함수 호출 순서 등 상세한 정보 출력.

### INFO

* **정보성 메시지**를 기록한다. Spring Boot의 기본 루트 레벨이 `INFO`다.
* 시스템의 **정상적인 동작 흐름**이나 주요 이벤트를 전달한다.
  예: 서비스 시작, 종료, 주요 프로세스 완료 등.

### WARN

* **경고성 메시지**를 기록한다.
* 프로그램이 정상 동작 중이지만, **주의가 필요한 잠재적 문제**를 알린다.
  예: 예상치 못한 입력값, 일시적 네트워크 장애 등.

### ERROR

* **오류 메시지**를 기록한다. Logback에서 가장 높은 심각도 레벨이다.
* 애플리케이션의 **정상 동작에 영향을 주는 문제**를 나타낸다.
  예: 예외 발생, 실패한 데이터 처리 등.

> **FATAL은 Logback에 없다.**
> `FATAL`은 Log4j 1.x 시절의 잔재로, SLF4J/Logback에는 존재하지 않는 레벨이다.
> Spring Boot 기본 환경에서 코드나 설정에 `FATAL`을 쓰면 Logback은 이를 `ERROR`로 매핑해 처리한다.
> 그래서 Spring Boot에서 실제로 다루는 레벨은 `TRACE`·`DEBUG`·`INFO`·`WARN`·`ERROR` 5가지로 생각하면 된다.
{: .prompt-warning }

## 3. 임계값(Threshold) 동작 방식

설정한 로그 레벨은 **임계값**으로 동작한다.
즉 설정된 레벨보다 **중요도가 같거나 높은 로그만 기록**되고, 낮은 로그는 걸러진다.

> 루트 레벨이 `INFO`로 설정되어 있으면
> `TRACE`, `DEBUG`는 기록되지 않지만,
> `INFO`, `WARN`, `ERROR`는 기록된다.

## 4. Spring Boot에서 레벨 설정하기

Spring Boot에서는 `logback-spring.xml` 같은 별도 설정 파일 없이
`application.yml`(또는 `application.properties`)만으로 로그 레벨을 제어할 수 있다.
핵심은 두 가지 프로퍼티다.

* `logging.level.root` — 전체 기본(루트) 레벨
* `logging.level.<패키지 또는 로거 이름>` — 특정 패키지·클래스에만 적용하는 레벨

패키지별 설정은 루트 설정을 덮어쓴다. 따라서 전체는 조용히(`INFO`) 두고
내가 파고들 패키지만 `DEBUG`로 여는 식으로 쓰는 게 실무 패턴이다.

### application.yml 예시

```yaml
logging:
  level:
    root: INFO                        # 전체 기본 레벨
    org.springframework.web: DEBUG    # 스프링 웹 관련만 상세히
    org.hibernate.SQL: DEBUG          # 실행되는 SQL 확인
    com.example.myapp.payment: TRACE  # 내가 디버깅 중인 결제 모듈만 최상세
```

### application.properties로 쓰면

```properties
logging.level.root=INFO
logging.level.org.springframework.web=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.com.example.myapp.payment=TRACE
```

위 설정에서 `com.example.myapp.payment` 패키지는 `TRACE`까지 모두 남지만,
그 외 대부분의 코드는 루트 레벨 `INFO`가 적용되어 `DEBUG` 이하가 걸러진다.

## 5. 요약

| 로그 레벨 | 설명              | 사용 시점         |
| ----- | --------------- | ------------- |
| TRACE | 가장 상세한 실행 흐름 기록 | 디버깅 심화 단계     |
| DEBUG | 내부 동작 상세 분석     | 개발 단계         |
| INFO  | 주요 동작 정보 (기본값)  | 운영 중 정상 흐름 확인 |
| WARN  | 경고 메시지          | 잠재적 문제 감지     |
| ERROR | 오류 발생           | 예외 및 장애 처리    |

* Spring Boot 기본 로깅은 Logback이며, 표준 레벨은 위 5가지다.
* `FATAL`은 Logback에 없다 — Log4j 1.x 잔재이고 Logback에선 `ERROR`로 매핑된다.
* 레벨은 임계값으로 동작한다. 설정 레벨보다 같거나 높은 로그만 기록된다.
* 설정은 `application.yml`의 `logging.level.root`와 `logging.level.<패키지>`로 제어한다.

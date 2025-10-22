---
title       : Spring Boot에서 로그 레벨 
description : 
date        : 2025-10-22 10:58:33 +0900
updated     : 2025-10-22 11:14:15 +0900
categories  : [dev, java]
tags        : [spring, log, spring-boot]
pin         : false
hidden      : false
---

## 1. 로그 레벨(Log Level)이란?

**로그 레벨(Log Level)**은 로그 메시지의 **중요도(Level of Importance)**를 나타내는 지표이다.
로깅 시스템에서는 이 레벨을 기준으로 로그를 **기록할지 여부를 결정**하며,
프로그램의 상태를 추적하고 문제를 분석하는 데 사용된다.

---

## 2. 로그 레벨 종류

### 🟦 1) TRACE

* **가장 상세한 로그 레벨**
* 애플리케이션의 **실행 흐름과 디버깅 정보**를 자세히 기록한다.
* **디버깅 시**에만 주로 사용된다.

### 🟩 2) DEBUG

* **디버깅 목적**으로 사용된다.
* 개발 단계에서 애플리케이션의 **내부 동작을 분석**할 때 유용하다.
* 예: 변수 값, 함수 호출 순서 등 상세한 정보 출력.

### 🟨 3) INFO

* **정보성 메시지**를 기록한다.
* 시스템의 **정상적인 동작 흐름**이나 주요 이벤트를 전달한다.
  예: 서비스 시작, 종료, 주요 프로세스 완료 등.

### 🟧 4) WARN

* **경고성 메시지**를 기록한다.
* 프로그램이 정상 동작 중이지만, **주의가 필요한 잠재적 문제**를 알린다.
  예: 예상치 못한 입력값, 일시적 네트워크 장애 등.

### 🟥 5) ERROR

* **오류 메시지**를 기록한다.
* 애플리케이션의 **정상 동작에 영향을 주는 문제**를 나타낸다.
  예: 예외 발생, 실패한 데이터 처리 등.

### ⬛ 6) FATAL

* **가장 심각한 오류 레벨**이다.
* 시스템의 **동작이 중단될 수 있는 치명적 문제**를 의미한다.
  예: 복구 불가능한 시스템 장애, 주요 리소스 손실 등.

---

## 3. 로깅 시스템 설정

로깅 시스템에서는 **설정 파일**(예: `log4j.xml`)을 통해 로그 레벨을 지정한다.
설정된 로그 레벨보다 **중요도가 높은 로그 메시지만 기록**된다.

> 예시:
> 로그 레벨이 `DEBUG`로 설정되어 있으면
> `TRACE`는 기록되지 않지만,
> `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`은 기록된다.

---

### 📄 log4j.xml 설정 예시

```xml
<configuration>
    <appender name="Console" class="org.apache.log4j.ConsoleAppender">
        <layout class="org.apache.log4j.PatternLayout">
            <param name="ConversionPattern" value="%d [%t] %-5p %c - %m%n"/>
        </layout>
    </appender>

    <root>
        <!-- 로그 레벨 설정 -->
        <priority value="DEBUG" />
        <appender-ref ref="Console" />
    </root>
</configuration>
```

---

## ✅ 요약

| 로그 레벨 | 설명              | 사용 시점         |
| ----- | --------------- | ------------- |
| TRACE | 가장 상세한 실행 흐름 기록 | 디버깅 심화 단계     |
| DEBUG | 내부 동작 상세 분석     | 개발 단계         |
| INFO  | 주요 동작 정보        | 운영 중 정상 흐름 확인 |
| WARN  | 경고 메시지          | 잠재적 문제 감지     |
| ERROR | 오류 발생           | 예외 및 장애 처리    |
| FATAL | 치명적 오류          | 시스템 중단 수준의 문제 |

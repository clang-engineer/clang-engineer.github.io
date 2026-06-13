---
title       : Spring Boot 프로퍼티 설정 방법과 우선순위
description : >-
    application.yml·-D·spring.config.location·환경변수·@PropertySource를 어디서 어떻게 쓰고 우선순위는 어떻게 잡히나
date        : 2025-01-14 14:32:50 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [spring-boot, "설정·아키텍처"]
tags        : [spring, configuration]
pin         : false
hidden      : false
---

Spring Boot는 여러 출처에서 프로퍼티를 읽어 합친다. 여러 곳에 같은 키가 있으면 우선순위가 높은 쪽이 이긴다.

## 우선순위 (높은 → 낮은)

문서의 *Externalized Configuration* 섹션 기준으로 자주 마주치는 순서:

1. 명령줄 인자: `--server.port=8080`
2. JNDI (`java:comp/env`)
3. `System.getProperties()` — JVM의 `-D` 옵션
4. OS 환경변수
5. `application-{profile}.yml/properties` (외부 위치)
6. `application.yml/properties` (외부 위치)
7. `application-{profile}.yml/properties` (jar 내부)
8. `application.yml/properties` (jar 내부)
9. `@PropertySource` (이 시점에는 위 모든 값이 이미 결정됨)
10. SpringApplication의 기본 프로퍼티

핵심: **운영에서 덮어쓰기는 보통 환경변수 또는 `--`인자로**, **개발 기본값은 yaml에**.

## application-{profile}.yml

기본 설정은 `application.yml`에 두고, 환경별 차이는 `application-{profile}.yml`로 분리.

```yaml
# application.yml
server:
  port: 8080
spring:
  profiles:
    active: dev    # 활성 프로파일

# application-prod.yml
server:
  port: 80
spring:
  datasource:
    url: jdbc:postgresql://prod-db/app
```

## `-D` JVM 시스템 프로퍼티

```sh
java -Dserver.port=9090 -jar app.jar
```

`-D`는 *Spring 인자 앞*에 와야 한다. 위치 헷갈리면 안 먹는다.

## `--` Spring 명령줄 인자

```sh
java -jar app.jar --server.port=9090
```

`-D`보다 우선순위가 높음. 운영 스크립트에서 가장 흔한 오버라이드 방식.

## 환경변수

`SERVER_PORT=9090`처럼 점·대시는 언더스코어로, 키는 대문자.

```sh
SPRING_DATASOURCE_URL=jdbc:postgresql://db/app java -jar app.jar
```

Kubernetes·Docker·CI에서 비밀값을 흘려넣을 때 가장 자연스럽다.

## spring.config.location vs additional-location

기본 설정 파일 경로를 외부에서 바꿔 끼울 수 있다.

```sh
# 기본 위치 자체를 대체
java -jar app.jar --spring.config.location=file:/etc/myapp/application.yml

# 기본 위치는 유지하면서 추가
java -jar app.jar --spring.config.additional-location=file:/etc/myapp/overrides.yml
```

`location`은 *대체*, `additional-location`은 *추가*. 보통은 후자가 안전하다 — 기본값을 잃지 않는다.

## spring.config.import (Spring Boot 2.4+)

외부 파일·Vault·ConfigMap 등을 import 가능. 다중 파일 적용에 권장되는 새 방식.

```yaml
spring:
  config:
    import:
      - optional:file:./config/local.yml
      - configtree:/etc/secrets/
```

## @PropertySource

레거시 또는 특별한 파일에 한해 쓴다. yaml은 지원 안 됨(properties만).

```java
@Configuration
@PropertySource("classpath:custom.properties")
public class AppConfig { }
```

## @Value vs @ConfigurationProperties

| 비교 | `@Value` | `@ConfigurationProperties` |
|---|---|---|
| 대상 | 단일 키 | 키 트리(객체에 바인딩) |
| 타입 안전 | 약함 | 강함 (POJO 필드) |
| 검증 | 직접 | `@Validated` + JSR-303 |
| Relaxed binding | 제한적 | 지원 (`my.foo-bar` ↔ `myFooBar`) |
| IDE 지원 | 약함 | spring-boot-configuration-processor로 자동완성 |

여러 키가 한 묶음이면 `@ConfigurationProperties`가 압도적으로 낫다.

```java
@ConfigurationProperties(prefix = "myapp")
public record MyappProps(String name, int retry, Duration timeout) {}
```

## 실전 패턴

- 기본값은 yaml, 운영 오버라이드는 환경변수
- 비밀은 환경변수 또는 외부 시크릿 저장소(Vault/SSM/Secrets Manager)
- 프로파일은 환경(dev/staging/prod)에만 쓰고, 기능 토글은 별도 키로
- `@ConfigurationProperties` + 검증으로 잘못된 설정은 부팅 시 즉시 실패하게

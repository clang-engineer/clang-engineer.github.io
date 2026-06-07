---
title       : "NoClassDefFoundError — 라이브러리가 transitive 의존성을 POM에 선언 안 한 경우"
description : "외부 라이브러리 클래스의 <init>에서 NoClassDefFoundError가 터지면 published POM의 transitive 누락을 의심"
date        : 2026-05-15 11:00:00 +0900
updated     : 2026-05-15 11:00:00 +0900
categories  : [java]
tags        : [spring-boot, gradle, dependency, classpath, troubleshooting, java]
pin         : false
hidden      : false
---

`ClassNotFoundException`이 **외부 라이브러리 클래스의 `<init>`에서 터지면**, 컴파일은 그 라이브러리 jar로 통과했지만 그 라이브러리가 의존하는 또 다른 모듈이 클래스패스에 빠져있다는 뜻. POM에 transitive 의존성이 누락된 경우다.

## 증상

```
NoClassDefFoundError: com/example/commons/core/crypto/AesCbcCryptoService
    at com.example.commons.security.PatientAccessTokenService.<init>(...)
```

내가 직접 의존한 건 `commons:security` 하나뿐인데, 그 안의 `PatientAccessTokenService`가 같은 그룹의 별도 모듈 `commons:core`에 있는 클래스를 필요로 했음. `security`의 published POM에 `core`가 dependency로 안 적혀있어서 Gradle이 끌어오지 못함.

## 해결 — 빠진 모듈을 명시적으로 추가

```groovy
dependencies {
    implementation "com.example.commons:core:1.0.0-SNAPSHOT"     // 추가
    implementation "com.example.commons:security:1.0.0-SNAPSHOT"
}
```

## 진단 팁

- 스택트레이스의 `at <FQCN>.<init>(...)` 줄을 보고 **누가 missing 클래스를 요구하는지** 먼저 확인. 그 클래스가 속한 jar의 POM 문제일 가능성이 높음.
- Gradle로 실제 클래스패스에 뭐가 들어왔는지 확인:

```powershell
.\gradlew dependencies --configuration runtimeClasspath | Select-String "example"
```

- `ClassNotFoundException` (런타임 로드 실패) vs `NoSuchMethodError` (버전 불일치)는 다른 문제다 — 전자는 jar 자체가 없는 것.

## 근본 해결

명시적 추가는 임시방편. 라이브러리 publish 측에서 `pom.xml` / `build.gradle`의 `dependencies`에 `core`를 `api` 또는 `implementation`(consumer 입장에서 쓰면 implementation도 노출됨, java-library 플러그인의 경우 `api`)로 선언해야 함.

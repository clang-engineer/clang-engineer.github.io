---
title       : "Java 포맷터를 Gradle에 넣을 때 — Spotless 검사와 JDK 21 실행 환경"
description : "Spotless의 수정·검사 태스크를 나누고, Java 21을 빌드 대상과 Gradle 실행 JVM으로 혼동해 wrapper를 불필요하게 올리는 문제를 피한다."
date        : 2026-11-16 00:00:00 +0900
categories  : [reference, "코드 품질"]
tags        : [java, gradle, spotless, google-java-format, jdk21]
pin         : false
hidden      : false
---

Java 코드를 포맷하는 도구를 Gradle 빌드에 통합할 때는 두 결정을 나눠야 한다. **위반을 검사할지, 빌드가 소스까지 고칠지**가 첫째이고, **Gradle을 실행하는 JVM과 컴파일 대상 JDK가 무엇인지**가 둘째다. 둘을 묶어 “JDK 21 프로젝트니까 wrapper부터 업그레이드”하면 포맷터 하나에 비해 변경 범위가 커진다.

## 검사와 수정을 서로 다른 단계로 둔다

2026년 9월 작성 당시의 Gradle 8.14/JDK 21 조합에서는 Spotless와 google-java-format을 다음처럼 연결했다. 버전은 예시로 고정한 당시 조합이며 새 프로젝트에는 [Spotless 공식 요구사항](https://github.com/diffplug/spotless/tree/main/plugin-gradle#requirements)과 플러그인 포털에서 현재 지원 범위를 다시 확인한다.

```groovy
plugins {
    id 'com.diffplug.spotless' version '8.10.2'
}

spotless {
    java {
        googleJavaFormat()
    }
}
```

`spotlessApply`는 파일을 **수정**하고 `spotlessCheck`는 위반을 **검사**한다. Spotless는 Gradle의 `check`와 검사 태스크를 연동하므로, CI는 검사만 하고 개발자가 수정 태스크를 명시적으로 실행하는 구성이 보통 더 예측 가능하다. `compileJava.dependsOn spotlessApply`로 자동 포맷을 연결하면 `check`나 `build`가 작업 트리를 바꿀 수 있다. 코드 검사 중에 수정이 섞이는 게 팀 정책상 필요한지 별도로 합의하자.

## JDK 21 오류는 어느 층인가

`spotlessCheck` 태스크 자체가 없다면 플러그인이 적용된 모듈과 설정을 먼저 확인한다. 플러그인 추가 뒤 **Gradle 설정 단계**에서 실패한다면 formatter 로직보다 실행 환경의 호환성을 먼저 보자. [Gradle 공식 Java 호환성 표](https://docs.gradle.org/current/userguide/compatibility.html#java_runtime)에 따르면 Java 21은 Gradle **8.4부터 toolchain 대상**, **8.5부터 Gradle 실행 JVM**으로 지원된다. `sourceCompatibility = 21`만 보고 “현재 Gradle도 JDK 21에서 실행할 수 있다”고 추론하면 안 된다.

Gradle wrapper를 올리는 작업은 오래된 빌드 플러그인·reporting API·의존성 구성의 추가 변경을 부를 수 있다. 실제 사례에서 Gradle 8의 `reports.html.required` 같은 API와 configuration을 직접 의존성으로 넘기던 레거시 코드도 함께 정리해야 했다. 대상 코드가 Java 11이고 빌드 실행은 JDK 17로 충분하다면 **포맷터 도입을 위해서만** 대규모 wrapper 업그레이드를 할 필요가 있는지 먼저 따진다. 실행 JVM과 타깃 분리의 원리는 [Gradle toolchain 글]({% post_url gradle/2026-05-20-gradle-toolchain-target %})도 참고할 수 있다.

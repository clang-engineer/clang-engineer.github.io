---
title       : "jenv local 11인데 Java 17 바이트코드가 나올 때 — Gradle JVM과 Target 분리하기"
description : "UnsupportedClassVersionError를 실행 JVM, Gradle JVM, Java Toolchain, targetCompatibility 네 층으로 나눠 실제 class file version이 어디서 결정됐는지 진단한다."
date        : 2026-05-20 11:00:00 +0900
updated     : 2026-11-16 10:05:00 +0900
categories  : [gradle, "빌드·의존성"]
tags        : [jenv, gradle, java, toolchain, troubleshooting]
pin         : false
hidden      : false
redirect_from:
  - /posts/java/java-gradle-toolchain-target/
  - /posts/java/gradle-jenv-java-target-pinning/
---

> 관련: jenv 자체가 `version not installed`로 실패한다면 [Homebrew 업그레이드 뒤 jenv JDK 경로가 깨지는 문제](../reference/troubleshooting/2026-07-08-jenv-homebrew-path.md)를 먼저 본다. 이 글은 jenv에는 Java 11이 있는데 **Gradle 산출물이 예상보다 높은 class version으로 만들어지는 경우**를 다룬다.

`UnsupportedClassVersionError`가 나면 "서버 Java가 낮다"와 "빌드 Java가 높다"만 보고 끝내기 쉽다. 실제로는 네 층을 구분해야 한다.

```text
Shell이 보는 Java
→ java -version / JAVA_HOME / jenv

Gradle 자체를 실행하는 JVM
→ ./gradlew -version

Compiler를 제공하는 Java Toolchain
→ build.gradle의 java.toolchain

생성할 Bytecode Target
→ --release / targetCompatibility
```

`jenv local 11`은 첫 번째 층을 바꾸는 도구다. **프로젝트가 어떤 Compiler와 어떤 Target으로 빌드되는지는 Gradle 설정까지 확인해야 한다.**

## 1. 에러 메시지부터 양쪽 버전을 읽는다

예:

```text
UnsupportedClassVersionError:
class file version 61.0,
this runtime only recognizes up to 55.0
```

대표 매핑은:

| Java | class file major version |
|---|---:|
| 8 | 52 |
| 11 | 55 |
| 17 | 61 |
| 21 | 65 |

따라서 위 메시지는:

```text
Artifact
→ Java 17 수준 Bytecode

실행 Runtime
→ Java 11까지 지원
```

이라는 뜻이다.

문제는 그다음이다. **왜 빌드 결과가 17이 됐는지**를 찾아야 한다.

## 2. 먼저 Gradle이 실제로 어느 JVM에서 실행되는지 본다

```bash
./gradlew -version
```

출력의 JVM 항목을 확인한다.

```text
Gradle JVM: 17 ...
```

처럼 나온다면 현재 Terminal에서 `java -version`이 11인지보다 이 값이 더 직접적인 단서다.

함께 확인할 곳:

```bash
java -version
printf '%s\n' "$JAVA_HOME"
jenv version
./gradlew -version
```

네 값이 모두 같아야 한다는 뜻은 아니다. **어느 계층이 어떤 Java를 선택했는지 비교하기 위한 것**이다.

## 3. jenv보다 우선하는 Gradle 설정이 있는지 본다

예를 들어 `gradle.properties`에 다음이 있으면 Gradle이 특정 JDK를 사용할 수 있다.

```properties
org.gradle.java.home=/path/to/jdk-17
```

확인할 위치는 프로젝트와 사용자 전역 설정 모두다.

```text
<project>/gradle.properties
~/.gradle/gradle.properties
```

Gradle Daemon도 함께 확인한다.

```bash
./gradlew --status
./gradlew --stop
```

다만 "Daemon이 예전 환경변수를 무조건 계속 쓴다"처럼 단정하지 않고, `./gradlew -version`과 실제 Toolchain 정보를 기준으로 현재 선택을 확인한다.

## 4. 가장 중요한 구분 — Gradle JVM과 Compile Toolchain은 같을 필요가 없다

현대 Gradle에서는 Gradle 자체를 Java 17로 실행하면서 Java 11 Compiler Toolchain으로 Source를 컴파일할 수 있다.

```groovy
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(11)
    }
}
```

구조는:

```text
Gradle Process
→ JDK 17에서 실행 가능

Java Compile Task
→ JDK 11 Toolchain 사용
```

이다.

따라서:

```text
./gradlew -version이 17
= 산출물도 반드시 Java 17
```

은 항상 참이 아니다. Toolchain과 Target 설정을 함께 봐야 한다.

Toolchain JDK 자동 다운로드도 Gradle Version과 Toolchain Resolver 설정에 따라 달라질 수 있으므로, `toolchain { 11 }`만 적으면 모든 환경에서 항상 자동 설치된다고 가정하지 않는다.

## 5. Compiler Version과 Bytecode Target도 별개다

Java 17 Compiler를 사용하더라도 더 낮은 Java Runtime을 Target으로 컴파일할 수 있다.

Gradle에서는 Java Plugin 설정으로 Compatibility를 지정할 수 있다.

```groovy
java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}
```

하지만 단순 `sourceCompatibility` / `targetCompatibility`는 Compiler API와 표준 Library 호환성까지 완전히 제한하는 것과는 차이가 있다.

Java Compiler의 `--release` 의미가 필요한 경우 Gradle Compile Task에 Release를 명시하는 방식도 사용할 수 있다.

```groovy
tasks.withType(JavaCompile).configureEach {
    options.release = 11
}
```

프로젝트에서는 Toolchain과 Release Target을 조합해 **빌드 머신의 기본 JDK 상태에 우연히 의존하지 않도록** 만드는 편이 재현성이 높다.

### 반대 방향의 사례: Java 11 타깃인데 JDK 21에서 빌드가 실패했다 (2026-07-21)

앞의 사례는 산출물의 class version이 예상보다 높았지만, 이때는 `sourceCompatibility = '11'`을 선언한 레거시 빌드가 **컴파일 자체에 실패**했다. 당시 조합은 Gradle 7.5, Lombok 1.18.16, Gradle을 실행하는 JDK 21이었다.

```text
> Task :compileJava FAILED
java.lang.NoSuchFieldError: Class com.sun.tools.javac.tree.JCTree$JCImport
  does not have member field 'com.sun.tools.javac.tree.JCTree qualid'
```

Lombok 같은 애노테이션 프로세서는 javac 내부 API에 의존한다. Java 11 바이트코드를 만들라는 설정은 **프로세서가 실행되는 JDK를 낮추지 않는다**. [Lombok 변경 기록](https://projectlombok.org/changelog)상 JDK 21의 *초기 지원*은 1.18.30부터이므로, 이 오류를 Java 11 타깃 설정의 실패로 해석하면 원인을 놓친다.

당시 Lombok 버전을 바꾼 뒤 빌드 스크립트도 수정하자, 그전에는 없던 `_BuildScript_`의 `Unsupported class file major version 65`가 나타났다. 빌드 스크립트를 읽는 Gradle 내장 Groovy/ASM 경로가 JDK 21 클래스 형식을 처리하지 못한 상황으로 해석했다. 관찰상 기존 컴파일된 스크립트가 재사용되다가 스크립트 변경으로 다시 컴파일되면서 **Gradle 쪽 호환성 문제도 드러난** 사례다. 캐시가 언제 재사용되는지는 설정과 변경 내용에 따라 달라지므로, 첫 오류만으로 Gradle 실행 JVM과 버전이 호환된다고 결론 내릴 수 없다. [Gradle Java 호환성 표](https://docs.gradle.org/current/userguide/compatibility.html)에 따르면 JDK 21에서 **Gradle 자체를 실행**하는 지원은 8.5부터, JDK 17 실행은 7.3부터다. Gradle 7.5를 JDK 21에서 실행하는 것은 지원 조합이 아니다.

이 경우 전체 빌드 도구를 JDK 21용으로 올리기보다, 먼저 Gradle을 지원하는 **JDK 17로 실행**하도록 프로젝트/CI의 JDK 선택을 맞추고 빌드 결과를 확인하는 편이 변경 범위가 작다. 이 사례에서는 Gradle 7.5와 Lombok 1.18.16을 유지한 채 JDK 17에서 컴파일이 통과했다. 다만 Lombok 공식 변경 기록의 JDK 17 지원 시작은 1.18.22이므로 **1.18.16 + JDK 17의 일반적인 공식 호환성을 보장한다는 뜻은 아니다**. `sourceCompatibility = '11'`은 그대로 두되, 산출물의 major version 55와 실제 Java 11 런타임 호환성도 확인한다. 실행 JDK와 산출물 타깃은 별개의 결정이다.

JDK 선택을 프로젝트 범위에서 공유하려면 팀/CI가 사용하는 버전 관리 도구의 로컬 설정에 JDK 17을 명시한다. 예를 들어 mise를 사용한다면 `mise.toml`에 `[tools]` 아래 `java = "temurin-17"`을 적고, 해당 셸에서 `JAVA_HOME`과 `./gradlew -version`의 JVM을 확인한다. 이전 JVM의 Gradle daemon이 의심되면 `./gradlew --stop` 후 다시 빌드한다. JDK 설치 경로를 개인별 절대경로로 고정할 필요는 없다.

## 6. 실제 Artifact의 Class Version을 검증한다

설정을 읽는 것과 최종 결과를 확인하는 것은 별개다.

JAR 안의 Class를 `javap`으로 확인할 수 있다.

```bash
javap -verbose -classpath build/libs/app.jar \
  com.example.MyClass | grep 'major version'
```

Spring Boot Fat JAR처럼 Class Path가 바로 잡히지 않는 구조라면 Class 파일을 꺼내 확인하거나 Bytecode를 직접 볼 수 있다.

```bash
unzip -p build/libs/app.jar \
  BOOT-INF/classes/com/example/MyApplication.class \
  | od -An -t x1 -N 8
```

Class File Header의 마지막 두 Byte가 Major Version이다.

```text
00 37 → 55 → Java 11
00 3d → 61 → Java 17
```

## 진단 순서

```text
UnsupportedClassVersionError
        ↓
1. Runtime이 지원하는 Version 확인
        ↓
2. Artifact Major Version 확인
        ↓
3. ./gradlew -version으로 Gradle JVM 확인
        ↓
4. org.gradle.java.home 확인
        ↓
5. java.toolchain 확인
        ↓
6. targetCompatibility / options.release 확인
        ↓
7. Clean Build 후 Artifact 재검증
```

이 순서로 보면 "jenv가 안 먹는다"라는 하나의 문제처럼 보였던 상황을 실제 선택 계층으로 분리할 수 있다.

## 정리

`jenv local 11`은 **Shell에서 사용할 JDK 선택**에 관여하지만 Java Build의 최종 Target을 대신 선언해주는 것은 아니다.

```text
jenv / JAVA_HOME
→ 실행 환경의 JDK 선택

Gradle JVM
→ Gradle 자체 실행

Toolchain
→ Compile에 사용할 JDK

Release / targetCompatibility
→ 생성할 Bytecode 호환 범위
```

재현 가능한 Build를 원한다면 사람마다 jenv를 맞추게 하는 것보다 **프로젝트 Build 설정에 Toolchain과 Target 의도를 명시하고 최종 Artifact를 검증하는 것**이 핵심이다.

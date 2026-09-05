---
title       : "gradle bootRun에 JVM 옵션 넘기기 — --args와 jvmArguments가 다른 이유"
description : "gradlew bootRun에 -Xmx나 시스템 프로퍼티를 넘기려다 --args가 안 먹는 이유를 파헤친다. 핵심은 bootRun이 Gradle 데몬 JVM과 앱 JVM 두 개를 띄운다는 것. --args(앱 인자)와 -Dspring-boot.run.jvmArguments(앱 JVM 옵션)가 각각 어디로 흘러가는지, 왜 java -jar에는 그런 래핑이 필요 없는지 정리한다."
date        : 2026-07-12 17:00:00 +0900
updated     : 2026-07-12 17:00:00 +0900
categories  : [gradle, "빌드·의존성"]
tags        : [spring-boot, bootrun, jvm, troubleshooting]
pin         : false
hidden      : false
---

`./gradlew bootRun`에 `-Xmx512m`이나 프로파일을 넘기려다 한 번쯤 막힌다. `--args`로 넘겼더니 프로파일은 먹는데 `-Xmx`는 무시된다. 원인은 하나다 — **`bootRun`은 JVM을 두 개 띄운다.**

## 두 개의 통로

앱에 값을 넣는 경로가 두 개다. 넘기려는 값이 어느 쪽이냐에 따라 방법이 갈린다.

**경로 A — 애플리케이션 인자** (`main(String[] args)`로 들어감)

```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

**경로 B — JVM 옵션** (`-Xmx`, 시스템 프로퍼티 `-D...`)

```bash
./gradlew bootRun -Dspring-boot.run.jvmArguments="-Xmx512m -Dfoo=bar"
```

| 넘기려는 값 | `--args` | `jvmArguments` |
|---|---|---|
| `--spring.profiles.active=dev` (커맨드라인 형식) | ✅ | ❌ |
| `-Dspring.profiles.active=dev` (시스템 프로퍼티 형식) | ❌ | ✅ |
| `-Xmx512m`, `-XX:...` (JVM 튜닝) | ❌ | ✅ |

프로파일이 헷갈리는 건 **두 형식이 다 존재**하기 때문이다. `--spring.profiles.active`는 커맨드라인 인자라 `--args`로 켜지고, `-Dspring.profiles.active`는 시스템 프로퍼티라 `jvmArguments`로 켜진다. 반면 `-Xmx`는 `-D`도 아니고 커맨드라인 인자도 아니라서 오직 `jvmArguments`로만 간다.

## `--args`로 프로파일이 켜지는 이유

`--args`로 넘긴 값이 앱의 `main(String[] args)`로 들어가면, **Spring Boot이 그 배열에서 `--키=값` 형태를 프로퍼티로 해석**한다.

1. `--args='--spring.profiles.active=dev'` → 앱의 `args[]`에 문자열이 담김
2. `SpringApplication.run(args)`가 이 배열을 `CommandLinePropertySource`로 변환
3. `spring.profiles.active=dev` 프로퍼티로 등록 → dev 프로파일 활성화

`-Xmx`는 애초에 JVM이 **시작 시점**에 읽어야 하는 값이라, `args[]`에 담겨봤자 Spring이 해석하는 프로퍼티가 아니고 이 경로로는 절대 안 먹힌다.

## 핵심 — `bootRun`은 JVM을 두 개 띄운다

`gradlew bootRun`을 치면 프로세스(JVM)가 두 개 뜬다.

```
1. Gradle 데몬 JVM   ← gradlew가 빌드를 돌리는 Gradle 자체
        │  bootRun 태스크가 앱을 별도 프로세스로 포크
        ▼
2. 애플리케이션 JVM  ← 네 Spring Boot 앱이 도는 곳
```

여기서 모든 게 갈린다. 커맨드라인의 `-D`는 **부모인 Gradle JVM**에만 붙지, 자식인 앱 JVM으로 자동 전달되지 않는다. 그래서 앱 JVM에 옵션을 주려면 **"이건 자식 JVM 띄울 때 붙여줘"**라고 명시하는 통로가 필요하다 — 그게 `jvmArguments`다.

```bash
./gradlew bootRun -Dspring-boot.run.jvmArguments="-Dspring.profiles.active=dev"
```

이 한 줄에 `-D`가 두 겹으로 겹쳐 보이는 이유가 이것이다. **둘은 서로 다른 JVM에 붙는다.**

- 바깥 `-Dspring-boot.run.jvmArguments=...` → **Gradle JVM**의 시스템 프로퍼티. Spring Boot Gradle 플러그인이 이 값을 읽는다.
- 안쪽 `-Dspring.profiles.active=dev` → 그 값의 내용물. 플러그인이 이걸 떼어 **앱 JVM**을 포크할 때 붙인다.

앱 JVM 기준으로 세 방식이 도착하는 지점을 나누면 이렇다.

| 방식 | 앱 JVM에서 도착 지점 |
|---|---|
| `--args='--spring.profiles.active=dev'` | `main(args[])` 애플리케이션 인자 |
| `jvmArguments="-Dspring.profiles.active=dev"` | JVM 시스템 프로퍼티 |
| `jvmArguments="-Xmx512m"` | JVM 자체 옵션 |

셋 다 최종적으로 앱 JVM에 영향을 주지만, `--args`만 "JVM 바깥 레벨(인자)"이고 나머지 둘은 "JVM 내부 설정"이다.

## `java -jar`에는 왜 래핑이 없나

직접 실행할 때는 JVM이 하나뿐이라 `-D`를 그냥 붙이면 된다.

```bash
java -Dspring.profiles.active=dev -jar app.jar     # -D는 JVM에 바로 붙음
java -jar app.jar --spring.profiles.active=dev     # -jar 뒤는 앱의 args[]
```

`gradlew bootRun`은 JVM이 둘(Gradle + 앱)이라 앱 JVM에 `-D`를 직접 못 줘서 `jvmArguments`로 감싸는 것이고, `java -jar`는 JVM이 하나라 중간 단계가 없다. 정리하면:

- `java -D...` → JVM이 하나라 직접 붙임
- `gradlew bootRun` → JVM이 둘이라 `jvmArguments`로 앱 JVM에 전달

## 여러 개 넘기기 · build.gradle에 고정

CLI에서 여러 개는 공백으로 구분한다. `jvmArguments`는 **값 전체를 따옴표로 감싸야** 셸이 하나의 문자열로 넘긴다.

```bash
./gradlew bootRun \
  --args='--server.port=8081' \
  -Dspring-boot.run.jvmArguments="-Xmx512m -Dspring.profiles.active=dev"
```

매번 치기 싫으면 빌드 스크립트에 고정한다.

```groovy
// build.gradle (Groovy)
bootRun {
    args = ['--server.port=8081', '--spring.profiles.active=dev']
    jvmArgs = ['-Xmx512m', '-Dfoo=bar']
}
```

```kotlin
// build.gradle.kts (Kotlin DSL)
tasks.bootRun {
    args("--server.port=8081", "--spring.profiles.active=dev")
    jvmArgs("-Xmx512m", "-Dfoo=bar")
}
```

## 요약

- `bootRun`은 **Gradle 데몬 JVM + 앱 JVM 두 개**를 띄운다. 이게 모든 혼란의 뿌리다.
- `--args` = 앱의 `main(args[])`로 가는 **애플리케이션 인자**. `--spring.x=y` 프로파일류는 여기로 켜진다.
- `-Dspring-boot.run.jvmArguments="..."` = 그 값을 떼어 **앱 JVM에 붙이는 통로**. `-Xmx`·시스템 프로퍼티는 반드시 여기로.
- `-Xmx`가 `--args`로 안 먹히는 건 JVM 옵션이 커맨드라인 인자 경로로는 도달할 수 없기 때문이다.

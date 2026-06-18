---
title       : "Gradle 테스트 로그가 안 찍히는 이유 — UP-TO-DATE 캐시와 testLogging 기본값"
description : "테스트 로그가 안 나오면 UP-TO-DATE 스킵과 인색한 testLogging 기본값을 각각 풀어야 한다"
date        : 2026-06-15 11:00:00 +0900
updated     : 2026-06-15 11:00:00 +0900
categories  : [gradle]
tags        : [gradle, kotlin, junit, testing, troubleshooting]
pin         : false
hidden      : false
---

`./gradlew :module:test --tests "*FooTest"`를 돌렸는데 콘솔에 거의 아무 로그가 안 찍히는 경우, 원인은 두 가지가 겹쳐 있다.

## 원인

1. **UP-TO-DATE 스킵**: Gradle은 소스/테스트/의존성 입력이 변하지 않았으면 `test` 태스크를 통째로 건너뛴다. 콘솔에는 그냥 `BUILD SUCCESSFUL`만 뜨고 끝난다.
2. **테스트 로깅 기본값이 인색하다**: 입력이 바뀌어 실제로 실행돼도, `tasks.test`의 기본 `testLogging`은 실패만 보여준다. 통과한 테스트, `System.out.println`, `println` 출력은 기본적으로 안 보인다.

→ 그래서 `--rerun-tasks`만 붙여도 (강제 재실행은 되지만) 로그가 늘지 않는다. 두 가지를 각각 풀어야 한다.

## 해결

### 일회성 — CLI 플래그

```bash
# 캐시 무시하고 강제 재실행
./gradlew :pseudonymization:test --tests "*FooTest" --rerun-tasks

# 로그 레벨도 같이 올리기
./gradlew :pseudonymization:test --tests "*FooTest" --rerun-tasks -i
```

### 영구 — `build.gradle.kts`에 `testLogging` 추가

```kotlin
import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.api.tasks.testing.logging.TestLogEvent

tasks.test {
    useJUnitPlatform()
    testLogging {
        events(
            TestLogEvent.PASSED,
            TestLogEvent.SKIPPED,
            TestLogEvent.FAILED,
            TestLogEvent.STANDARD_OUT,
            TestLogEvent.STANDARD_ERROR,
        )
        showStandardStreams = true
        exceptionFormat = TestExceptionFormat.FULL
        showCauses = true
        showStackTraces = true
    }
}
```

이 블록만 추가하면 매번 테스트별 PASS/FAIL과 `println` 출력이 콘솔에 찍힌다.

## 함정

- `testLogging` 블록을 추가해도 **UP-TO-DATE 스킵 자체는 막지 못한다**. 입력이 같으면 여전히 스킵된다 → `--rerun-tasks`와 같이 써야 한다.
- `--info`/`-i`는 Gradle 전체 로그 레벨을 올리는 거라 다른 태스크 출력까지 늘어난다. 테스트 출력만 보고 싶으면 CLI 플래그보다 `testLogging` 블록이 깔끔.
- `--rerun-tasks`는 해당 빌드 전체의 모든 태스크를 다시 돌린다. 특정 태스크만 다시 돌리려면 `cleanTest test` 식이 낫다.

## 참고

- [Gradle docs — Test logging](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.testing.logging.TestLoggingContainer.html)
- [Gradle docs — `--rerun-tasks`](https://docs.gradle.org/current/userguide/command_line_interface.html#sec:rerun_tasks)

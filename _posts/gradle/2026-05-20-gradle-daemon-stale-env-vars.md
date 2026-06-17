---
title       : "Gradle 데몬이 옛 환경변수를 들고 있을 때"
description : "환경변수 설정 전에 떠 있던 Gradle 데몬이 빈 토큰으로 의존성 해석을 실패시키는 진단/해결"
date        : 2026-05-20 10:00:00 +0900
updated     : 2026-05-20 10:00:00 +0900
categories  : [gradle, "빌드·의존성"]
tags        : [daemon, github-packages, intellij, java]
pin         : false
hidden      : false
---

`GITHUB_TOKEN`을 분명히 설정해뒀는데 `./gradlew`가 `Could not resolve …:SNAPSHOT` 으로 죽는다면, **Gradle 데몬이 환경변수 설정 이전에 떠서 옛 환경(빈 토큰)을 그대로 들고 있을 가능성**이 크다.

## 진단 단서

`--refresh-dependencies` 실행 시 첫 줄을 보자.

```
> Starting a Gradle Daemon, 3 stopped Daemons could not be reused, use --status for details
```

"could not be reused"가 떴다는 건 호환 안 되는 데몬이 여럿 살아 있었다는 뜻. 환경변수 mismatch도 그중 하나다.

## 해결 — 데몬 종료 후 새로 띄우기

```powershell
.\gradlew.bat --stop
.\gradlew.bat --refresh-dependencies <task>
```

새 데몬은 현재 셸의 환경변수를 그대로 상속받기 때문에 토큰이 정상적으로 전달된다.

## IntelliJ도 같은 패턴

IntelliJ가 환경변수 설정 *이전*에 떠 있으면, 그 IDE 프로세스가 자식으로 띄우는 Gradle 데몬도 옛 환경을 물려받는다. `--stop`만으로 부족하면:

1. IntelliJ를 트레이까지 완전 종료
2. 시작 메뉴/작업표시줄로 재실행 (User-scope 환경변수 자동 상속)
3. Gradle tool window → Reload All Gradle Projects

## 빠른 자가진단 흐름

원격 저장소 → 로컬 셸 → 데몬 → IDE 순으로 분리해서 본다.

| 체크 | 명령 | OK 신호 |
|---|---|---|
| 원격 정상 | `curl -u $env:GITHUB_ACTOR:$env:GITHUB_TOKEN <pkg-url>` | HTTP 200 |
| 셸 정상 | `.\gradlew.bat dependencies` | resolve 성공 |
| 데몬 정상 | 데몬 재기동 후 동일 명령 | 동일 |
| IDE 정상 | IntelliJ 재시작 후 Sync | 의존성 트리에 SNAPSHOT 표시 |

원격은 200인데 IDE만 실패 → 거의 데몬/IDE의 stale env 문제.

## 영구 대안

데몬 재시작 의존을 끊고 싶다면 자격증명을 `~/.gradle/gradle.properties`로 옮긴다. `build.gradle`에서 `findProperty()` 폴백 추가:

```groovy
credentials {
    username = project.findProperty("gprUsername") ?: System.getenv("GITHUB_ACTOR")
    password = project.findProperty("gprToken")    ?: System.getenv("GITHUB_TOKEN")
}
```

이러면 환경변수가 비어 있어도 빌드는 통과한다. (단, `gradle.properties`는 절대 커밋 금지)

## GitHub Packages 트러블슈팅 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [SNAPSHOT 의존성 해석 실패 — 불완전 배포](/posts/gradle/2026-03-06-github-packages-snapshot-incomplete-publish/) | pom 누락으로 404, 재배포로 해결 |
| [GitHub Packages 인증 실패 — 401/403 디버깅](/posts/gradle/2026-05-15-github-packages-gradle-auth-debugging/) | PAT 스코프·SSO authorize·환경변수 전달까지 |
| **Gradle 데몬 환경변수 stale 문제 (현재 글)** | 데몬이 옛 환경변수를 잡고 있어 PAT 갱신이 반영되지 않는 함정 |

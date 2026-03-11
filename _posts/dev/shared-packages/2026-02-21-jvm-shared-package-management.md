---
title       : JVM 공용 패키지 관리 (Gradle 멀티모듈 + GitHub Packages)
description : 멀티모듈 공용 라이브러리를 Gradle로 관리하고 GitHub Packages에 수동 배포하는 방법
date        : 2026-02-21 10:10:00 +0900
updated     : 2026-02-21 10:10:00 +0900
categories  : [dev, java]
tags        : [shared-package, gradle, github-packages, publishing, multi-module]
pin         : false
hidden      : false
---

여러 서비스에서 재사용하는 JVM 공용 라이브러리를 멀티모듈로 관리하고, GitHub Packages에 수동 배포하는 방식을 정리한다. Gradle Kotlin DSL을 기준으로 설명한다.

## 목적과 대상

- 공통 유틸/보안/인증 모듈을 한 저장소에서 관리하고 싶을 때
- Maven Central 대신 GitHub Packages로 사내 배포를 운영하고 싶을 때
- CI 자동화 전에 수동 배포 루틴을 먼저 정리하고 싶을 때

## 저장소 구조

멀티모듈 구조를 사용한다. 루트에서 공통 설정을 두고, 모듈별로 배포한다.

```
repo-root/
├─ build.gradle.kts
├─ gradle.properties
└─ security/
   └─ build.gradle.kts
```

## 공통 Gradle 설정

루트에서 `group`, `version`, `maven-publish`, GitHub Packages 레지스트리를 공통으로 지정한다.

```kotlin
allprojects {
    group = "com.example.commons"
    version = project.findProperty("version") as String? ?: "1.0.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "maven-publish")

    publishing {
        publications {
            create<MavenPublication>("mavenJava") {
                from(components["java"])
            }
        }
        repositories {
            maven {
                url = uri("https://maven.pkg.github.com/your-org/your-repo")
                credentials {
                    username = System.getenv("GITHUB_ACTOR")
                    password = System.getenv("GITHUB_TOKEN")
                }
            }
        }
    }
}
```

## 수동 배포 흐름

```bash
export GITHUB_ACTOR=your-github-username
export GITHUB_TOKEN=your-github-token
./gradlew clean build
./gradlew publish
```

## 소비자 프로젝트 설정

GitHub Packages 레포지터리를 추가하고, 동일한 토큰을 사용한다.

```kotlin
repositories {
    mavenCentral()
    maven {
        url = uri("https://maven.pkg.github.com/your-org/your-repo")
        credentials {
            username = System.getenv("GITHUB_ACTOR")
            password = System.getenv("GITHUB_TOKEN")
        }
    }
}

dependencies {
    implementation("com.example.commons:security:1.0.0-SNAPSHOT")
}
```

환경 변수 대신 `~/.gradle/gradle.properties`로 로컬에만 저장하는 방법도 있다.

```properties
GITHUB_ACTOR=your-github-username
GITHUB_TOKEN=your-github-token
```

## 버전 전략(수동)

- `gradle.properties`의 `version`을 수동 갱신
- SNAPSHOT에서 릴리스로 전환할 때는 변경 요약을 남김
- 배포 전 `./gradlew build`로 산출물 확인

## 환경 확인 방법

Gradle 환경이 제대로 설정되었는지 확인한다.

```bash
# Gradle Wrapper 버전 확인
./gradlew --version

# 프로젝트 설정 확인 (가장 확실한 방법)
./gradlew properties

# 환경 변수 설정 확인
echo $GITHUB_ACTOR
echo $GITHUB_TOKEN

# Gradle 프로퍼티 파일 확인
cat ~/.gradle/gradle.properties

# 빌드 테스트
./gradlew clean build
```

`./gradlew properties`는 group, version, repositories 등 모든 프로젝트 설정을 보여준다.

## 운영 팁

- 토큰은 저장소에 커밋하지 않고 로컬/CI 환경 변수로만 관리
- 모듈이 늘어나면 공통 설정은 루트에 유지해 중복을 줄임
- 소비자 프로젝트에서 401/403이 발생하면 토큰 권한(`read:packages`) 확인

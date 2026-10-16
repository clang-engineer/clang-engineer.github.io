---
title       : "./gradlew가 실행되지 않을 때 — Git이 보존하는 실행 권한"
description : "./gradlew의 Permission denied 원인을 Unix 실행 비트와 Git 파일 모드 관점에서 확인하고 복구하는 방법을 정리한다."
date        : 2026-10-16 11:10:00 +0900
updated     : 2026-10-16 11:10:00 +0900
categories  : [reference, troubleshooting]
tags        : [git, gradle, permission, executable-bit, troubleshooting]
pin         : false
hidden      : false
---

`./gradlew`를 실행했는데 Gradle 오류가 아니라 다음 메시지가 나왔다.

```text
./gradlew: Permission denied
```

이때는 Gradle Wrapper의 설정이나 Java 버전보다 먼저 **스크립트 파일에 실행 권한이 있는지** 확인해야 한다.

## 원인: 파일은 있지만 실행 비트가 없다

macOS와 Linux에서는 파일을 읽을 수 있는 권한과 실행할 수 있는 권한이 별개다.

```bash
ls -l gradlew
```

실행 권한이 없는 경우에는 보통 다음처럼 표시된다.

```text
-rw-r--r--  gradlew
```

소유자 권한 부분에 `x`가 없다. 실행 가능한 파일이라면 다음처럼 `x`가 포함되어야 한다.

```text
-rwxr-xr-x  gradlew
```

`gradlew`는 Gradle Wrapper가 생성한 Shell script다. 따라서 파일 내용이 정상이어도 실행 비트가 사라지면 `./gradlew` 형식으로 직접 실행할 수 없다.

## 먼저 로컬 실행 권한을 복구한다

현재 작업 트리에서만 바로 실행하려면 `chmod`를 사용한다.

```bash
chmod +x gradlew
./gradlew --version
```

`--version`은 실제 빌드보다 부담이 적으면서 Wrapper가 실행되는지 확인하기 좋다.

```text
./gradlew tasks
```

처럼 Gradle task를 실행해도 된다.

## Git에 실행 권한 변경을 반영한다

`chmod +x`는 현재 파일 시스템의 권한을 바꾼다. 이 변경을 Git이 추적하는 파일 모드에도 반영하려면 다음 명령을 사용한다.

```bash
git update-index --chmod=+x gradlew
```

그다음 상태와 staged diff를 확인한다.

```bash
git status --short
git diff --cached --summary
```

정상적으로 반영되면 다음과 비슷한 결과를 볼 수 있다.

```text
 mode change 100644 => 100755 gradlew
```

여기서 `100644`는 일반 파일 모드이고, `100755`는 소유자·그룹·기타 사용자에게 실행 권한이 있는 파일 모드다. Git은 전체 Unix 권한을 모두 저장하는 것이 아니라 파일의 실행 가능 여부 같은 제한된 파일 모드 정보를 추적한다.

## `chmod`와 `git update-index`의 역할은 다르다

두 명령은 서로 대체 관계가 아니다.

| 명령 | 바꾸는 대상 | 목적 |
|---|---|---|
| `chmod +x gradlew` | 현재 파일 시스템 | 지금 이 환경에서 실행 가능하게 함 |
| `git update-index --chmod=+x gradlew` | Git index | 실행 권한 변경을 다음 커밋에 포함할 상태로 만듦 |

이미 추적 중인 파일이라면 다음처럼 실행 권한을 바꾼 뒤 `git add`하는 흐름도 사용할 수 있다.

```bash
chmod +x gradlew
git add gradlew
```

`git update-index --chmod=+x`는 파일 내용을 수정하지 않고 Git index의 파일 모드를 명시적으로 바꾸고 싶을 때 특히 유용하다.

## 아직 안 되면 확인할 것

실행 권한을 복구했는데도 실패한다면 문제를 분리해서 확인한다.

```bash
# 파일 모드 확인
ls -l gradlew
git ls-files --stage gradlew

# 줄바꿈과 첫 줄 확인
file gradlew
head -n 1 gradlew

# Wrapper 자체 실행 확인
./gradlew --version
```

`git ls-files --stage gradlew`의 모드가 `100755`인지 확인할 수 있다. 다만 실행 권한이 정상인데도 `bad interpreter`가 나온다면 Shell script의 줄바꿈(CRLF)이나 shebang을 별도로 확인해야 한다. Java가 없거나 버전이 맞지 않는 경우에는 그다음에야 Gradle·JVM 환경을 점검한다.

## 정리

`./gradlew: Permission denied`는 대개 Gradle 문제가 아니라 **Git checkout 과정에서 `gradlew`의 실행 비트가 없어진 문제**다.

```bash
chmod +x gradlew
git update-index --chmod=+x gradlew
./gradlew --version
```

`chmod`는 현재 환경을 고치고, `git update-index --chmod=+x`는 그 실행 권한을 저장소의 다음 커밋에 남긴다. Git 명령과 Gradle 명령을 따로 외우기보다, **파일 시스템의 권한과 Git이 기록하는 파일 모드는 서로 다른 층**이라는 점을 기억하면 원인을 빠르게 좁힐 수 있다.

반복해서 찾는 Git 명령과 복구 흐름은 [devkit Git Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/git.md)에서 함께 확인할 수 있다.

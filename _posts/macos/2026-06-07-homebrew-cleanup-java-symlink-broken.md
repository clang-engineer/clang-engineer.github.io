---
title       : "brew cleanup 후 java_home이 JDK를 못 찾을 때 — Cellar가 아니라 opt를 연결한다"
description : "Homebrew openjdk의 버전별 Cellar 경로를 직접 symlink하면 cleanup 뒤 깨질 수 있다. /Library/Java/JavaVirtualMachines는 안정적인 Homebrew opt 경로로 연결해야 한다."
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-09-05 20:30:00 +0900
categories  : [macos, "시스템 운영"]
redirect_from:
  - /posts/etc/2026-06-07-homebrew-cleanup-java-symlink-broken/
tags        : [macos, java, homebrew, jenv, troubleshooting]
pin         : false
hidden      : false
---

Homebrew의 `openjdk@21`은 정상 설치되어 있는데 `/usr/libexec/java_home -v 21`이 JDK 21을 찾지 못하거나, `brew cleanup` 뒤 갑자기 Java 인식이 깨질 수 있다.

이때 확인할 핵심은 **`/Library/Java/JavaVirtualMachines/`의 symlink가 Homebrew의 버전별 Cellar 경로를 직접 가리키고 있지 않은가**다.

```text
깨지기 쉬운 연결
/Library/Java/JavaVirtualMachines/openjdk-21.jdk
        ↓
/opt/homebrew/Cellar/openjdk@21/21.0.x/...  ← upgrade/cleanup으로 사라질 수 있음

안정적인 연결
/Library/Java/JavaVirtualMachines/openjdk-21.jdk
        ↓
$HOMEBREW_PREFIX/opt/openjdk@21/...         ← 현재 keg를 가리키는 안정 경로
```

## 증상

```bash
/usr/libexec/java_home -V
/usr/libexec/java_home -v 21
```

에서 설치한 JDK 21이 보이지 않거나 다른 버전만 나온다.

Homebrew에서는 package가 설치되어 있다.

```bash
brew list --versions openjdk@21
```

즉 문제를 두 층으로 나눈다.

```text
Homebrew Package 설치 상태
→ 정상

macOS System Java Discovery
→ 비정상
```

## 1. 현재 Symlink를 확인한다

```bash
ls -l /Library/Java/JavaVirtualMachines/
```

특정 link:

```bash
readlink /Library/Java/JavaVirtualMachines/openjdk-21.jdk
```

대상이 다음처럼 version-specific Cellar 경로라면:

```text
/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk
```

Homebrew upgrade 후 이전 keg가 cleanup될 때 link가 깨질 수 있다.

## 2. Homebrew의 안정 경로를 확인한다

Homebrew formula의 현재 prefix를 직접 구한다.

```bash
brew --prefix openjdk@21
```

예:

```text
/opt/homebrew/opt/openjdk@21
```

실제 JDK bundle은:

```bash
ls "$(brew --prefix openjdk@21)/libexec/openjdk.jdk"
```

로 확인한다.

`opt/openjdk@21`은 Homebrew가 현재 설치된 keg를 가리키도록 관리하는 안정적인 symlink 계층이다.

```text
Homebrew Cellar
├─ 21.0.11
└─ 21.0.12
       ↑ 현재 Keg
       │
opt/openjdk@21
```

그래서 외부 설정에서 특정 Cellar version을 직접 참조하지 않는 편이 좋다.

## 3. 공식 Caveat 방식으로 다시 연결한다

Homebrew의 `openjdk@21` formula가 안내하는 방식은 다음과 같다.

```bash
sudo ln -sfn \
  "$(brew --prefix openjdk@21)/libexec/openjdk.jdk" \
  /Library/Java/JavaVirtualMachines/openjdk-21.jdk
```

또는 `$HOMEBREW_PREFIX`를 사용하면:

```bash
sudo ln -sfn \
  "$HOMEBREW_PREFIX/opt/openjdk@21/libexec/openjdk.jdk" \
  /Library/Java/JavaVirtualMachines/openjdk-21.jdk
```

관계는:

```text
macOS Java Discovery 경로
        ↓
Homebrew opt 경로
        ↓
현재 설치된 Cellar Keg
```

가 된다.

다음 Homebrew minor upgrade에서 Cellar version이 바뀌어도 `opt/openjdk@21`이 새 keg를 가리키므로 시스템 symlink를 매번 다시 만들 필요가 없다.

## 4. macOS가 다시 인식하는지 확인한다

```bash
/usr/libexec/java_home -V
```

원하는 버전:

```bash
/usr/libexec/java_home -v 21
```

실제 Java도 확인한다.

```bash
"$(/usr/libexec/java_home -v 21)/bin/java" -version
```

## 5. `jenv`는 또 다른 Registry다

`java_home`과 `jenv`는 역할이 다르다.

```text
/Library/Java/JavaVirtualMachines
        ↓
/usr/libexec/java_home
→ macOS가 발견하는 JDK

~/.jenv/versions
        ↓
jenv
→ jenv가 관리하는 Version Alias
```

따라서 macOS에서 JDK가 정상 발견돼도 jenv에 해당 경로를 아직 등록하지 않았다면:

```bash
jenv add "$(/usr/libexec/java_home -v 21)"
```

같은 별도 등록이 필요할 수 있다.

확인:

```bash
jenv versions
jenv doctor
```

## 6. `JAVA_HOME`도 Version-specific Cellar 경로로 고정하지 않는다

다음처럼 직접 Cellar version을 적어두면 같은 문제가 반복된다.

```text
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/...
```

대신 macOS의 Java discovery를 사용하거나 stable prefix를 사용한다.

예:

```bash
export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
```

필요한 version manager를 쓰고 있다면 `JAVA_HOME` 선택은 그 도구에 맡기는 것도 좋다.

## 정리

```text
brew cleanup 뒤 JDK 인식 실패
   ↓
Homebrew Package 자체 확인
   ↓
/Library/Java/JavaVirtualMachines Symlink 확인
   ↓
Cellar Version을 직접 가리키는가?
├─ Yes → opt/openjdk@21로 교체
└─ No  → java_home / jenv 계층을 별도로 진단
```

핵심은 `brew cleanup` 뒤 매번 새 Cellar version을 찾아 symlink하는 것이 아니라 **처음부터 Homebrew가 제공하는 안정적인 `opt` 경로를 연결하는 것**이다.

## 참고

- [Homebrew Formula — openjdk@21](https://formulae.brew.sh/formula/openjdk@21)

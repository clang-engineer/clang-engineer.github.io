---
title       : "jenv version is not installed — Homebrew Cellar 경로가 깨지는 이유"
description : "jenv가 버전별 Homebrew Cellar 경로를 가리키면 brew upgrade/cleanup 뒤 JDK 링크가 깨질 수 있다. 안정적인 opt 경로로 재등록해 재발을 막는 방법을 정리한다."
date        : 2026-07-08 10:00:00 +0900
updated     : 2026-09-05 20:40:00 +0900
categories  : [macos, "시스템 운영"]
redirect_from:
  - /posts/etc/2026-07-08-jenv-homebrew-cellar-path-breakage/
tags        : [jenv, homebrew, java, macos, troubleshooting]
pin         : false
hidden      : false
---

어제까지 되던 프로젝트에서 갑자기 다음 오류가 날 수 있다.

```text
jenv: version `17' is not installed
```

Homebrew에는 `openjdk@17`이 여전히 설치되어 있는데 jenv만 해당 버전을 못 찾는다면 **jenv registry가 사라진 Homebrew Cellar 경로를 가리키고 있는지**부터 확인한다.

이 문제는 macOS의 `/usr/libexec/java_home` discovery 문제와 비슷해 보이지만 별도 계층이다.

```text
macOS Java Discovery
→ /Library/Java/JavaVirtualMachines
→ /usr/libexec/java_home

jenv Version Registry
→ ~/.jenv/versions
→ jenv shim
```

macOS system discovery 문제는 [brew cleanup 후 java_home이 JDK를 못 찾을 때](/posts/macos/2026-06-07-homebrew-cleanup-java-symlink-broken/)에서 따로 다룬다.

## 증상 — jenv Link가 Dangling 상태다

jenv는 등록한 JDK를 `~/.jenv/versions/` 아래 symlink로 관리한다.

```bash
for d in ~/.jenv/versions/*; do
  [ -e "$d" ] || echo "DANGLING: $d -> $(readlink "$d")"
done
```

예:

```text
DANGLING: ~/.jenv/versions/17
→ /opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home
```

그런데 실제 Homebrew package는 이미 다음 patch version으로 올라가 있을 수 있다.

```bash
brew list --versions openjdk@17
```

예:

```text
openjdk@17 17.0.20.1
```

## 원인 — Cellar는 Version-specific 경로다

Homebrew의 실제 package는 Cellar 아래 정확한 version으로 설치된다.

```text
$HOMEBREW_PREFIX/Cellar/openjdk@17/17.0.20.1/
```

jenv에 이 경로를 직접 등록하면:

```text
~/.jenv/versions/17
        ↓
Cellar/openjdk@17/17.0.17/...
```

처럼 당시 version이 symlink target에 박힌다.

이후:

```text
brew upgrade
   ↓
새 Keg 설치
   ↓
brew cleanup
   ↓
이전 Keg 삭제
   ↓
jenv의 기존 Link가 Dangling
```

이 된다.

즉 Java 자체가 사라진 것이 아니라 **jenv가 더 이상 존재하지 않는 경로를 기억하고 있는 것**이다.

## 해결 — Homebrew `opt` 경로로 다시 등록한다

Homebrew는 현재 keg를 가리키는 stable `opt` 경로를 제공한다.

```text
$HOMEBREW_PREFIX/opt/openjdk@17
        ↓
현재 Cellar Keg
```

현재 경로를 확인한다.

```bash
brew --prefix openjdk@17
```

JDK Home:

```bash
"$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
```

깨진 jenv link를 제거한 뒤 이 stable path를 등록한다.

```bash
jenv remove 17 2>/dev/null || true
jenv add "$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
jenv rehash
```

여러 version을 관리한다면:

```bash
for v in 11 17 21; do
  home="$(brew --prefix "openjdk@$v" 2>/dev/null)/libexec/openjdk.jdk/Contents/Home"
  [ -x "$home/bin/java" ] && jenv add "$home"
done

jenv rehash
```

핵심은:

```text
Cellar/<정확한-version>
→ 직접 등록하지 않음

opt/openjdk@17
→ 현재 keg를 따라가는 안정 경로
```

이다.

## 확인

```bash
jenv versions
readlink ~/.jenv/versions/17
```

프로젝트에 `.java-version`이 있다면:

```bash
cd my-project
jenv version
java -version
which java
```

`which java`가:

```text
~/.jenv/shims/java
```

를 가리키면 현재 shell에서 jenv shim이 활성화된 상태다.

## 왜 갑자기 드러날 수 있나

jenv 초기화가 shell에 적용되지 않았던 동안에는 깨진 registry가 있어도 system Java를 직접 사용해 문제가 드러나지 않을 수 있다.

```text
jenv init 없음
→ 실제 java binary 사용
→ 깨진 jenv Link가 잠복

jenv init 활성화
→ shim을 통해 Version Resolve
→ Dangling Link 문제 노출
```

따라서 shell/dotfiles 변경 직후 문제가 나타났다고 해서 그 변경이 JDK를 삭제한 것은 아닐 수 있다. **기존 registry 파손을 새 설정이 드러낸 것인지**를 구분한다.

## 재발 방지 — Provisioning에 등록 절차를 넣는다

새 Mac에서 Brewfile로 JDK와 jenv를 설치해도 jenv registry 등록까지 자동으로 생기는 것은 아니다.

Dotfiles bootstrap 단계에 stable path 등록을 넣어둘 수 있다.

```bash
if command -v jenv >/dev/null 2>&1; then
  for v in 11 17 21; do
    prefix="$(brew --prefix "openjdk@$v" 2>/dev/null || true)"
    home="$prefix/libexec/openjdk.jdk/Contents/Home"
    [ -x "$home/bin/java" ] && jenv add "$home" >/dev/null 2>&1 || true
  done
  jenv rehash >/dev/null 2>&1 || true
fi
```

## 정리

```text
jenv: version is not installed
   ↓
Homebrew Package 존재 여부 확인
   ↓
~/.jenv/versions Link 확인
   ↓
Version-specific Cellar를 가리키는가?
├─ Yes → Homebrew opt 경로로 재등록
└─ No  → jenv init / .java-version / 다른 Version 설정 진단
```

핵심은 patch upgrade마다 jenv를 수동 복구하는 것이 아니라 **jenv가 Homebrew의 stable `opt` 경로를 보게 만들어 버전 교체와 registry를 분리하는 것**이다.

## 참고

- [Homebrew Formula — openjdk@17](https://formulae.brew.sh/formula/openjdk@17)
- [jenv](https://github.com/jenv/jenv)

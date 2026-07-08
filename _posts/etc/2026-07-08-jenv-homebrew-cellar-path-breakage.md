---
title       : "jenv: version '17' is not installed — Homebrew 패치 업그레이드가 JDK 심링크를 깨는 이유"
description : "jenv가 Cellar 경로를 박제해서 brew 패치 업그레이드마다 깨진다. opt 경로로 재등록해 근본 해결하기"
date        : 2026-07-08 10:00:00 +0900
updated     : 2026-07-08 10:00:00 +0900
categories  : [etc, "개발 도구"]
tags        : [jenv, homebrew, java, troubleshooting]
pin         : false
hidden      : false
---

어제까지 잘 되던 빌드가 갑자기 죽는다.

```console
$ ./gradlew clean build
jenv: version `17' is not installed
```

분명 Java 17을 깐 적이 있는데 "설치 안 됨"이라니. Java가 스스로 사라졌을 리는 없다. 범인은 `jenv`(Java + env, rbenv·pyenv 계열 — 디렉토리별 `.java-version` 파일로 JDK를 자동 전환)와 `Homebrew`의 조합이 만든 구조적 함정이다.

## 증상: jenv 심링크가 전부 깨져 있다

jenv는 등록된 JDK를 `~/.jenv/versions/` 아래 심링크로 관리한다. dangling(대상이 사라진) 링크가 있는지부터 본다.

```bash
for d in ~/.jenv/versions/*; do
  [ -e "$d" ] || echo "DANGLING: $d -> $(readlink "$d")"
done
```

```console
DANGLING: ~/.jenv/versions/17 -> /opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home
DANGLING: ~/.jenv/versions/11 -> /opt/homebrew/Cellar/openjdk@11/11.0.29/libexec/openjdk.jdk/Contents/Home
```

심링크는 `openjdk@17/17.0.17`을 가리키는데, 실제 설치된 버전을 보면 다르다.

```bash
brew list --versions | grep openjdk
# openjdk@17 17.0.19   ← 17.0.17이 아니다
# openjdk@11 11.0.31   ← 11.0.29가 아니다
```

## 원인: Cellar 경로에는 패치 버전이 박혀 있다

Homebrew는 패키지를 `Cellar/<name>/<정확한-버전>/`에 설치한다. 여기가 핵심이다 — **경로에 패치 버전(`17.0.17`)이 그대로 들어간다.**

`jenv add`로 JDK를 등록하면, jenv는 그때 넘겨받은 **Cellar 경로를 그대로 심링크로 박제**한다.

```
~/.jenv/versions/17 → /opt/homebrew/Cellar/openjdk@17/17.0.17/.../Home
                                                      ^^^^^^^ 박제됨
```

이후 `brew upgrade`가 openjdk를 `17.0.17 → 17.0.19`로 올리면:

1. 새 버전이 `Cellar/openjdk@17/17.0.19/`에 설치되고
2. `brew cleanup`이 옛 `Cellar/openjdk@17/17.0.17/` 디렉토리를 **삭제**한다
3. jenv 심링크는 여전히 삭제된 `17.0.17`을 가리킨다 → **dangling**

즉 Java는 멀쩡히 있다. jenv가 **사라진 경로를 붙잡고 있을 뿐**이다. 패치 업그레이드 한 번에 등록된 모든 JDK가 동시에 깨진다.

## 해결: 패치 버전 없는 opt 경로로 재등록

Homebrew는 Cellar 말고 **버전이 안 박힌 안정 심링크**를 따로 제공한다.

```
/opt/homebrew/opt/openjdk@17  →  /opt/homebrew/Cellar/openjdk@17/17.0.19
        ^^^ 버전 없음                                        ^^^ brew가 자동 갱신
```

`opt/openjdk@17`은 업그레이드마다 Homebrew가 알아서 현재 버전으로 다시 걸어준다. 이 경로를 jenv에 등록하면 패치가 올라도 안 깨진다.

먼저 깨진 심링크를 걷어낸다.

```bash
find ~/.jenv/versions -maxdepth 1 -type l ! -exec test -e {} \; -delete
```

그다음 **opt 경로**로 다시 등록한다.

```bash
# ✗ 이렇게 하면 안 된다 — 패치 오르면 또 깨진다
# jenv add /opt/homebrew/Cellar/openjdk@17/17.0.19/libexec/openjdk.jdk/Contents/Home

# ✓ 버전 없는 opt 경로 → brew가 갱신해주므로 안 깨진다
for v in 11 17 21; do
  jenv add "/opt/homebrew/opt/openjdk@$v/libexec/openjdk.jdk/Contents/Home"
done
jenv rehash
```

이제 심링크가 버전 무관 경로를 가리킨다.

```bash
readlink ~/.jenv/versions/17
# /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

`.java-version`이 있는 프로젝트에서 확인.

```bash
cd my-project   # .java-version = 17
java -version
# openjdk version "17.0.19" ...   ← 정상 해석
```

## 재발 방지: provisioning 스크립트에 담아라

여기서 흔히 놓치는 점 — 위 `jenv add`를 라이브 셸에서 한 번 치고 끝내면, **머신을 새로 세팅하면 똑같이 깨진다.** `brew bundle`이 `openjdk@17`을 설치해줘도 `jenv add`를 안 하면 jenv에는 등록된 버전이 0개이기 때문이다.

dotfile 셋업 스크립트(예: chezmoi의 `run_once`, 또는 부트스트랩 셸 스크립트)에 opt 경로 등록 루프를 넣어 자동화한다.

```bash
# dotfiles setup script — brew가 깐 JDK를 opt 경로로 jenv에 등록
if command -v jenv >/dev/null 2>&1; then
  for v in 11 17 21; do
    home="$(brew --prefix)/opt/openjdk@$v/libexec/openjdk.jdk/Contents/Home"
    [ -x "$home/bin/java" ] && jenv add "$home" >/dev/null 2>&1 || true
  done
  jenv rehash >/dev/null 2>&1 || true
fi
```

## 왜 하필 "갑자기" 터졌나

`jenv`가 셸에서 활성화(`eval "$(jenv init -)"`)되어 있어야 이 에러가 표면에 뜬다. jenv init이 없으면 `java`는 shim을 거치지 않고 실제 바이너리를 직접 쓰므로, **심링크가 깨져 있어도 무증상**이다.

그래서 셸 설정을 바꾸거나 dotfile 매니저를 새로 도입해 jenv init이 켜지는 순간, 오래 잠복해 있던 파손이 한꺼번에 드러난다. 원인은 그 변경이 아니라 **이미 썩어 있던 심링크** — 변경은 방아쇠일 뿐이다. `which java`가 shim(`~/.jenv/shims/java`)을 가리키는지 보면 jenv가 가로채는 중인지 바로 알 수 있다.

```bash
which java
# /Users/you/.jenv/shims/java   ← jenv가 가로채는 중
```

> 관련: [jenv local 11 해도 Java 17 바이트코드가 나오는 이유](/posts/gradle/2026-05-20-gradle-jenv-java-target-pinning/) — 같은 jenv지만 "버전이 안 바뀌는" 반대편 증상.

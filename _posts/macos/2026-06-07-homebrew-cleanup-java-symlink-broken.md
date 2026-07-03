---
title       : "brew cleanup 후 java_home이 엉뚱한 버전을 반환할 때"
description : "Homebrew가 옛 JDK를 삭제하면 /Library/Java/JavaVirtualMachines 심볼릭 링크가 깨진다"
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-06-07 12:00:00 +0900
categories  : [macos, "시스템 운영"]
redirect_from:
  - /posts/etc/2026-06-07-homebrew-cleanup-java-symlink-broken/
tags        : [macos, java, homebrew, jenv, troubleshooting]
pin         : false
hidden      : false
---

Homebrew로 `openjdk@21`을 설치하고 `brew cleanup`을 돌린 다음 `/usr/libexec/java_home -v 21`이 17을 반환하거나, `jenv local 21`이 `version '21' not installed`로 거절하는 일이 있다. 설치는 멀쩡한데 시스템 심볼릭 링크가 깨진 상태다.

## 증상

```sh
/usr/libexec/java_home -v 21
# → 17 경로를 반환하거나 에러

jenv local 21
# → jenv: version `21' not installed
```

## 원인

Homebrew가 `openjdk@21`을 마이너 업데이트하면 이전 버전이 `Cellar/` 아래에 남는다. 그 다음 `brew cleanup`이 이전 버전을 삭제하는데, 그 사이에 만들어둔:

```
/Library/Java/JavaVirtualMachines/openjdk-21.jdk
  → /opt/homebrew/Cellar/openjdk@21/<옛 버전>/...
```

심볼릭 링크가 **삭제된 경로를 그대로 가리키게 된다**. JDK 자체는 새 버전이 설치돼 있지만, `java_home`은 이 심볼릭 링크를 따라가서 깨진 위치를 본다.

## 해결: 심볼릭 링크 갱신

설치된 버전 경로 확인 후 `ln -sfn`으로 강제 재생성:

```sh
ls /opt/homebrew/Cellar/openjdk@21/
# 21.0.10  ← 실제 설치된 버전

sudo ln -sfn /opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk \
  /Library/Java/JavaVirtualMachines/openjdk-21.jdk

# 확인
/usr/libexec/java_home -V
# 21이 정상 경로로 잡혀야 함
```

## jenv vs java_home

| 도구 | 보는 곳 |
|---|---|
| `jenv versions` | `~/.jenv/versions/` 디렉토리에 등록된 버전 |
| `/usr/libexec/java_home` | `/Library/Java/JavaVirtualMachines/`의 plist 메타데이터 |

**둘은 별개 시스템**이라 `jenv versions`에 21이 보이는데 `java_home`은 못 찾는 상황이 가능하다. jenv가 보여주는 건 jenv 등록 상태, `java_home`이 보여주는 건 시스템 설치 상태.

심볼릭 링크가 깨진 게 후자(`java_home`)인 상황이고, 위 명령으로 시스템 설치를 복구하면 둘 다 정상 작동한다.

## 핵심 정리

`brew cleanup` 후 Java가 이상하다 → `/Library/Java/JavaVirtualMachines/` 심볼릭 링크 확인. `sudo ln -sfn`으로 살아있는 Cellar 경로로 다시 묶으면 끝.

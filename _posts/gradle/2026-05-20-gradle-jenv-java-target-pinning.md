---
title       : "jenv local 11 해도 Java 17 바이트코드가 나오는 이유"
description : "build.gradle에 자바 버전이 없으면 빌드 JVM이 바이트코드 버전이 된다 — jenv shim과 toolchain의 차이"
date        : 2026-05-20 11:00:00 +0900
updated     : 2026-05-20 11:00:00 +0900
categories  : [gradle, "빌드·의존성"]
tags        : [jenv, java]
pin         : false
hidden      : false
---

서버에서 `UnsupportedClassVersionError: class file version 61.0 ... up to 55.0` 가 떠서 `jenv local 11`로 바꾸고 재빌드해도 같은 에러. 캐시인 줄 알았는데 **빌드 JVM 자체가 안 바뀐 거였다.**

## 핵심: `build.gradle`에 자바 버전이 없으면 빌드 JVM = 바이트코드 버전

`sourceCompatibility`/`targetCompatibility`/`toolchain` 중 하나도 없으면 Gradle은 그냥 **"빌드를 실행하는 JVM 버전"으로 컴파일**한다. jenv를 바꿔도 빌드 JVM이 그대로면 바이트코드도 그대로.

## 진단: `./gradlew -v` 의 JVM 라인을 본다

```bash
./gradlew -v
# JVM: 17.0.17 (Eclipse Adoptium 17.0.17+10)  ← 여기가 11이 아니면 끝
```

`jenv local 11`이 `./gradlew` 래퍼 스크립트에 적용 안 되는 경우가 흔하다. 래퍼가 새 셸을 띄우면서 `JAVA_HOME`을 우선 읽기 때문. **shim 통과 여부는 항상 `gradlew -v`로 확인**할 것.

부수적으로 의심할 곳:
- `~/.gradle/gradle.properties`의 `org.gradle.java.home` (있으면 jenv 무시됨)
- Gradle 데몬 (`./gradlew --status` → 옛 JVM으로 떠 있으면 `--stop`)

## 클래스 버전 → JDK 매핑 + 매직바이트로 검증

| Java | class file version | hex (마지막 2바이트) |
|---|---|---|
| 8 | 52 | `00 34` |
| 11 | 55 | `00 37` |
| 17 | 61 | `00 3D` |

JAR 내부 `.class` 매직바이트로 직접 확인:

```bash
unzip -p build/libs/myapp-1.0-SNAPSHOT.jar \
  BOOT-INF/classes/com/example/app/MyApplication.class \
  | od -An -t x1 -N 8
# ca fe ba be 00 00 00 37   ← Java 11
# ca fe ba be 00 00 00 3d   ← Java 17
```

## 영구 픽스: 빌드 JVM 무관하게 타겟 못박기

`build.gradle`:

```groovy
java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}
```

또는 toolchain (Gradle이 알아서 11 JDK 받아옴):

```groovy
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(11)
    }
}
```

이러면 빌드 머신/CI/누구의 jenv 상태든 **무조건 Java 11 호환 바이트코드만 나간다.** "jenv로 맞춰주세요" 같은 운영 의존성을 없애는 게 핵심.

## 에러 메시지 읽는 법

```
class file version 61.0 ... up to 55.0
                    ↑              ↑
                빌드 JDK(17)   런타임 JDK(11)
```

앞 숫자가 빌드 쪽, 뒷 숫자가 런타임 쪽. 둘 중 어디를 맞춰야 할지 헷갈리지 말 것.

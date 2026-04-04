---
title       : GitHub Packages SNAPSHOT 배포 실패 트러블슈팅 (pom 누락)
description : GitHub Packages에 SNAPSHOT이 불완전하게 배포되어 Gradle 빌드가 실패한 원인과 해결 방법
date        : 2026-03-06 10:00:00 +0900
categories  : [dev, java]
tags        : [github-packages, snapshot, troubleshooting, gradle, maven-metadata]
pin         : false
hidden      : false
---

GitHub Packages에 배포된 SNAPSHOT 라이브러리가 불완전하게 올라가면서 소비자 프로젝트의 Gradle 빌드가 실패한 경험을 정리한다.

## 증상

소비자 프로젝트에서 `./gradlew build`를 실행하면 다음 에러가 발생했다.

```
Could not find com.example.commons:security:1.0.0-SNAPSHOT
```

시도한 것들:

```bash
# 의존성 강제 갱신
./gradlew build --refresh-dependencies

# 로컬 캐시 삭제 후 재시도
rm -rf ~/.gradle/caches/modules-2/files-2.1/com.example.commons
./gradlew build --refresh-dependencies
```

모두 동일한 에러로 실패했다. 토큰 권한, 레포지터리 URL 등 설정에는 문제가 없었다.

## 원인 분석

`--debug` 옵션으로 상세 로그를 확인했다.

```bash
./gradlew build --refresh-dependencies --debug 2>&1 | grep -i "security"
```

로그를 추적한 결과:

1. `maven-metadata.xml`에서 최신 빌드가 **build #6**으로 기록되어 있었다.
2. Gradle이 build #6에 해당하는 아티팩트를 요청했지만, `.pom` 파일이 **404**로 응답했다.
3. `maven-metadata.xml`의 `<snapshotVersions>` 목록을 직접 확인해 보니, build #6에 대한 `.jar` 항목은 있지만 `.pom` 항목이 누락되어 있었다.

```xml
<!-- maven-metadata.xml 발췌 -->
<snapshotVersions>
    <snapshotVersion>
        <extension>jar</extension>
        <value>1.0.0-20260305.120000-6</value>
        <updated>20260305120000</updated>
    </snapshotVersion>
    <!-- pom 항목이 없음 -->
</snapshotVersions>
```

Maven/Gradle은 의존성을 해석할 때 `.pom` 파일을 필수로 요구한다. jar가 존재하더라도 pom이 없으면 의존성 해석이 실패한다.

## 해결

라이브러리 저장소에서 재배포를 수행했다.

```bash
cd /path/to/commons-library
./gradlew clean build
./gradlew publish
```

재배포 후 build #7이 생성되었고, 이번에는 `.jar`과 `.pom`이 모두 정상적으로 업로드되었다. 소비자 프로젝트에서 캐시를 갱신하니 빌드가 성공했다.

```bash
./gradlew build --refresh-dependencies
```

## 불완전 배포가 발생하는 원인

publish 과정에서 아티팩트가 일부만 업로드될 수 있는 상황들:

- **네트워크 중단**: jar 업로드 후 pom 업로드 전에 연결이 끊긴 경우
- **프로세스 강제 종료**: `./gradlew publish` 실행 중 Ctrl+C 등으로 중단한 경우
- **GitHub Packages 서버 오류**: 업로드 요청이 부분적으로만 처리된 경우

GitHub Packages는 Maven 저장소와 달리 한 번 올라간 아티팩트를 덮어쓸 수 없지만, SNAPSHOT은 새 빌드 번호로 추가 배포가 가능하므로 재배포로 해결할 수 있다.

## 배포 후 확인 방법

publish 후 아티팩트가 완전히 올라갔는지 확인하는 습관을 들이면 이런 문제를 조기에 발견할 수 있다.

```bash
# GitHub API로 패키지 버전 확인
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/orgs/{ORG}/packages/maven/{PACKAGE}/versions" \
  | jq '.[0]'

# 또는 직접 pom 파일 접근 확인
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://maven.pkg.github.com/{ORG}/{REPO}/com/planitsquare/commons/security/1.0.0-SNAPSHOT/security-1.0.0-{TIMESTAMP}-{BUILD}.pom"
```

## 정리

| 단계 | 내용 |
|------|------|
| 증상 | SNAPSHOT 의존성 해석 실패 |
| 진단 | `--debug` 로그에서 pom 404 확인 |
| 원인 | 불완전 배포로 pom 파일 누락 |
| 해결 | 라이브러리 저장소에서 `./gradlew publish` 재실행 |
| 예방 | 배포 후 아티팩트 존재 여부 확인 |

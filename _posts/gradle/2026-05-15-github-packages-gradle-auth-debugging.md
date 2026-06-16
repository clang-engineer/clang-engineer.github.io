---
title       : GitHub Packages 인증 실패 시 3단계 단계별 검증
description : "Gradle/GitHub Packages 인증 실패를 토큰/스코프/패키지 접근 3단계로 분리해 검증하는 방법"
date        : 2026-05-15 10:00:00 +0900
updated     : 2026-05-15 10:00:00 +0900
categories  : [gradle, "GitHub Packages"]
tags        : [github-packages, powershell, java]
pin         : false
hidden      : false
---

Gradle이 `Could not resolve com.foo:bar:1.0.0-SNAPSHOT` 로 죽을 때, 토큰을 갱신해도 계속 실패한다면 원인이 토큰이 아닐 가능성이 크다. 단계별로 분리해서 봐야 한다.

## 3단계 분리 체크

토큰 → 스코프 → 패키지 접근. 한 줄로 묶지 말고 따로 본다.

```powershell
# 1) 토큰 자체 유효성 (인증 통과 여부)
curl.exe -s -o nul -w "%{http_code}`n" `
  -H "Authorization: Bearer $env:GITHUB_TOKEN" `
  https://api.github.com/user
# 200 = OK, 401 = 만료/오타

# 2) read:packages 스코프 부착 여부
curl.exe -sI -H "Authorization: Bearer $env:GITHUB_TOKEN" `
  https://api.github.com/user | Select-String "x-oauth-scopes"
# 응답 헤더에 read:packages 포함되어 있어야 함

# 3) 실제 패키지 URL 접근 (SSO authorize 포함 최종 검증)
curl.exe -s -o nul -w "%{http_code}`n" `
  -u "${env:GITHUB_ACTOR}:${env:GITHUB_TOKEN}" `
  https://maven.pkg.github.com/ORG/REPO/com/foo/bar/1.0.0-SNAPSHOT/maven-metadata.xml
```

3단계 결과 해석:

| 코드 | 의미 |
|---|---|
| 200 | 정상 — Gradle도 빌드 성공해야 정상 |
| 401 | username 누락 또는 토큰 만료 |
| 403 | **SSO authorize 누락** — 토큰 페이지에서 "Configure SSO → Authorize" 클릭 |
| 404 | 조직 멤버십 없음 또는 패키지 visibility 문제 |

## 토큰을 고쳤는데도 Gradle이 계속 실패한다면

Gradle은 한 번 실패한 의존성 해석을 **24시간 negative cache** 한다. 그래서 토큰 고치고 그냥 다시 돌리면 캐시 때문에 또 401처럼 보인다.

```powershell
.\gradlew.bat --refresh-dependencies <task>
```

## PowerShell 셸에선 OK인데 IDE에선 실패한다면

`~/.secrets.ps1` 같은 dot-source 파일은 **PowerShell `$PROFILE`이 실행될 때만** 로드된다. IntelliJ/VSCode 같은 IDE는 보통 profile을 안 거치고 부모 프로세스의 환경변수만 상속받는다.

해결책 — 사용자 환경변수에 영구 등록:

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_ACTOR", $env:GITHUB_ACTOR, "User")
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $env:GITHUB_TOKEN, "User")
```

IDE를 트레이까지 완전 종료 후 재시작해야 반영된다.

## 가장 흔히 빠뜨리는 함정

SAML SSO를 쓰는 조직에선 PAT 만들고 토큰 옆 "Configure SSO → Authorize"를 **명시적으로 클릭**해야 한다. 안 하면 토큰은 유효하고 스코프도 맞는데 403이 뜬다. 1·2단계는 통과하고 3단계만 막히는 게 특징.

---
title       : "GitHub Packages 401 디버깅 — 토큰 유효성 분리 검증 + Claude Code env 함정"
description : "Packages 401은 토큰 유효성과 Packages 권한을 분리해 확인하고, fork된 셸은 옛 env를 본다"
date        : 2026-06-15 10:00:00 +0900
updated     : 2026-06-15 10:00:00 +0900
categories  : [git]
tags        : [github-packages, github-pat, curl, claude-code, gradle]
pin         : false
hidden      : false
---

GitHub Packages에서 401 Unauthorized 떴을 때 **토큰 자체 유효성**과 **Packages 권한**을 분리해서 확인해야 한다. 그리고 환경변수가 있어 보여도 Claude Code(또는 다른 fork된 셸)에선 옛값일 수 있다.

## 1) 토큰 유효성 분리 검증

```bash
# 토큰 자체가 GitHub에서 인증되는지 (Packages 권한 무관)
curl -i -u "$GITHUB_ACTOR:$GITHUB_TOKEN" https://api.github.com/user | head -3
# HTTP/2 200 → 토큰 유효, Packages 권한·스코프 문제 따로 보기
# HTTP/2 401 → 토큰 자체가 거부됨 (아래 원인 체크)

# Packages 메타데이터 접근 가능한지
curl -i -u "$GITHUB_ACTOR:$GITHUB_TOKEN" \
  https://maven.pkg.github.com/<org>/<repo>/<group-path>/<artifact>/<version>/maven-metadata.xml \
  | head -3
```

`/user` 401인데 Gradle만 탓하면 안 됨. 토큰 자체가 문제.

## 2) `/user`가 401일 때 흔한 원인

- **토큰 만료** — fine-grained는 만료 짧음
- **revoke** — 본인이/관리자가 무효화
- **SSO 미인증** — org에 SAML SSO 걸려있으면 토큰 옆 "Configure SSO" → org authorize 필수
- **오타/줄바꿈** — `~/.secrets` 같은 파일에 따옴표·trailing newline 섞이면 invalid

## 3) Claude Code env 캡쳐 함정

Claude Code 세션이 시작될 때 환경변수가 캡쳐된다. **세션 시작 후 사용자가 토큰 갱신해도 Claude 세션 안에선 옛값**.

증상:
```bash
# 사용자 셸
curl -i -u "$GITHUB_ACTOR:$GITHUB_TOKEN" https://api.github.com/user | head -1
# HTTP/2 200 ✓

# Claude 세션 안
curl -i -u "$GITHUB_ACTOR:$GITHUB_TOKEN" https://api.github.com/user | head -1
# HTTP/2 401 ✗
```

해결:
- 새 터미널에서 Claude Code 재실행 → 새 env 캡쳐
- 또는 `!` prefix로 사용자 권한 명령 실행 (`!cd ... && ./gradlew ...`)
- 또는 사용자가 셸에서 직접 실행 후 결과만 Claude에 전달

## 4) 토큰 영구 저장

```properties
# ~/.gradle/gradle.properties
GITHUB_ACTOR=your-username
GITHUB_TOKEN=ghp_...
```

```bash
# ~/.secrets (source 패턴)
export GITHUB_ACTOR=your-username
export GITHUB_TOKEN=ghp_...
```

필요 스코프(classic PAT): `repo`, `read:packages`, `write:packages`

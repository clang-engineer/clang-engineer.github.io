---
title       : "kotlin-language-server가 import를 못 잡을 때 — kls_database.db 캐시 삭제"
description : "부팅 시 Gradle 실패로 빈 classpath가 kls_database.db에 박히면 import가 전부 unresolved — 캐시 삭제"
date        : 2026-06-16 11:00:00 +0900
updated     : 2026-06-16 11:00:00 +0900
categories  : [neovim]
tags        : [neovim, lsp, kotlin, gradle, debugging]
pin         : false
hidden      : false
---

fwcd/kotlin-language-server는 **LSP 부팅 시점에만** Gradle classpath를 추출해서 프로젝트 루트의 `kls_database.db`에 캐시한다. 부팅 당시 Gradle이 실패하면 (인증 401, 일시적 네트워크 끊김 등) **빈 classpath가 캐시에 박혀버리고**, 원인을 고친 뒤에도 LSP는 stale 캐시만 본다 → 모든 import가 unresolved.

## 증상

- 어제까지 멀쩡하던 프로젝트에서 갑자기 `Unresolved reference: Foo` 폭발
- `./gradlew compileKotlin` 은 통과 → classpath 자체는 멀쩡
- `:LspRestart` 해도 동일

## 해결

```bash
# 1. classpath 확보 (Gradle이 정상 실행되는지 확인 — 인증 문제면 여기서 보임)
./gradlew compileKotlin -x npmInstall -x fixedNpm

# 2. stale 캐시 삭제
rm kls_database.db kls_database.db.lock 2>/dev/null

# 3. nvim 재시작 (LspRestart 말고 nvim 자체를 끄고 다시)
```

재부팅 시점에 Gradle이 성공하면 fresh classpath가 다시 캐시됨.

## 진단 순서 (혼동 방지)

1. `~/.local/state/nvim/lsp.log` 우선 — `cmd not executable` 류 1차 에러는 캐시 문제 아님
2. `kotlinLSPProjectDeps` Gradle task가 던지는 401 / `Could not find` 메시지 확인
3. 사내 패키지면 인증 환경변수 (`GITHUB_ACTOR`/`GITHUB_TOKEN` 등) 점검
4. **이 모든 게 OK인데도 import 못 잡으면** `kls_database.db` stale 의심

## 왜 헷갈리는가

토큰을 어제 안에 고쳤더라도, LSP가 토큰 깨진 상태로 한 번이라도 부팅했다면 캐시는 그 시점에 박혀버린다. **현재 환경이 정상 ≠ 캐시가 정상**. nvim 재시작도 캐시 삭제는 안 함.

## 참고

- 트래킹 메모: 같은 함정으로 #600 documentHighlight 크래시(`textDocument/documentHighlight: -32603 Internal error`)와 헷갈리기 쉬움 — 크래시 알림은 자주 안 뜨지만, "인식 안 됨" 증상은 거의 항상 classpath/캐시 문제

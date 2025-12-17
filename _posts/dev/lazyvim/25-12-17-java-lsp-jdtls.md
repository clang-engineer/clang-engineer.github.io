---
title       : LazyVim Java LSP (jdtls) 작동 안함
description : Java 21 + jenv export 플러그인 설정으로 해결
date        : 2025-12-17 16:37:51 +0900
updated     : 2025-12-17 16:52:03 +0900
categories  : [dev, lazyvim]
tags        : [lazyvim, java, lsp, jdtls, jenv]
pin         : false
hidden      : false
---

## 이슈
- LazyVim 설치 후에도 **Java LSP (jdtls)가 작동하지 않음**
- Kotlin은 정상인데 Java 파일에서 `gd` 등 LSP 기능 미동작
- `:LspInfo`에 `kotlin_language_server`만 보이고 `jdtls`는 없음

---

## 증상 정리

### 1. Neovim / LazyVim 쪽 증상
- Java 파일에서:
  - `gd`, `gr`, `K` 등 LSP 기능 동작 안 함
- `:LspInfo`
  - ❌ `jdtls` 없음
- 로그:
  ```text
  Client jdtls quit with exit code 1 / 13
  ```

---

### 2. LSP 로그 에러

`~/.local/state/nvim/lsp.log`:

```text
Exception: jdtls requires at least Java 21
```

또는:

```text
java home 안보임
```

---

## 원인 분석

### 🔴 핵심 원인 1 — jdtls는 Java 21 이상 필요

* 최신 `jdtls`는 **Java 21 이상 필수**
* Java 17 사용 시:

  * jdtls 실행 즉시 종료
  * LSP attach 실패

---

### 🔴 핵심 원인 2 — `JAVA_HOME` 미설정

* `java -version`은 정상이어도:

  * `JAVA_HOME`이 없으면 jdtls 실패
* jdtls는 **반드시 `JAVA_HOME`을 참조**

---

### 🔴 원인 3 — jenv 사용 시 export 플러그인 미활성화

* jenv 기본 상태:

  * `java` 실행은 되지만
  * `JAVA_HOME`은 자동 설정 ❌
* 결과:

  * Neovim / jdtls / Gradle이 Java 못 찾음

---

## 해결 방법

### ✅ 1. Java 21 설치 및 설정

```bash
jenv install 21
jenv global 21
```

---

### ✅ 2. jenv export 플러그인 활성화 (중요)

```bash
jenv enable-plugin export
```

* **1회만 실행**
* `.zshrc`에 넣지 않음

---

### ✅ 3. `.zshrc` 설정 확인

```bash
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"
```

---
### 4️⃣. 설정 즉시 반영 (중요)

```bash
exec $SHELL -l
```
- 현재 터미널을 닫지 않고 로그인 쉘을 새로 시작
- jenv export 플러그인으로 설정된 JAVA_HOME이 즉시 반영됨
- source ~/.zshrc 보다 확실한 방법

---

## 정상 동작 확인

```bash
java -version
echo $JAVA_HOME
which java
```

기대 결과:

```text
JAVA_HOME=~/.jenv/versions/21.x.x
~/.jenv/shims/java
```

Neovim:

```vim
:LspInfo
```

* ✅ `jdtls` attached
* Java 파일에서 `gd` 정상 동작

---

## 결론 (핵심 요약)

* LazyVim 문제 ❌
* jdtls 문제 ❌
* **Java 버전 + JAVA_HOME 설정 문제**
* jenv 사용 시:

  * `jenv enable-plugin export` 는 필수
  * Java LSP(jdtls)는 Java 21 이상 요구

---

## 한 줄 요약

> **LazyVim에서 Java LSP가 안 붙는 대부분의 원인은
> Java 21 미사용 + jenv export 플러그인 미설정이다**

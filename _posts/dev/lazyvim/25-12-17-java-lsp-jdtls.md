---
title       : LazyVim Java LSP (jdtls) 작동 안함
description : Java 21 + jenv export 플러그인 설정으로 해결
date        : 2025-12-17 16:37:51 +0900
updated     : 2026-02-01 10:36:00 +0900
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

## 문제 1. jdtls 자체가 안 뜸

### 증상
- Java 파일에서 `gd`, `gr`, `K` 등 LSP 기능 동작 안 함
- `:LspInfo`에 `jdtls`가 없음
- 로그:
  ```text
  Exception: jdtls requires at least Java 21
  ```

### 원인
- **jdtls는 Java 21 이상 필요**
- `JAVA_HOME` 미설정(특히 jenv export 미활성화)

### 해결
#### 1) Java 21 설치 및 설정
```bash
jenv install 21
jenv global 21
```

#### 2) jenv export 플러그인 활성화
```bash
jenv enable-plugin export
```

#### 3) `.zshrc` 설정 확인
```bash
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"
```

#### 4) 설정 즉시 반영
```bash
exec $SHELL -l
```

### 정상 동작 확인
```bash
java -version
echo $JAVA_HOME
which java
```

Neovim:
```vim
:LspInfo
```

---

## 문제 2. jdtls는 뜨는데 `gd/gr`가 비어짐

### 증상
- `jdtls`는 붙었는데 `gd/gr` 결과가 없음
- 로그에 아래 메시지 반복(대표 사례):
  ```text
  Can't use Java 21.x and Gradle 7.5 to import Gradle project
  Unsupported class file major version 65
  ```

### 원인
- **빌드/컴파일 JDK**와 **jdtls 런타임 JDK**가 다를 때 충돌 가능
- 대표 사례: **Gradle 7.5는 Java 21을 지원하지 않음**
- 빌드 동기화 실패 → 인덱싱 실패 → `gd/gr` 비어짐

### 해결
#### 핵심
- **jdtls는 Java 21**
- **빌드/컴파일(Gradle/Maven)은 프로젝트 요구 버전**(예: 11/17)으로 고정

#### LazyVim 설정 예시
```lua
return {
  {
    "mfussenegger/nvim-jdtls",
    opts = function(_, opts)
      local java_home = vim.fn.trim(vim.fn.system("/usr/libexec/java_home -v 21"))
      local gradle_java_home = vim.fn.trim(vim.fn.system("/usr/libexec/java_home -v 17"))

      local cmd = { vim.fn.exepath("jdtls") }
      local lombok_jar = vim.fn.expand("$MASON/share/jdtls/lombok.jar")
      table.insert(cmd, string.format("--jvm-arg=-javaagent:%s", lombok_jar))
      table.insert(cmd, "--java-executable")
      table.insert(cmd, java_home .. "/bin/java")

      opts.jdtls = vim.tbl_deep_extend("force", opts.jdtls or {}, {
        cmd = cmd,
        cmd_env = {
          JAVA_HOME = gradle_java_home,
          GRADLE_OPTS = "-Dorg.gradle.java.home=" .. gradle_java_home,
        },
      })

      opts.test = false
    end,
  },
}
```

#### 캐시 정리 (필요 시)
```bash
rm -rf ~/.cache/nvim/jdtls/ResearchEx
rm -rf ~/.gradle/daemon ~/.gradle/caches/7.5
```

---

## 프로젝트별 설정 (.nvim.lua)

**목적**: 문제 2처럼 **프로젝트별로 JDK 분리**가 필요할 때 사용

### 1) Neovim에서 로컬 설정 허용
```lua
vim.opt.exrc = true
vim.opt.secure = true
```

### 2) 프로젝트 루트에 `.nvim.lua` 생성
템플릿 (OS 무관, 경로 직접 지정):

```lua
vim.env.JDTLS_JAVA_HOME = "<path-to-jdk-21>"
vim.env.GRADLE_JAVA_HOME = "<path-to-jdk-17>"
```

예시:
```lua
vim.env.JDTLS_JAVA_HOME = "/path/to/jdk-21"
vim.env.GRADLE_JAVA_HOME = "/path/to/jdk-17"
```

#### OS별 자동 탐지 스니펫

macOS:
```lua
vim.env.JDTLS_JAVA_HOME = vim.fn.trim(vim.fn.system("/usr/libexec/java_home -v 21"))
vim.env.GRADLE_JAVA_HOME = vim.fn.trim(vim.fn.system("/usr/libexec/java_home -v 17"))
```

Linux (배포판에 따라 경로 다름):
```lua
vim.env.JDTLS_JAVA_HOME = vim.fn.trim(vim.fn.system("readlink -f /usr/lib/jvm/java-21-openjdk"))
vim.env.GRADLE_JAVA_HOME = vim.fn.trim(vim.fn.system("readlink -f /usr/lib/jvm/java-17-openjdk"))
```

Windows (환경변수에서 읽기):
```lua
vim.env.JDTLS_JAVA_HOME = vim.fn.trim(vim.fn.system(
  "powershell -NoProfile -Command \"[Environment]::GetEnvironmentVariable('JDTLS_JAVA_HOME','User')\""
))
vim.env.GRADLE_JAVA_HOME = vim.fn.trim(vim.fn.system(
  "powershell -NoProfile -Command \"[Environment]::GetEnvironmentVariable('GRADLE_JAVA_HOME','User')\""
))
```

### 3) 동작 확인
- 해당 프로젝트에서만 Gradle JDK가 바뀜
- 전역 설정에는 영향 없음

---

## 환경변수로도 해결 가능

Unix 계열 예시:

```bash
export JDTLS_JAVA_HOME="/path/to/jdk-21"
export GRADLE_JAVA_HOME="/path/to/jdk-17"
```

---

## 결론 (핵심 요약)

- **문제 1**: `JAVA_HOME` 미설정/낮은 JDK → jdtls가 안 뜸
- **문제 2**: 빌드 JDK와 jdtls JDK 불일치 → `gd/gr` 인덱스가 비어짐

---

## 한 줄 요약

> **LazyVim Java LSP 문제는 거의 항상
> (1) JAVA_HOME 미설정 또는 (2) JDK 불일치로 인한 빌드 동기화 실패**

---
title       : LazyVim Java LSP (jdtls) 작동 안함
description : jdtls 실행 JDK·빌드 JDK·손상된 인덱스를 구분해 Java LSP 오류 진단하기
date        : 2025-12-17 16:37:51 +0900
updated     : 2026-11-16 12:00:00 +0900
categories  : [troubleshooting, "neovim"]
tags        : [java, lsp, jdtls, jenv, troubleshooting]
pin         : false
hidden      : false
redirect_from:
  - /posts/neovim/java-lsp-jdtls/
---

## 이슈
- LazyVim 설치 후에도 **Java LSP (jdtls)가 작동하지 않음**
- Kotlin은 정상인데 Java 파일에서 `gd` 등 LSP 기능 미동작
- `:LspInfo`에 `kotlin_language_server`만 보이고 `jdtls`는 없음

먼저 `:LspInfo`에서 서버가 **시작조차 안 했는지**, **붙었지만 프로젝트 동기화에 실패했는지** 구분한다. 빌드가 성공하는데 에디터만 내부 타입을 못 찾는다면 JDK를 바꾸기 전에 JDTLS 인덱스 상태를 확인한다.

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
- 당시 설치된 jdtls가 요구한 실행 JDK는 21 이상이었는데, Neovim에서 전달된 JDK가 낮거나 `JAVA_HOME`이 설정되지 않았다.
- **실행 JDK 최소 버전은 jdtls 릴리스에 따라 달라진다.** 현재 upstream 문서의 요구 버전은 25이므로, 설치된 jdtls가 출력하는 오류와 해당 릴리스의 요구 사항을 기준으로 확인한다.
### 해결
#### 1) 요구 버전의 JDK를 설치하고 jenv에서 선택
```bash
jenv versions
jenv add "/path/to/jdtls-jdk"
jenv global 25  # jenv versions에 표시된 설치 버전 별칭 사용
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
printf '%s\n' "$JAVA_HOME"
"$JAVA_HOME/bin/java" -version
which java
```

Neovim:
```vim
:LspInfo
```

`java -version`은 `PATH`에 잡힌 실행 파일만 보여 준다. `JAVA_HOME`과 아래 설정에서 지정한 **jdtls 실행 파일의 버전**을 별도로 확인해야 한다.

#### macOS·버전 매니저에서 JDK 탐지가 빗나갈 때

`/usr/libexec/java_home -v 21`은 엄격한 버전 검사가 아니다. macOS `java_home(1)`에 따르면 일치하는 JVM이 없으면 기본 JVM 경로를 반환할 수 있다. 실제로 21이 없는데 8 경로와 종료 코드 0을 받은 사례가 있었다. `-F`는 일치 항목이 없을 때 실패하도록 하지만, **반환 경로의 `bin/java`가 요구하는 major인지도 확인**한다.

```bash
/usr/libexec/java_home -V
candidate=$(/usr/libexec/java_home -F -v 25) &&
  "$candidate/bin/java" -version   # major가 25인지 확인한 뒤 JDTLS_JAVA_HOME으로 지정
```

위의 25는 현재 upstream 요구 버전의 예다. 설치된 jdtls가 다른 버전을 요구하면 그에 맞춰 바꾼다. `java_home`이 못 찾는다고 JDK 자체가 없는 것은 아니다. mise·asdf의 기본 설치 경로는 각각 `~/.local/share/mise/installs/java/*`, `~/.asdf/installs/java/*`이며 `java_home`에 등록되지 않을 수 있다. `MISE_DATA_DIR`·`ASDF_DATA_DIR`·`MISE_INSTALLS_DIR` 등으로 위치를 바꿨다면 버전 매니저의 실제 설치 경로(`mise where java`, `asdf where java <설치 버전>`)를 확인한다. 디렉터리 이름의 `temurin-21...` 같은 표기만 믿지 말고 각 후보의 실제 버전을 확인한다.

JDK 홈의 `release` 파일에서 `JAVA_VERSION="21..."`을 읽으면 빠르지만 일부 배포본에는 파일이 없다. 그때는 `bin/java -version` 출력(표준 오류 포함)을 읽는다. `1.8...`은 major 8, `21...`은 major 21이다. Lua 탐지 코드를 직접 작성한다면 다음처럼 **발견한 모든 후보를 검사**한다.

```lua
local function major_of(home)
  local release = home .. "/release"
  if vim.fn.filereadable(release) == 1 then
    for _, line in ipairs(vim.fn.readfile(release)) do
      local version = line:match('^JAVA_VERSION="([^"]+)"')
      if version then
        return tonumber(version:match("^1%.(%d+)") or version:match("^(%d+)"))
      end
    end
  end
  local java = home .. "/bin/java"
  if vim.fn.executable(java) ~= 1 then return nil end
  local output = vim.fn.system(vim.fn.shellescape(java) .. " -version 2>&1")
  if vim.v.shell_error ~= 0 then return nil end
  local version = output:match('version%s+"([^"]+)"')
  return version and tonumber(version:match("^1%.(%d+)") or version:match("^(%d+)"))
end

local roots = { vim.fn.expand("~/.local/share/mise"), vim.fn.expand("~/.asdf") }
if vim.env.MISE_DATA_DIR and vim.env.MISE_DATA_DIR ~= "" then
  table.insert(roots, vim.env.MISE_DATA_DIR)
end
if vim.env.ASDF_DATA_DIR and vim.env.ASDF_DATA_DIR ~= "" then
  table.insert(roots, vim.env.ASDF_DATA_DIR)
end
local selected
for _, root in ipairs(roots) do
  for _, home in ipairs(vim.fn.glob(root .. "/installs/java/*", false, true)) do
    if major_of(home) == 25 then
      selected = home
      break
    end
  end
  if selected then break end
end
assert(selected, "설치된 jdtls가 요구하는 JDK 홈을 찾지 못했습니다")
vim.env.JDTLS_JAVA_HOME = selected
```

`{ vim.env.MISE_DATA_DIR, ... }`처럼 설정되지 않은 환경변수를 배열 첫 칸에 넣으면 `nil` 홀이 생겨 `ipairs`가 처음부터 멈춘다. 필수 기본 경로를 먼저 넣고 선택 경로만 조건부로 추가해야 한다. 버전 파서만 별도로 확인하지 말고, 후보를 순회하는 **전체 탐지 경로**가 실제 JDK를 찾아내는지도 확인한다.

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
- jdtls가 붙었더라도 **Gradle 프로젝트 가져오기(import)** 가 실패하면 `gd/gr`가 비어 있을 수 있다.
- 당시 사례의 Gradle 7.5는 Java 21에서 **실행**할 수 없었다. 서버 실행 JDK와 Gradle 실행 JDK는 별개이며, 단순히 두 버전이 다르다는 것만으로 오류가 나는 것은 아니다.

### 해결
#### 핵심
- **jdtls 실행 JDK는 설치된 서버 릴리스의 요구 버전**(아래 예시는 25)
- **Gradle 실행 JDK는 프로젝트 Gradle 버전과 호환되는 버전**(아래 Gradle 7.5 예시는 17)으로 분리. 컴파일에 쓰는 toolchain JDK와 Gradle 자체 실행 JDK도 구분한다.

#### LazyVim 설정 예시
JDK 홈은 프로젝트 설정 또는 환경변수로 전달한다. `java_home`의 출력이나 이름만 신뢰하지 않고 **설정에 사용하기 전에** 해당 `bin/java`의 실제 major를 검사한다.

```lua
local function checked_home(home, required)
  assert(type(home) == "string" and home ~= "", "JDK 홈을 먼저 지정하세요")
  local java = home .. "/bin/java"
  assert(vim.fn.executable(java) == 1, "JDK 실행 파일이 없습니다: " .. java)
  local output = vim.fn.system(vim.fn.shellescape(java) .. " -version 2>&1")
  assert(vim.v.shell_error == 0, "JDK 버전을 읽지 못했습니다: " .. java)
  local version = output:match('version%s+"([^"]+)"')
  local major = version and tonumber(version:match("^1%.(%d+)") or version:match("^(%d+)"))
  assert(major == required, ("JDK %d이(가) 필요하지만 %s입니다"):format(required, version or "알 수 없음"))
  return home
end

return {
  {
    "mfussenegger/nvim-jdtls",
    opts = function(_, opts)
      local java_home = checked_home(vim.env.JDTLS_JAVA_HOME, 25)
      local gradle_java_home = checked_home(vim.env.GRADLE_JAVA_HOME, 17)

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

기존 릴리스가 21을 요구한다면 그 릴리스에 맞는 홈과 검증 값을 사용한다. 이 예시의 17도 사용 중인 Gradle 버전에 맞춰 선택해야 한다.

Gradle 가져오기 오류가 실제로 있는지 로그와 `./gradlew --version`을 먼저 확인한다. 캐시는 이 단계에서 지우지 않는다.

## 문제 3. 빌드는 성공하지만 Java 타입만 `cannot be resolved`

### 증상과 원인 구분
내부 타입과 생성 소스의 참조가 Java LSP에서만 깨진 사례가 있었다. 당시 Gradle 8.14.3을 Java 21에서 실행한 `./gradlew compileJava`는 성공했다. 실제 소스 오류나 Gradle 버전 충돌로 단정하지 말고 **빌드 결과와 에디터 진단을 분리**한다.

```bash
./gradlew --version
./gradlew compileJava
```

빌드가 성공해도 JDTLS의 색인이 최신이라는 뜻은 아니다. 한 사례에서는 JDTLS workspace의 `.metadata/.log`에 다음이 기록돼 있었다.

```text
Java Index broken - will be automatically deleted to repair
java.io.UTFDataFormatException: Failed to read index data
Caused by: java.lang.OutOfMemoryError: Java heap space
Failed to save JDT index: Index for /<project>
```

이 경우 손상된 JDT 인덱스가 확인된 직접 원인이었다. 인덱스의 잘못된 데이터 길이를 읽는 과정에서 힙 부족 오류가 이어진 것이므로 `OutOfMemoryError`만 보고 메모리 크기를 원인으로 단정하지 않는다. 같은 workspace를 쓰는 JDTLS 프로세스 두 개도 관찰됐지만 **동시 실행이 손상의 원인이었다는 증거는 없다.** 생성 소스의 `Q*.java`나 Gradle 전역 캐시를 손대기보다 해당 프로젝트 workspace부터 확인한다.

### 확인과 복구 순서
1. 서버가 붙어 있고 빌드가 성공한다면, `:JdtRestart`가 등록된 환경에서는 **캐시를 건드리기 전에** 먼저 실행한다. 다른 사례에서는 이것만으로 오래된 진단이 사라졌다.
2. 오류가 남으면 실행 중인 jdtls 명령의 `-data` 인자로 **실제 workspace 경로**를 확인한다. 아래 캐시 경로는 한 구성의 예일 뿐, 모든 설치에 공통인 경로가 아니다.
3. 그 workspace의 `.metadata/.log`에서 색인 오류를 찾는다. 인덱스 손상이 확인되고 재시작으로도 해결되지 않을 때만 해당 프로젝트의 workspace를 백업 후 재생성한다.

```vim
:JdtRestart
```

```bash
ps auxww | grep -E '[j]dtls|[o]rg.eclipse.equinox.launcher'
# -data가 가리키는 경로를 아래에 입력한다. 이 예시는 프로젝트별 nvim-jdtls 캐시다.
workspace="$HOME/.cache/nvim/jdtls/<project>/workspace"
grep -E 'Java Index broken|Failed to read index data|OutOfMemoryError|Failed to save JDT index|Wrong index format' "$workspace/.metadata/.log"
```

실제로 사용 중인 workspace가 맞는지 확인하고 **관련 Neovim·jdtls 프로세스를 종료한 뒤에만**, 문제가 난 workspace 하나를 복구 가능하게 보관한다.

```bash
test -d "$workspace" &&
  backup=$(mktemp -d "${workspace}.backup.XXXXXXXX") &&
  mv "$workspace" "$backup/workspace"
```

Neovim을 다시 시작해 프로젝트를 다시 가져오게 하고, Gradle 빌드와 `gd/gr`를 **각각** 확인한다. 생성 파일을 직접 수정하거나 `~/.gradle/caches` 전체를 재귀 삭제하지 않는다.

프로젝트 루트의 `.classpath`, `.project`, `.settings/`나 JDTLS가 생성한 `bin/`까지 오래된 상태로 남아 있다면, 그것들도 생성 산출물인지 확인하고 **백업한 뒤** 재생성한다. 먼저 workspace만 복구해 보고, 필요하지 않으면 프로젝트 파일은 건드리지 않는다.

---

## 프로젝트별 설정 (.nvim.lua)

**목적**: 문제 2처럼 **프로젝트별로 JDK 분리**가 필요할 때 사용

### 1) Neovim에서 로컬 설정 허용
```lua
vim.opt.exrc = true
vim.opt.secure = true
```

### 2) 프로젝트 루트에 `.nvim.lua` 생성
홈을 직접 지정한 예시다. 실제 경로와 버전은 설치 환경에 맞춘다.

```lua
vim.env.JDTLS_JAVA_HOME = "/path/to/jdk-25"
vim.env.GRADLE_JAVA_HOME = "/path/to/jdk-17"
```

OS별 경로 조회 명령이 반환하는 값은 설정에 그대로 복사하지 않는다. macOS의 `java_home`은 위의 `-F` 및 major 확인 절차를 거치고, Linux·Windows에서도 지정한 홈의 `bin/java -version` 결과를 확인한다. 위 LazyVim 설정의 `checked_home`은 전달받은 경로를 사용하기 직전에 검증한다.

### 3) 동작 확인
- 해당 프로젝트에서만 Gradle JDK가 바뀜
- 전역 설정에는 영향 없음

---

## 환경변수로도 해결 가능

Unix 계열 예시:

```bash
export JDTLS_JAVA_HOME="/path/to/jdk-25"
export GRADLE_JAVA_HOME="/path/to/jdk-17"
```

---

## 결론 (핵심 요약)

- **서버가 안 뜸**: 설치된 jdtls가 요구하는 실행 JDK와 실제 전달된 JDK를 비교한다. `java_home`의 조회 결과도 검증한다.
- **서버는 뜨지만 Gradle 가져오기가 실패함**: Gradle 버전과 **Gradle 실행 JDK**의 호환성을 확인한다.
- **빌드는 되는데 에디터만 내부 타입을 못 찾음**: `:JdtRestart`를 먼저 시도하고 JDTLS 로그에서 인덱스 오류를 찾는다. 확인된 프로젝트 workspace만 백업 후 재생성한다.

### 참고 자료
- [eclipse.jdt.ls 실행 JDK 요구 버전과 workspace 안내](https://github.com/eclipse-jdtls/eclipse.jdt.ls#requirements)
- [Gradle Java 호환성 표](https://docs.gradle.org/current/userguide/compatibility.html), [Gradle 7.5 당시 표](https://docs.gradle.org/7.5/userguide/compatibility.html)
- [macOS `java_home(1)` 설명 (`-v`, `-F`)](https://man.freebsd.org/cgi/man.cgi?manpath=macOS+13.6.5&query=java_home&sektion=1)
- [mise 설치 디렉터리](https://mise.jdx.dev/directories.html), [asdf 데이터 디렉터리](https://asdf-vm.com/manage/configuration.html#asdf-data-dir)
- [Lua `ipairs` 정의](https://www.lua.org/manual/5.1/manual.html#pdf-ipairs), [nvim-jdtls의 `JdtRestart` 명령](https://github.com/mfussenegger/nvim-jdtls#usage)

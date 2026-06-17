---
title       : "jvm-env.nvim 발행 회고 — 첫 OSS Neovim 플러그인의 보강 사이클과 awesome-neovim 등록"
description : "왜 만들었는지, v0.1.0 → v0.1.1 보강에서 잡은 정확성 버그(natural sort)·견고성 보강(Homebrew/SDKMAN fallback)·panvimdoc·plenary 테스트 도입, 그리고 awesome-neovim PR까지의 한 사이클 회고"
date        : 2026-06-17 23:30:00 +0900
updated     : 2026-06-17 23:30:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [jvm-env, jdtls, gradle, awesome-neovim, plugin-publication, retrospective]
pin         : false
hidden      : false
---

직접 만든 첫 OSS Neovim 플러그인 [jvm-env.nvim](https://github.com/clang-engineer/jvm-env.nvim)을 발행하고 보강 릴리즈(v0.1.1)까지 돌린 사이클을 정리한다. 절차 가이드는 [awesome-neovim에 내 플러그인 PR 보내기](/posts/awesome-neovim-pr-walkthrough/), [노출 채널 비교](/posts/neovim-plugin-distribution/)에 이미 있으니, 여기는 "보강 사이클에서 무엇을 배웠는가"가 중심이다.

## 왜 만들었나 — niche한 갭

Java 개발 환경에서 흔한 충돌:

- jdtls(Eclipse JDT 언어 서버)는 최신 JDK(예: 21)에서 안정적
- 정작 프로젝트는 LTS JDK(예: Spring Boot 3.x → 17, Android → 17)를 빌드 타깃으로 사용

쉘 `JAVA_HOME`을 프로젝트마다 토글하기 번거롭고, `nvim-jdtls` README는 `/usr/lib/jvm/...` 하드코딩을 보여줘서 크로스플랫폼·멀티버전에서 깨진다. jvm-env는 **메이저 버전 문자열("21")을 받아 현재 OS에서 알맞은 JDK 홈 경로를 찾아 `JDTLS_JAVA_HOME` / `GRADLE_JAVA_HOME`에 주입**하는 얇은 헬퍼다.

인접 도구들 — `nvim-java`(풀스택), `mason.nvim`(LSP 설치), LazyVim Java extras(자동 wire) — 모두 이 분리 니즈를 정면으로 다루지 않는다. nvim-jdtls와 mason.nvim 디스커션에서도 답은 일관되게 "JAVA_HOME 직접 설정해라"였다. 그 갭을 메우는 자리.

## v0.1.0 — 일단 출시한다

첫 출시는 "충분히 좋은가"를 묻기 시작하면 영영 못 한다. v0.1.0 기준:

- 4개 모듈 합쳐 100줄 남짓 (`init` / `config` / `detect` / `env`)
- macOS(jenv / java_home) / Linux(/usr/lib/jvm, SDKMAN) / Windows(Adoptium·scoop) 분기
- LICENSE(MIT), README, stylua CI workflow

`Status: experimental` 톤을 README 상단에 박고 발행. 첫 사이클은 학습 자체가 가치다.

## v0.1.1 — 보강에서 잡은 것들

dogfooding 며칠 안 됐어도 코드를 다시 읽으면 문제가 보인다. v0.1.1에서 잡은 항목을 카테고리별로 정리.

### 1. 정확성 버그 — 알파벳 정렬 ≠ 자연 정렬

`vim.fn.glob("~/.sdkman/candidates/java/21.*")`로 매치된 결과들을 정렬해서 마지막을 고르는 패턴이 있었다. 알파벳 정렬은 `jdk-21.0.10`을 `jdk-21.0.9`보다 **작게** 본다(`'1' < '9'`). patch 10 이상이 같은 메이저에 깔린 환경에서 잘못된 JDK가 선택된다.

자연 정렬로 교체:

```lua
local function nat_key(s)
  local parts = {}
  for num in s:gmatch("%d+") do
    parts[#parts + 1] = tonumber(num)
  end
  return parts
end

local function lt_natural(a, b)
  local ka, kb = nat_key(a), nat_key(b)
  for i = 1, math.max(#ka, #kb) do
    local va, vb = ka[i] or 0, kb[i] or 0
    if va ~= vb then
      return va < vb
    end
  end
  return a < b
end
```

숫자 세그먼트만 추출해 비교한다. 이게 이번 사이클의 가장 명확한 "버그를 막아준 변경"이었다.

### 2. 견고성 — 매니저 가드와 fallback

macOS detect 흐름의 첫 단계는 `jenv prefix <ver>`인데, `jenv` 미설치 환경에서도 매번 spawn 비용을 냈다. `vim.fn.executable("jenv") == 1` 가드 추가.

그리고 `jenv` + `/usr/libexec/java_home` 둘 다 실패하는 환경(예: Homebrew openjdk만 설치)이 의외로 흔하다. fallback 두 단계 추가:

```lua
-- 4. Homebrew openjdk@<ver>
local brew_homes = {
  "/opt/homebrew/opt/openjdk@" .. version .. "/libexec/openjdk.jdk/Contents/Home",
  "/usr/local/opt/openjdk@" .. version .. "/libexec/openjdk.jdk/Contents/Home",
}
for _, path in ipairs(brew_homes) do
  if vim.fn.isdirectory(path) == 1 then
    return path
  end
end
-- 5. SDKMAN
local sdkman = (vim.env.HOME or "") .. "/.sdkman/candidates/java/" .. version .. ".*"
return pick_largest(sdkman)
```

### 3. Windows glob의 백슬래시 함정

처음엔 `vim.fn.glob("C:\\Program Files\\Eclipse Adoptium\\jdk-21.*")`였다. vim glob에서 `\`는 escape 문자다 — `\P`, `\E` 같은 문자가 의도와 다르게 해석될 위험이 있다. forward slash로 통일하고 환경변수도 정규화:

```lua
local roots = {
  vim.env.ProgramW6432,
  vim.env.ProgramFiles,
  "C:/Program Files",
}
for _, root in ipairs(roots) do
  if root and root ~= "" then
    root = root:gsub("\\", "/")
    ...
  end
end
```

`C:\Program Files` 하드코딩 대신 `%ProgramW6432%` / `%ProgramFiles%` 환경변수 체인을 먼저 시도하는 것도 같이 넣었다. 32-bit OS·다른 드라이브 설치를 위해.

### 4. 사용성 — opt-out과 :checkhealth

기본값으로 `jdtls=21, gradle=11` 둘 다 detect하면 한쪽 JDK가 없을 때 매번 `vim.notify` 경고가 뜬다. `false`로 한쪽 비활성:

```lua
require("jvm-env").setup({ jdtls = "21", gradle = false })
-- only JDTLS_JAVA_HOME is touched
```

그리고 `:checkhealth jvm-env`를 추가했다. 사용자가 "어떤 매니저가 보이고, 어떤 경로가 잡혔는지"를 진단 가능하다. 트러블슈팅 요청이 들어와도 health 출력 한 번 받으면 빠르게 끝난다.

### 5. panvimdoc — vimdoc 동기화 부담 해소

초기엔 손으로 `doc/jvm-env.txt`를 작성했다. README와 vimdoc 두 곳을 매번 동기화하는 게 부담이라 한 번 삭제했다가, 다시 `:help jvm-env`를 지원하기 위해 [panvimdoc](https://github.com/kdheepak/panvimdoc) action을 도입했다. GitHub Action 한 파일:

```yaml
name: panvimdoc
on:
  push:
    branches: [main]
    paths:
      - README.md
      - .github/workflows/panvimdoc.yml
permissions:
  contents: write
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Ensure doc directory exists
        run: mkdir -p doc
      - uses: kdheepak/panvimdoc@main
        with:
          vimdoc: jvm-env
          version: "Neovim >= 0.10.0"
          demojify: true
          treesitter: true
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore(doc): auto-generate vimdoc"
          file_pattern: doc/*
```

**함정**: 첫 도입에서 `pandoc: doc/jvm-env.txt: withFile: does not exist`로 실패한다. pandoc은 출력 디렉토리를 자동 생성하지 않는다. `mkdir -p doc` 스텝을 처음부터 넣을 것.

### 6. plenary minimal test

자연 정렬 같은 순수 함수는 단위 테스트 가치가 명확하다. file-local helper는 테스트 위해 노출이 필요한데, 별도 모듈로 분리하는 건 100줄 플러그인엔 과하다. 절충:

```lua
-- Exposed for unit tests only. Not part of the public API.
M._internal = {
  nat_key = nat_key,
  lt_natural = lt_natural,
  pick_largest = pick_largest,
}
```

`_` prefix가 "공개 API 아님" 신호. 테스트:

```lua
describe("lt_natural", function()
  it("orders jdk-21.0.10 after jdk-21.0.9", function()
    assert.is_true(internal.lt_natural("jdk-21.0.9", "jdk-21.0.10"))
    assert.is_false(internal.lt_natural("jdk-21.0.10", "jdk-21.0.9"))
  end)
end)
```

CI는 `rhysd/action-setup-vim@v1`로 nvim 설치 → plenary git clone → `PlenaryBustedDirectory`로 실행. 무거운 프레임워크 도입 없이 핵심 helper만 검증.

## 발행 + 릴리즈 사이클

코드 보강이 끝났으면 릴리즈 메타도 같이 정리.

- `CHANGELOG.md` — [Keep a Changelog](https://keepachangelog.com/) 형식. `[Unreleased]`에 v0.1.1 변경 누적
- README 상단에 `lint` / `test` / `License` 배지
- `Requirements: Neovim 0.10+` 명시 — `vim.uv`, `vim.health.start` 모두 0.10에서 들어왔다

태그를 retroactive로 붙이는 것도 가능하다. 첫 release commit(`feat: initial release v0.1.0`)은 commit message만 v0.1.0이라 부르고 tag는 없었다. 사후 부착:

```sh
git tag -a v0.1.0 <initial-sha> -m "v0.1.0 - initial release"
git tag -a v0.1.1 -m "v0.1.1 - hardening + health + scaffolding"
git push origin main v0.1.0 v0.1.1
gh release create v0.1.0 --title "v0.1.0 - initial release" --notes "..."
gh release create v0.1.1 --title "v0.1.1 - ..." --latest --notes "..."
```

이제 lazy.nvim 사용자가 `version = "v0.1.0"` 같이 핀할 수 있다.

## CI가 첫 push에서 실패한다 — 표준 함정

CI scaffolding을 처음 추가하는 사이클은 거의 100% 첫 push에서 무언가 실패한다. 이번에 만난 두 가지:

**stylua --check 실패** — single-line `if x then return end` 패턴을 작성 시점에 잡지 못해서. 로컬에 `brew install stylua && stylua lua/`로 자동 포맷하면 끝. 더 본질적인 대책: 로컬에 stylua를 prerequisite로 두고 작성 시점에 검증하는 것.

**panvimdoc 실패** — 위에서 언급한 `doc/` 디렉토리 부재.

둘 다 단일 fix commit으로 묶어서 처리하고 다시 push. 세 워크플로(`lint` / `test` / `panvimdoc`) 모두 success로 통과.

## awesome-neovim PR

절차·함정(BSD sed, PR 제목 백틱, 금지어, typos CI 등)은 [awesome-neovim PR 보내기](/posts/awesome-neovim-pr-walkthrough/)에 정리해둔 게 있어 그대로 따라갔다. Programming Languages Support 섹션의 `nvim-java/nvim-java` 바로 아래에 한 줄 추가, [PR #2365](https://github.com/rockerBOO/awesome-neovim/pull/2365)로 제출.

이번에 한 가지 게으른 단축을 시도했다가 함정에 빠졌다. walkthrough가 권하는 `gh repo fork --clone=false` + 별도 `git clone` 분리 대신 `gh repo fork --clone --remote`로 한 줄에 묶으려 했는데, gh가 `git_protocol=ssh` 설정에 따라 `git@github.com:...`로 clone을 시도하면서 ssh config의 host alias(`github.com-<account>`)가 무시되어 인증 실패했다. walkthrough 절차대로 분리해서 직접 clone하면 만나지 않는다. 다음번엔 단축 시도 말고 그대로.

## 결론 — niche 풀이지만 학습 가치는 명확

솔직하게: 이 플러그인의 잠재 사용자 풀은 작다. **Neovim 사용자 → java 개발자 → jdtls 사용자 → jdtls JDK와 Gradle JDK를 분리하고 싶은 사용자**. 마지막 조건이 진짜 진입 장벽이다. nvim-java나 LazyVim Java extras로 충족되는 다수는 분리할 필요가 없다. star 50 정도면 잘 된 편이라고 봐야 한다.

그래도 한 사이클을 끝까지 돈 가치는 분명하다:

- 첫 발행 사이클 — git tag retroactive, gh release 생성, CHANGELOG 형식
- 보강 사이클 — 정확성 버그를 잡는 습관, CI scaffolding(panvimdoc / plenary), test export convention(`_internal`)
- awesome-list PR — fork·branch·README 한 줄 추가의 표준 절차

다음 플러그인은 이 사이클을 의식적 의사결정 없이 빠르게 통과할 수 있다. 첫 OSS 발행을 niche한 도구로 도는 게 권장되는 이유다. 시드 풀 큰 도구로 첫 발행을 시도하면 책임감과 완벽주의가 사이클 자체를 막는다. 작게 시작하고, 한 사이클을 끝까지 본 다음, 다음 도구로 이월.

외부 결과(star, 머지)로 가치를 측정하려고 하면 niche 도구는 실망 가능성이 크다. 본인 학습 자산으로 보면 이미 회수됐다.

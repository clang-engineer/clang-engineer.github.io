---
title       : "awesome-neovim에 내 플러그인 PR 보내기 — gh CLI로 한 번에"
description : "fork → clone → 한 줄 추가 → PR 까지. CONTRIBUTING.md 규칙(백틱 PR 제목, 금지어, 알파벳순 아닌 등록순)을 한 번에 통과시키는 절차"
date        : 2026-06-12 16:00:00 +0900
updated     : 2026-11-16 10:10:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [awesome-neovim, github, gh-cli]
pin         : false
hidden      : false
redirect_from:
  - /posts/neovim/awesome-neovim-pr-walkthrough/
---

[rockerBOO/awesome-neovim](https://github.com/rockerBOO/awesome-neovim)에 본인 플러그인을 등록하는 PR은 한 줄만 추가하면 되지만, 이 목록의 CONTRIBUTING.md와 PR 템플릿 규칙을 놓치면 수정 요청을 받는다. 직접 끝까지 해본 절차와 함정을 정리한다. **아래 형식과 규칙은 awesome-neovim 기준(2026년 6월 작업 당시)**이므로, 다른 awesome 목록에 그대로 적용하지 않는다.

> 실제 머지된 예시: [PR #2355 — `clang-engineer/dadbod-vertica.nvim`](https://github.com/rockerBOO/awesome-neovim/pull/2355) (2026-06-16 머지). 본문 절차대로 진행했고, 리뷰 중 typos CI 함정 하나를 추가로 마주쳤다(아래 "함정 모음 4" 참고).

전체를 `gh` CLI로 처리한다. 브라우저로 fork 누르거나 PR 폼 채울 필요 없음.

## 사전 준비

- GitHub CLI (`gh`) 설치 및 인증
  ```sh
  gh auth status
  ```
- 본인 플러그인 레포가 이미 public, README·LICENSE 정비된 상태

등록할 목록을 먼저 고른다. awesome-neovim 외에도 언어·도구·사용 분야별 awesome 목록이 있지만, 이름만 보고 여러 곳에 같은 설명을 복사하기보다 **프로젝트의 주된 사용 맥락과 해당 목록의 범위**가 맞는지 살핀다. 예를 들어 이후 다른 플러그인을 등록할 섹션을 고를 때는 README의 기존 항목을 비교해 LSP 자체보다는 언어 지원에 가까운 위치를 택했다. 다른 목록에 기여할 때는 그 목록의 규칙을 새로 확인해야 한다.

fork 전에는 [awesome-neovim CONTRIBUTING.md](https://github.com/rockerBOO/awesome-neovim/blob/main/CONTRIBUTING.md)와 [PR 템플릿](https://github.com/rockerBOO/awesome-neovim/blob/main/.github/pull_request_template.md)을 **둘 다 직접 확인**한다. `gh api repos/rockerBOO/awesome-neovim/contents/CONTRIBUTING.md -H 'Accept: application/vnd.github.raw'`처럼 CLI로 읽어도 된다. 템플릿은 본문의 예시를 무조건 재사용하지 말고 현재 요구 사항을 채운 뒤 체크한다.

## 1단계: Fork

```sh
gh repo fork rockerBOO/awesome-neovim --clone=false
```

`--clone=false`로 자동 clone을 막는다. 다른 디렉토리(작업 공간)에 clone하고 싶기 때문.

## 2단계: 작업 공간에 clone

```sh
cd ~/workspace
git clone git@github.com:YOUR_USER/awesome-neovim.git
cd awesome-neovim
git checkout -b add-MY-PLUGIN
```

> 다중 GitHub 계정을 SSH config로 분리해 쓰는 환경이면 `git@github.com-ACCOUNT_ALIAS:...` 형식을 사용한다. fork된 fork·로컬 양쪽 다 같은 alias로 push할 수 있어야 한다.

다른 경로로는 `gh repo fork rockerBOO/awesome-neovim --clone --remote`를 사용해 fork와 clone을 함께 진행할 수 있다. 이때 생성된 로컬 clone의 remote 구성을 확인하고 자신의 fork 브랜치로 push한다. 위의 `--clone=false` 방식과 **둘 중 하나만** 택하면 된다.

## 3단계: 어디에 추가할지 찾기

섹션 헤더 목록만 빠르게:

```sh
grep -n '^## ' README.md
```

예를 들어 DB 관련은 `## Database` 섹션. **알파벳순이 아니라 등록순**이다. 섹션 마지막 entry 바로 아래에 append하면 된다.

추가하기 전에 대상 섹션에서 **저장소 이름과 URL을 검색**해 이미 등록된 항목이 없는지도 확인한다. 같은 URL을 다른 설명으로 다시 넣으면 중복 링크 검사에 걸릴 수 있다. 필요한 예외가 있는 목록이라도 직접 검증하고, 중복 등록을 숨기는 린트 예외부터 추가하지 않는다.

## 4단계: 한 줄 추가

포맷 (다른 entry들과 동일):

```markdown
- [owner/repo](https://github.com/owner/repo) - 한 줄 설명.
```

**규칙(자주 놓침)**:

| 항목 | 규칙 | 위반 시 |
| --- | --- | --- |
| 줄 끝 | 반드시 `.` | `awesome-list` 린팅 실패 |
| 금지어 | "Neovim", "plugin" 언급 금지 | 리뷰에서 수정 요청 |
| 금지 표현 | `.. for Neovim` 금지 | 위와 같음 |
| 이모지 | 금지 | 위와 같음 |
| 표기 | `Neovim`, `Vim`, `Lua`, `Tree-sitter` 정확히 | 위와 같음 |
| 약어 | `LSP`, `YAML`, `TOML` 등 전부 대문자 | 위와 같음 |

"plugin"/"Neovim" 금지가 핵심이다. 이미 awesome-neovim 안에 있으니 자명한 정보라 빼라는 의미. **"Vertica 플러그인" 같은 표현 대신 "Vertica adapter for ..." 처럼 도구·관계로 서술**한다.

## 5단계: 커밋 & 푸시

```sh
git add README.md
git commit -m "Add username/repo-name"
git push -u origin add-MY-PLUGIN
```

## 6단계: PR 생성

**PR 제목 포맷이 가장 까다롭다**:

````
Add `username/repo` 
````

- `Add`, `Update`, `Remove` 중 하나로 시작
- repo 경로를 **백틱(`)으로 감싸야 한다** — 빼먹으면 자동 봇이 라벨 안 붙임

```sh
gh pr create \
  --repo rockerBOO/awesome-neovim \
  --base main \
  --head YOUR_USER:add-MY-PLUGIN \
  --title 'Add `username/repo`' \
  --body "$(cat <<'EOF'
### Repo URL:

https://github.com/username/repo

### Checklist:

- [x] The plugin is specifically built for Neovim.
- [x] The plugin is licensed.
- [x] The lines end with a `.`. This is to conform to `awesome-list` linting and requirements.
- [x] The title of the pull request is \`\`\`Add/Update/Remove \`username/repo\` \`\`\` (notice the backticks around \`\`\` \`username/repo\` \`\`\`) when adding a new plugin.
- [x] The description doesn't mention that it's a Neovim plugin, it's obvious from the rest of the document. No mentions of the word \`plugin\` unless it's related to something else. No \`.. for Neovim\`.
- [x] The description doesn't contain emojis.
- [x] Neovim is spelled as \`Neovim\` (not \`nvim\`, \`NeoVim\` or \`neovim\`), Vim is spelled as \`Vim\` (capitalized), Lua is spelled as \`Lua\` (capitalized), Tree-sitter is spelled as \`Tree-sitter\`.
- [x] Acronyms (\`LSP\`, \`TS\`, \`YAML\`, etc.) are fully capitalized.
EOF
)"
```

- `--head YOUR_USER:add-MY-PLUGIN` — fork에서 만든 브랜치를 가리킬 때 `OWNER:BRANCH` 형식
- 체크리스트는 PR 템플릿의 항목을 그대로 복사해 `[x]`로 채운 것. 누락하면 봇·리뷰어가 다시 요구함

## 함정 모음

### 1. `./scripts/readme-check.sh`가 macOS sed에서 깨진다

```sh
./scripts/readme-check.sh
# sed: 1: "./README.md": invalid command code .
```

당시 이 스크립트는 GNU sed를 전제로 해 macOS 기본 BSD sed에서 실패했다. 스크립트 실패를 PR 검증 통과로 오인하지 말고, 해당 목록의 CI 결과를 확인하거나 GNU sed 환경에서 다시 실행한다.

정 신경 쓰이면:
```sh
brew install gnu-sed
PATH="$(brew --prefix gnu-sed)/libexec/gnubin:$PATH" ./scripts/readme-check.sh
```

### 2. Fork에 이미 PR이 있는 상태에서 다시 PR 만들기

같은 브랜치명으로 두 번 시도하면 `pull request already exists`로 거절된다. 새 브랜치명을 쓰거나 기존 PR을 닫는다.

### 3. 알파벳순 정렬 가정

awesome 리스트는 보통 알파벳순이라 그렇게 짐작하기 쉽지만, **awesome-neovim Database 섹션은 등록순**이다. 다른 섹션도 가서 확인하지 말고 본인이 추가하려는 섹션의 실제 순서를 보고 마지막에 붙이자.

### 4. `typos` CI가 고유명사를 오타로 잡는다

awesome-neovim은 PR에 [typos](https://github.com/crate-ci/typos) 액션을 돌린다. 본인 플러그인 설명에 나오는 회사·제품명이 영어 단어와 한 글자 차이면 오타로 플래그된다. 예: `Vertica` → `Vertical` 의심.

리뷰어가 직접 고치라고 요청하진 않지만, 체크가 빨갛게 떠 있으면 머지 보류된다. 해결은 같은 PR 안에서 `.github/typos.toml`에 화이트리스트 한 줄 추가:

```toml
[default.extend-words]
Strat = "Strat"
Vertica = "Vertica"   # ← 본인 단어 추가
```

키·값에 같은 단어를 적으면 "이 단어는 오타가 아니라 그대로다"라는 선언이다. 기존 `Strat` 엔트리가 그 선례.

이걸 추가한 커밋을 push하면 CI가 다시 돌고 통과한다. 리뷰어가 매번 알려주는 게 아니므로, **PR 올린 직후 Actions 탭에서 `typos` job이 빨간지 먼저 확인**하면 한 라운드를 아낀다.

### 5. fork 정리

PR이 머지되고 다른 기여를 위해 유지할 필요가 없다면 fork와 로컬 clone을 정리할 수 있다:

```sh
gh repo delete YOUR_USER/awesome-neovim --yes
rm -rf ~/workspace/awesome-neovim
```

머지 전에 fork를 정리하지 말고, PR 상태를 먼저 확인한다.

## 부록: GitHub Topics도 같이

PR 머지를 기다리는 동안 본인 레포에 topics 붙여두면 GitHub 내부 검색에서 잡힌다:

```sh
gh api -X PUT repos/YOUR_USER/YOUR_REPO/topics \
  -f 'names[]=neovim-plugin' \
  -f 'names[]=vim-plugin' \
  -f 'names[]=YOUR-DOMAIN'
```

## 정리

awesome-neovim PR의 실제 작업량은 **한 줄 추가**지만, 대상 섹션·중복 여부를 확인하고 해당 저장소의 규칙(PR 제목 백틱, 줄 끝 `.`, 불필요한 단어 회피)에 맞춰야 한다. 다른 awesome 목록이라면 대상의 CONTRIBUTING·PR 템플릿·기존 항목을 다시 읽는 것부터 시작한다.

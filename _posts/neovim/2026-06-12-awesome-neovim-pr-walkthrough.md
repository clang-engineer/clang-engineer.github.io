---
title       : "awesome-neovim에 내 플러그인 PR 보내기 — gh CLI로 한 번에"
description : "fork → clone → 한 줄 추가 → PR 까지. CONTRIBUTING.md 규칙(백틱 PR 제목, 금지어, 알파벳순 아닌 등록순)을 한 번에 통과시키는 절차"
date        : 2026-06-12 16:00:00 +0900
updated     : 2026-06-12 16:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [awesome-neovim, github, gh-cli]
pin         : false
hidden      : false
---

[rockerBOO/awesome-neovim](https://github.com/rockerBOO/awesome-neovim)에 본인 플러그인을 등록하는 PR은 한 줄만 추가하면 되지만, CONTRIBUTING.md에 숨어있는 규칙을 놓치면 거절당한다. 직접 끝까지 해본 절차와 함정을 정리한다.

전체를 `gh` CLI로 처리한다. 브라우저로 fork 누르거나 PR 폼 채울 필요 없음.

## 사전 준비

- GitHub CLI (`gh`) 설치 및 인증
  ```sh
  gh auth status
  ```
- 본인 플러그인 레포가 이미 public, README·LICENSE 정비된 상태

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

## 3단계: 어디에 추가할지 찾기

섹션 헤더 목록만 빠르게:

```sh
grep -n '^## ' README.md
```

예를 들어 DB 관련은 `## Database` 섹션. **알파벳순이 아니라 등록순**이다. 섹션 마지막 entry 바로 아래에 append하면 된다.

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

GNU sed 가정으로 짜여있어 BSD sed(macOS 기본)에서 에러난다. **본인 한 줄 추가만 했다면 무시해도 통과한다** — 추가한 줄이 기존 entry들과 동일 포맷이면 린팅에 걸릴 게 없음.

정 신경 쓰이면:
```sh
brew install gnu-sed
PATH="$(brew --prefix gnu-sed)/libexec/gnubin:$PATH" ./scripts/readme-check.sh
```

### 2. Fork에 이미 PR이 있는 상태에서 다시 PR 만들기

같은 브랜치명으로 두 번 시도하면 `pull request already exists`로 거절된다. 새 브랜치명을 쓰거나 기존 PR을 닫는다.

### 3. 알파벳순 정렬 가정

awesome 리스트는 보통 알파벳순이라 그렇게 짐작하기 쉽지만, **awesome-neovim Database 섹션은 등록순**이다. 다른 섹션도 가서 확인하지 말고 본인이 추가하려는 섹션의 실제 순서를 보고 마지막에 붙이자.

### 4. fork 정리

PR 머지 후 fork는 더 이상 필요 없다. 본인 GitHub fork와 로컬 clone 둘 다 정리:

```sh
gh repo delete YOUR_USER/awesome-neovim --yes
rm -rf ~/workspace/awesome-neovim
```

머지 전에 삭제하면 PR이 closed로 바뀌니 머지 후 정리할 것.

## 부록: GitHub Topics도 같이

PR 머지를 기다리는 동안 본인 레포에 topics 붙여두면 GitHub 내부 검색에서 잡힌다:

```sh
gh api -X PUT repos/YOUR_USER/YOUR_REPO/topics \
  -f 'names[]=neovim-plugin' \
  -f 'names[]=vim-plugin' \
  -f 'names[]=YOUR-DOMAIN'
```

## 정리

awesome-neovim PR의 실제 작업량은 **한 줄 추가**지만, 메타데이터 규칙(PR 제목 백틱, 줄 끝 `.`, 금지어)에서 막힌다. 위 절차대로 하면 한 번에 통과한다. 전체 소요는 10분 안쪽.

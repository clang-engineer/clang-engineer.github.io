---
title       : "Copilot Business + CopilotChat.nvim \"Model not found\" 진단"
description : "Copilot Business 조직 정책으로 선택 가능한 모델이 없을 때 응답과 정책을 확인하고, 클라이언트 monkey patch 대신 관리자 설정과 upstream 지원으로 해결하는 순서."
date        : 2026-06-17 10:00:00 +0900
updated     : 2026-07-24 15:00:00 +0900
categories  : [neovim]
tags        : [neovim, lazyvim, copilotchat, copilot, lsp, debugging]
pin         : false
hidden      : false
---

## 증상

CopilotChat.nvim에서 어떤 모델을 지정해도 다음 중 하나:

- `Model not found: gpt-4.1` / `Model not found: gpt-5-mini`
- `Resolved model not found: ` (auto 모드, 콜론 뒤 빈 값)

### 원인

이 사례의 GitHub Copilot **Business** 조직 응답(`api.business.githubcopilot.com`)은
`/models` API의 모든 모델을 `model_picker_enabled = false`로 반환했다. 모든 Business 구독이 항상 같은 응답을 준다는 뜻은 아니며 조직 정책에 따라 달라진다.

CopilotChat의 기본 `get_models` 필터:

```lua
return model.capabilities.type == 'chat' and model.model_picker_enabled
```

→ 모든 채팅 모델 탈락 → 합성 `auto` 1개만 남음 → 어떤 모델 ID도 lookup 실패.

조직 정책에서 "model picker"를 닫아둔 상태(개인 Pro 구독에선 발생 안 함).

### 해결

`model_picker_enabled = false`는 서버가 해당 모델을 클라이언트 선택 목록에서 제외하라는 뜻이다. provider 응답을 monkey patch해 이 값을 `true`로 바꾸면 조직 정책을 우회하고, 실제 요청 권한이 보장되지 않으며, 플러그인 업데이트에도 취약하다. 권장 순서는 다음과 같다.

1. 개인 Copilot 기능 설정에서 허용된 모델이 비활성화됐는지 확인한다.
2. Business 조직 관리자에게 Copilot Models 정책과 사용 가능한 모델을 확인해 달라고 요청한다.
3. 정책상 허용 모델이 있는데 CopilotChat만 목록을 비우면 재현 정보와 익명화한 응답 필드를 upstream issue로 전달한다.
4. 정책 변경 전에는 `Auto` 또는 목록에 실제로 노출된 모델만 사용한다. 노출 모델이 0개면 로컬 필터 우회가 아니라 관리자 조치가 필요하다.

### 디버깅 패턴 (재사용 가능)

플러그인이 조용히 모델을 못 찾을 때:

1. 에러 발생 위치 grep — `~/.local/share/nvim/lazy/<plugin>/lua` 안에서
2. **headless nvim으로 런타임 상태 덤프** —
   `nvim --headless -c 'Lazy! load <plugin> plenary.nvim' -c 'luafile /tmp/dump.lua' -c 'qa!'`
   - lazy-load 플러그인은 명시적 `Lazy! load`로 강제 로딩
   - 비동기 API는 `plenary.async.run` + `vim.wait` 조합
3. **provider/client의 raw API 응답을 직접 호출**해서 필터링 전 데이터 확인
4. 필터 조건과 응답을 대조 → 원인 특정

이번 케이스: 1) `client.lua:328 error('Resolved model not found: ...')` 발견
→ 2) `client:models()` 호출해보니 count=1 → 3) raw `/models` 응답 19개인데
`model_picker_enabled=false` 전부 → 4) 필터 한 줄이 원인.

### 관련

> 관련: 개인 플랜에서 단순히 기본 모델이 미지원으로 바뀐 경우라면 `:CopilotChatModels` → Auto 로 끝난다 → [CopilotChat.nvim Model not found 에러 — :CopilotChatModels로 Auto 선택](/posts/lazyvim/2026-06-05-copilotchat-model-not-found/)

- CopilotChat.nvim `lua/CopilotChat/config/providers.lua` `M.copilot.get_models`
- `client.lua:308-328` 모델 lookup + resolve_model 로직
- 최근 upstream 기본값 변경: `84a3968 fix: use gpt-5-mini as default model #1568`
  (이전 기본 `gpt-4.1`도, 새 기본 `gpt-5-mini`도 Business에서는 동일 원인으로 실패)

### 2026-06-17 추가

#### 이 패치는 일반적이지 않다

업스트림 이슈 #1140 코멘트를 보면 대부분의 corporate Copilot 사용자는

```lua
opts.model = "gpt-4o"
```

한 줄로 해결한다. 일부 모델만 picker disabled여서 enabled 모델 ID만 지정하면 동작.

**내 케이스가 특이**: 19개 모델 **전부** `model_picker_enabled = false`여서 어떤 ID도 lookup되지 않았다. 이는 로컬 패치를 강제하는 조건이 아니라 조직 정책 또는 서버 응답을 바로잡아야 한다는 신호다.

#### 코드 패치 전에 먼저 시도할 것

1. **개인 GitHub 설정** — https://github.com/settings/copilot/features 류 경로에서 모델 활성화 토글
   - 일부 모델은 사용자가 직접 "Enabled"로 켜야 함
2. **Org 정책** — Business 관리자가 model picker 자체를 닫아둘 수 있음. 1번 페이지에서 모델 항목이 안 보이면 이 케이스.

위 둘이 풀리면 `ai.lua`는 한 줄로 줄어든다.

#### `:CopilotChatModels` 명령은 존재함

처음 "없는 명령"으로 보였던 건 LazyVim의 lazy-load 때문.
정의 위치: `plugin/CopilotChat.lua:69` (LazyVim 시작 시점엔 미적재).
`:CopilotChat` 한 번 띄워 플러그인 로드 후엔 사용 가능.

런타임 모델 목록 확인하는 다른 경로:

```vim
:lua require("CopilotChat").select_model()
```

#### 디버깅 패턴 보강 — gh로 업스트림 이슈 검색

비슷한 증상의 다른 사용자가 있는지 / 정공 솔루션이 있는지 확인:

```bash
gh issue list --repo <owner>/<repo> --search "<keyword>" --state all
gh issue view <num> --repo <owner>/<repo>
gh api repos/<owner>/<repo>/issues/<num>/comments --jq '.[] | "--- " + .user.login + " ---\n" + .body'
```

`gh search issues`는 `--state all`을 지원하지 않음 (open/closed만). 위처럼 `gh issue list --state all`을 써야 양쪽 다 조회됨.

#### 플러그인 churning 타임라인 재구성

특정 동작이 언제 추가/제거됐는지 추적 — `git log -S` (string add/remove 검색)
+ `--format`으로 일자 노출:

```bash
cd ~/.local/share/nvim/lazy/<plugin>
git log --oneline --all -S "<symbol>" -- <path>
git log --oneline --format="%h %ad %s" --date=short -- <path> | grep -E "keyword"
git show <commit> -- <path>  # 해당 commit이 그 파일에 한 변경 diff
```

이번 케이스 결과:
- PR #874 (2025-02): `model_picker_enabled` 필터 도입
- PR #999 (2025-03): "usability 이슈"로 제거, version map 회귀
- PR #1029 (2025-07, breaking refactor): 재도입 ← 현재
- PR #1518 (2026-02): "Auto" 모드 추가

→ maintainer가 이미 두 번 토글한 trade-off라 단순 "제거 요청" PR은 거절될 가능성. 이슈 올릴 땐 "전 모델 picker disabled" 케이스로 정확히 framing 필요.

#### 플러그인 popularity 비교 (mass 사용자 추정)

대안 플러그인 검토 시 별 수 + 최근 활동 한 번에:

```bash
for repo in "owner1/repo1" "owner2/repo2"; do
  data=$(gh api repos/$repo --jq "{stars: .stargazers_count, pushed: .pushed_at}")
  printf "%-45s %s\n" "$repo" "$data"
done
```

LazyVim 기본 AI extras 확인:

```bash
gh api repos/LazyVim/LazyVim/contents/lua/lazyvim/plugins/extras/ai --jq '.[].name'
gh api repos/LazyVim/LazyVim/contents/lua/lazyvim/plugins/extras/ai/<file>.lua --jq '.content' | base64 -d
```

이번 결과 (2026-06): nvim AI 채팅 시장은 avante.nvim 18k★ 압도. CopilotChat 3.6k★. LazyVim 기본은 copilot.lua + CopilotChat 조합이지만 트렌드는 avante / claudecode 쪽으로 이동.

#### 로컬 인터셉터를 최종 해법으로 두지 않는 이유

`curl.get`이나 provider 함수를 가로채 응답의 정책 필드를 바꾸는 방식은 플러그인 내부 구현에 결합되고, 동시 요청 중 전역 함수를 잠시 교체하며, 서버가 의도적으로 숨긴 모델을 노출한다. 디버깅으로 원인을 확인하는 데서 멈추고 운영 설정에는 남기지 않는다.

---
title       : "CopilotChat.nvim Model not found 에러 — :CopilotChatModels로 Auto 선택"
description : "플러그인 업데이트 후 기본 모델이 Copilot 플랜에서 미지원이 되면 :CopilotChatModels에서 Auto 선택."
date        : 2026-06-05 10:00:00 +0900
updated     : 2026-06-05 10:00:00 +0900
categories  : [lazyvim, "플러그인"]
tags        : [neovim, troubleshooting]
pin         : false
hidden      : false
---

CopilotChat.nvim 플러그인 업데이트 후 `<leader>ap` 등 명령에서 `Model not found: gpt-4.1` 또는 `Model not found: gpt-5-mini` 에러가 발생할 수 있다. 플러그인의 기본 모델이 Copilot 플랜에서 아직 지원하지 않는 모델로 변경되었기 때문이다.

## 해결

Neovim에서 아래 명령 실행 후 `Auto`를 선택한다:

```vim
:CopilotChatModels
```

`Auto`는 Copilot이 현재 플랜에서 사용 가능한 모델을 자동으로 선택해준다. 세션 단위 설정이므로 Neovim 재시작 시 다시 실행해야 할 수 있다.

## 참고

- [CopilotChat.nvim](https://github.com/CopilotC-Nvim/CopilotChat.nvim)
- 관련 커밋: `84a3968 fix: use gpt-5-mini as default model (#1568)`

> 관련: Auto/모델 선택으로도 안 풀리고 `Resolved model not found:` 가 뜬다면 Business 조직 정책 케이스다 → [Copilot Business + CopilotChat.nvim "Model not found" 우회](/posts/copilotchat-copilot-business-model-not-found/)

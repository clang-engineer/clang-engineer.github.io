---
title       : "작은 Pi extension을 만들고 npm에 배포하기 — 완료 알림에서 시작한 플러그인 생태계 참여기"
description : "Pi 작업 완료 알림을 직접 만들며 agent_settled 이벤트, npm pi-package 메타데이터, pi.dev 패키지 인덱싱 흐름을 정리한다."
date        : 2026-10-03 12:00:00 +0900
categories  : [reference, "open-source"]
tags        : [pi, ai-agent, extension, npm, open-source, notification, guide]
pin         : false
hidden      : false
---

AI 코딩 에이전트를 터미널에서 오래 돌리다 보면 단순한 문제가 반복된다. **작업이 끝났는지 계속 확인하게 된다.** 특히 tmux 안에서 여러 창을 오가거나, 다른 앱을 보다가 돌아오는 흐름에서는 에이전트가 이미 끝났는데도 한참 뒤에 알아차리는 일이 생긴다.

Claude Code에는 hook이 있고, opencode에는 plugin event가 있다. 그래서 둘은 작업 완료 시점에 macOS 알림을 붙이기 쉽다. Pi도 extension 생명주기 event를 제공한다. 그렇다면 Pi에도 같은 방식으로 완료 알림을 붙일 수 있다.

처음에는 개인 dotfiles에 작은 local extension을 하나 만들면 끝나는 문제처럼 보였다. 그런데 구현하는 과정에서 한 가지 질문이 생겼다.

> 이미 공개된 plugin이 있다면 직접 유지하지 말고 가져다 쓰는 편이 낫지 않을까?

이 글은 그 질문에서 시작해, 공개 extension을 검토하고, 내 요구사항에 맞는 notify extension을 만들고, 결국 npm package로 배포하기까지의 기록이다.

## 왜 완료 알림이 필요했나

Pi 같은 터미널 AI agent는 일반 CLI 명령과 다르다. 명령이 끝나면 shell prompt로 돌아오는 단발 프로세스가 아니라, 대화형 session 안에서 여러 tool call과 후속 응답을 이어간다. 따라서 단순히 프로세스 종료를 감지해서는 "작업 완료"를 알 수 없다.

Pi 문서에서 중요한 구분은 `agent_end`와 `agent_settled`다.

- `agent_end` — 한 번의 low-level agent run이 끝난 시점
- `agent_settled` — retry, compaction, queued follow-up까지 끝나고 Pi가 더 이상 자동으로 이어가지 않는 시점

완료 알림에 필요한 것은 `agent_end`가 아니라 `agent_settled`다. 중간 run이 끝났다고 알림을 띄우면, 실제로는 Pi가 이어서 복구나 후속 작업을 하고 있을 수 있다.

그래서 extension의 핵심은 단순하다.

```ts
export default function (pi: any) {
  pi.on("agent_settled", async () => {
    // notify
  });
}
```

작업 완료 외에 권한 요청도 알림 대상이 된다. Pi package나 extension이 permission event를 emit하면, 사용자는 agent가 멈춰서 입력을 기다리는 시점을 놓치지 않을 수 있다.

```ts
pi.events.on("permissions:ask", (event: unknown) => {
  // notify permission request
});
```

## 공개 extension을 먼저 검토했다

Pi package는 npm package 위에 얹힌다. `package.json`에 `pi-package` keyword와 `pi` metadata를 넣으면 Pi package catalog가 이를 인덱싱한다. 그래서 `pi.dev/packages`는 별도 심사형 marketplace라기보다 npm 기반 catalog에 가깝다.

완료 알림용 공개 package도 있었다. `@pi-lab/notify`다. 코드를 보니 구조 자체는 참고할 만했다.

- `agent_settled` 사용
- `permissions:ask` 지원
- terminal notification backend 지원
- script hook 지원
- test 포함

하지만 바로 의존하기에는 망설여졌다. package가 나쁘다는 뜻은 아니다. 다만 당시 기준으로 repository는 사실상 개인 중심으로 운영되고 있었고, star와 contributor 신호도 강하지 않았다. 더 중요한 것은 내 요구사항과도 조금 달랐다.

내가 원한 동작은 다음에 가까웠다.

- macOS에서는 `osascript` desktop notification을 기본으로 사용
- terminal OSC notification도 선택 가능
- 완료 알림에 마지막 사용자 입력 요약을 포함
- tmux나 여러 terminal window를 오갈 때 알림이 누락되지 않도록 함
- dotfiles에서 먼저 검증한 뒤 package로 추출

결론은 "공개 extension을 참고하되 그대로 의존하지는 않는다"였다. 작은 기능이라 직접 구현 비용이 낮았고, 나중에 package로 공개하면 오히려 생태계에 참여하는 방식이 된다.

## local extension으로 먼저 검증했다

처음 구현은 dotfiles의 Pi 설정 아래에 두었다.

```text
~/.pi/agent/extensions/notify.ts
~/.pi/agent/settings.json
```

Pi user settings에는 extension 파일을 등록할 수 있다.

```json
{
  "extensions": [
    "extensions/notify.ts"
  ]
}
```

local extension은 실험에 좋다. package publish 없이 바로 Pi에서 reload하고 실제 사용 패턴에서 확인할 수 있기 때문이다.

처음에는 "터미널 앱이 frontmost면 알림을 생략"하려고 했다. macOS에서 `System Events`로 현재 frontmost app 이름을 읽고, Ghostty가 앞에 있으면 알림을 띄우지 않는 방식이다.

하지만 곧 문제가 보였다.

```text
Ghostty가 frontmost
  ├─ 같은 tmux session의 Pi pane을 보고 있음        → 알림 생략해도 됨
  ├─ 다른 tmux window/session을 보고 있음           → 알림이 필요함
  ├─ 다른 Ghostty tab/window를 보고 있음            → 알림이 필요함
  └─ 같은 terminal에서 전혀 다른 작업 중             → 알림이 필요함
```

app 단위 frontmost 판정만으로는 "내가 실제로 Pi 입력창을 보고 있는가"를 알 수 없다. tmux, tab, pane, 여러 terminal window를 고려하면 잘못 생략할 가능성이 더 크다. 그래서 기본값은 알림 누락을 피하는 쪽으로 바꿨다.

```ts
const DEFAULT_CONFIG = {
  skipWhenFrontmost: false,
};
```

원하면 설정으로 다시 켤 수 있게만 남겼다.

## 완료 알림에 마지막 입력을 붙였다

단순히 "Agent 작업 완료"만 띄우면 여러 agent를 돌릴 때 구분이 어렵다. 그래서 마지막 사용자 입력을 짧게 저장해두고 완료 알림에 붙였다.

```ts
pi.on("input", (event: { source?: string; text?: string }) => {
  if (event.source === "extension") return { action: "continue" };
  if (typeof event.text === "string") {
    lastInput = summarizeInput(event.text, config.maxInputLength);
  }
  return { action: "continue" };
});
```

완료 시점에는 이렇게 메시지를 만든다.

```ts
const detail = event === "agent_settled" && config.includeInput && lastInput
  ? `: ${lastInput}`
  : "";

const payload = {
  event,
  title: config.title,
  message: `${message}${detail}`,
  timestamp: Date.now(),
  cwd,
  pid: process.pid,
};
```

예를 들면 이런 알림이 된다.

```text
Pi
Agent 작업 완료: github에 저장소 파서 올리면 되지?
```

물론 알림에 prompt 일부가 노출되는 것은 privacy trade-off가 있다. 그래서 설정으로 끌 수 있게 했다.

```json
{
  "notify": {
    "includeInput": false
  }
}
```

## 설정 파일은 global과 project local을 둘 다 둔다

개인 기본값은 global 설정에 두고, project마다 다르게 하고 싶을 수 있다. 그래서 두 위치를 읽도록 했다.

```text
~/.pi/agent/notify.json
<project>/.pi/notify.json
```

설정 예시는 다음과 같다.

```json
{
  "notify": {
    "title": "Pi",
    "settledMessage": "Agent 작업 완료",
    "includeInput": true,
    "maxInputLength": 80,
    "permissionAsk": true,
    "permissionMessage": "Permission required: {tool}",
    "backend": "auto",
    "skipWhenFrontmost": false
  }
}
```

backend는 네 가지로 나눴다.

| backend | 의미 |
|---|---|
| `auto` | macOS에서는 `osascript`, 그 외에는 terminal notification 사용 |
| `macos` | macOS `osascript` notification 사용 |
| `terminal` | Kitty OSC 99 또는 OSC 777 사용 |
| `off` | 기본 notification 비활성화 |

script hook도 남겼다. 기본 알림 외에 Slack, ntfy, webhook 같은 외부 알림으로 확장할 수 있게 하기 위해서다.

## package로 추출했다

local extension이 실제 환경에서 동작하는 것을 확인한 뒤, 별도 repository로 추출했다.

```text
pi-extensions/
  packages/
    notify/
      src/index.ts
      README.md
      package.json
  package.json
  tsconfig.json
  README.md
```

저장소는 `pi-extensions`로 만들었다. 처음에는 extension 하나뿐이지만, 앞으로 Pi용 extension을 더 만들 가능성이 있어서 single package repository보다 작은 monorepo가 낫다고 판단했다.

package metadata에서 중요한 부분은 두 가지다.

```json
{
  "name": "@clang.engineer/pi-notify",
  "keywords": [
    "pi-package",
    "pi",
    "notification"
  ],
  "pi": {
    "extensions": [
      "./src/index.ts"
    ]
  }
}
```

`pi-package` keyword는 Pi package catalog가 찾을 수 있게 하는 신호다. `pi.extensions`는 이 package가 어떤 extension file을 제공하는지 알려준다.

npm에는 다음 이름으로 배포했다.

```bash
npm publish --access public
```

```text
@clang.engineer/pi-notify@0.1.0
```

설치는 다음처럼 할 수 있다.

```bash
pi install npm:@clang.engineer/pi-notify
```

또는 Pi settings의 `packages`에 추가할 수 있다.

```json
{
  "packages": [
    "npm:@clang.engineer/pi-notify"
  ]
}
```

## pi.dev/packages는 별도 등록이 아니다

처음에는 GitHub repository를 만들면 `pi.dev`에 따로 등록해야 하는지 궁금했다. 확인해보니 흐름은 GitHub 중심이 아니라 npm 중심이다.

```text
npm package publish
        ↓
package.json keyword: pi-package
        ↓
package.json pi metadata
        ↓
pi.dev/packages catalog indexing
```

즉 `pi.dev/packages`에 보인다는 것은 "공식 심사를 통과했다"라기보다, npm에 공개된 Pi package가 catalog에 잡혔다는 의미에 가깝다. 그래서 package를 설치할 때는 여전히 repository, maintainer, code, dependency를 직접 보는 습관이 필요하다.

이 점은 이번 작업의 시작점과도 연결된다. 공개 package가 있다는 사실만으로 바로 의존하지 않고, code와 유지보수 신호를 본 뒤 직접 만들지 가져다 쓸지 판단해야 한다.

## 작은 extension이 생태계 참여가 되는 순간

이번 작업은 기능만 놓고 보면 작다. `agent_settled` event를 받고 notification을 보내는 extension이다. 하지만 실제로 해보면 작은 기능 하나에도 생태계 참여의 여러 단계가 들어 있다.

```text
개인 불편
  ↓
기존 package 조사
  ↓
요구사항과 신뢰도 판단
  ↓
local extension으로 검증
  ↓
repository로 추출
  ↓
npm package 배포
  ↓
pi.dev catalog 반영 대기
```

처음부터 거창한 framework를 만들 필요는 없다. 내가 매일 쓰는 작은 마찰을 줄이고, 그 해결책을 package 형태로 정리하면 다른 사람도 설치해볼 수 있는 extension이 된다.

이번에는 완료 알림이었다. 다음에는 다른 Pi extension이 될 수도 있다. 중요한 것은 공개 plugin을 무조건 소비하거나 무조건 직접 만드는 것이 아니라, **검토하고, 필요한 만큼 고치고, 다시 공개 가능한 단위로 돌려주는 흐름**에 들어가는 것이다.

그게 작은 plugin 생태계에 참여하는 가장 현실적인 시작점이라고 생각한다.

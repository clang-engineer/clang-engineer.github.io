---
title       : "claude.ai 웹 지형 — Projects·Artifacts·Customize에서 Code·Routines까지"
description : "챗 창만 쓰다 사이드바를 보면 낯선 메뉴가 늘어서 있다. Projects·Artifacts·Customize·Code·Design, 그리고 Code 웹 안쪽의 Routines·Dispatch까지 — claude.ai 웹의 메뉴가 실제로 무엇을 하고 언제 무엇을 쓰면 되는지, 두 제품 표면으로 나눠 한 바퀴 돈다."
date        : 2026-07-13 14:00:00 +0900
updated     : 2026-07-13 14:00:00 +0900
categories  : [ai, "claude.ai 웹"]
tags        : [claude, claude-code, projects, artifacts, connectors]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **claude.ai 웹 지형** 갈래 · 터미널의 CLI는 [Claude Code 정리](/posts/ai/2025-10-24-claude-code/)에서.

claude.ai를 열면 대부분 챗 창부터 쓴다. 그런데 왼쪽 사이드바에는 **Projects·Artifacts·Customize·Code·Design**이 늘어서 있고, Code로 들어가면 그 안에 또 **Routines·Dispatch**가 있다. 이 글은 그 메뉴들이 각각 무엇을 하고, **언제 무엇을 쓰면 되는지**를 한 바퀴 돈다.

> ⚠️ **이 UI는 빠르게 바뀐다.** 아래는 **2026년 7월 기준** 실제 화면이다. 메뉴 이름·위치·베타 여부는 몇 달 단위로 달라질 수 있으니, 큰 그림(무엇을 하는 도구인지)을 잡는 용도로 읽자.

## 먼저: 메뉴는 두 표면에 나뉘어 있다

헷갈리는 지점부터 짚자. claude.ai의 메뉴는 **하나의 화면이 아니라 두 제품 표면**에 걸쳐 있다.

- **① claude.ai 메인(챗)** — 우리가 평소 쓰는 대화 화면. 사이드바에 Projects·Artifacts·Customize, 그리고 Products로 Code·Design.
- **② Claude Code 웹(`/code`, Research preview)** — 레포를 물려 클라우드에서 돌리는 코딩 표면. 사이드바 `More` 안에 Routines·Dispatch가 숨어 있다.

같은 "Artifacts"·"Customize"라도 두 표면 모두에 있고, "Code"는 ①에서 ②로 넘어가는 문이다. 이 구분을 먼저 잡으면 나머지가 정리된다.

| 메뉴 | 표면 | 한 줄 |
|---|---|---|
| **Projects** | ① 메인 | 관련 대화 + 지식 + 지침을 묶는 작업 공간 |
| **Artifacts** | ① 메인 | 만든 산출물(앱·문서·툴) 갤러리 |
| **Customize** | ① 메인 | Skills·Connectors·Plugins로 능력 확장 |
| **Design** (Beta) | ① 메인 | 프로토타입·슬라이드·문서 생성 |
| **Code** | ① → ② | Claude Code 웹으로 진입 |
| **Routines** | ② Code 웹 | 스케줄·webhook으로 도는 자동화 |
| **Dispatch** (Beta) | ② Code 웹 | 자율 에이전트 위임 |

---

## ① 메인 사이드바

### Projects — 대화 + 지식 + 지침을 묶는다

프로젝트를 열면 오른쪽에 세 칸이 붙는다.

- **Instructions** — 이 프로젝트 안 모든 대화에 적용되는 지침. "우리 회사 코드 컨벤션", "항상 반말로" 같은 걸 한 번 적어두면 매 대화에서 다시 설명할 필요가 없다.
- **Files** — PDF·문서·텍스트를 올려두는 지식 베이스. 사양서·API 문서를 넣어두면 대화마다 참조한다.
- **Memory** — 대화가 몇 번 쌓이면 프로젝트가 스스로 기억을 만든다.

한 줄 요약이 화면에 그대로 쓰여 있다 — **"이 프로젝트에선 매번 같은 지식을 참조한다."** Claude Code를 써 봤다면 `CLAUDE.md`(프로젝트 규칙) + 첨부 파일의 **웹 버전**으로 이해하면 정확하다([메모리 시스템 정리](/posts/ai/2026-03-12-claude-code-memory/) 참고).

> **언제**: 같은 맥락으로 반복 작업할 때. 특정 코드베이스, 특정 문서 묶음, 특정 톤. 단발 질문이면 그냥 New chat이 낫다.

### Artifacts — 만든 산출물의 갤러리

대화 중 Claude가 만든 **앱·게임·툴·문서**가 아티팩트로 저장되고, 이 메뉴는 그것들을 모아 보는 갤러리다. `All / Yours / Shared with you` 탭으로 나뉘고, 검색·필터·새 아티팩트 생성이 된다.

챗 안에서 오른쪽에 뜨는 그 미리보기 패널의 결과물이 여기 쌓인다고 보면 된다. 잘 만든 하나를 **공유 링크**로 남에게 열어줄 수 있는 게 핵심 쓰임이다.

> **언제**: 한 번 만든 계산기·대시보드·문서를 다시 찾거나 남에게 공유할 때.

### Customize — 능력을 갈아끼운다

설정 허브를 연다. 일반 설정(General·Account·Billing·Usage 등) 밑에 **Customize 3종**이 핵심이다.

- **Skills** — 재사용 가능한 능력 묶음. 특정 작업(예: `skill-creator`)을 스킬로 등록해두면 필요할 때 불러 쓴다.
- **Connectors** — 외부 서비스 연동. **Gmail·Google Drive·Slack·GitHub·Google Calendar** 등을 붙이면 Claude가 그 데이터를 읽고 쓴다. 내부적으로 [MCP](/posts/ai/2025-10-23-mcp/)로 도는 연결이고, 커스텀 커넥터도 추가할 수 있다.
- **Plugins** — "역할 수준의 전문성"을 부여하는 묶음. 스킬·커넥터·명령을 역할 단위로 패키징한 것.

> **언제**: 챗을 내 계정 바깥(메일·드라이브·깃허브)으로 넓히고 싶을 때는 **Connectors**부터. 반복 작업 패턴이 굳으면 **Skills**로.

### Design (Beta) — 만들 것을 그린다

`Claude Design`은 별도 표면으로 열린다. 파일·디자인 시스템을 첨부하거나 설명을 적으면 **Prototype·Slides·Document·Wireframe** 같은 템플릿으로 결과를 만든다. 코드로 뽑는 토글도 있다. 아직 Beta.

> **언제**: 글이 아니라 화면·자료(슬라이드·와이어프레임)를 뽑고 싶을 때.

---

## ② Claude Code 웹 (`/code`)

메인의 **Code**를 누르면 이 표면으로 넘어온다. 터미널 CLI가 아니라 **브라우저에서 레포를 물려 돌리는 Claude Code**다(Research preview). 세션을 만들 때 레포를 고르고, 클라우드에서 작업이 돈다. CLI와 같은 엔진의 웹 버전이라고 보면 된다 — 터미널 쪽 실전 흐름은 [Claude Code 실전 워크플로](/posts/ai/2026-07-03-claude-code-workflow/)에 있다.

사이드바 `More` 안에 두 가지가 숨어 있다.

### Routines — 스케줄·webhook으로 도는 자동화

화면 설명 그대로 **"스케줄·API·webhook으로 실행되는 템플릿 자동화"**다. cron으로 도는 에이전트라고 보면 된다. 준비된 템플릿이 그대로 쓰임새를 보여준다.

| 템플릿 | 하는 일 | 트리거 |
|---|---|---|
| Briefing | 캘린더·메일·메시지 요약 | 평일 아침 |
| Email / Issue triage | 받은편지함·이슈 분류·우선순위·초안 | 매일 아침 |
| System health check | 인프라·서비스 에러·장애 모니터 | 매일 |
| PR review digest | 열린 PR·리뷰 상태 요약 | 매일 |
| Release notes drafter | 릴리스 노트 초안 | PR 머지 시 |
| Flaky test tracker | 간헐 실패 테스트 추적 | 주기적 |

Gmail·Slack·Linear·PagerDuty·Datadog 같은 커넥터와 엮여 돈다.

> **언제**: 매일·매주 반복하는 점검·요약·분류를 사람이 매번 시키지 않고 자동으로 돌리고 싶을 때.

### Dispatch (Beta)

`More` 안 마지막 항목. 자율 에이전트를 위임해 백그라운드로 협업시키는 기능으로 보인다.

> ⚠️ **미검증**: 이 글을 쓰며 여러 번 열어봤지만 계속 로딩에 실패("Couldn't connect")해 **실제 동작은 확인하지 못했다.** Beta인 만큼 아직 불안정한 것으로 보이니, 존재만 알아두자.

---

## 정리 — 언제 무엇을 여나

- **같은 맥락으로 반복 작업** → **Projects** (지침 + 파일을 한 번 세팅)
- **메일·드라이브·깃허브를 챗에 물리기** → **Customize › Connectors**
- **만든 결과물을 다시 찾거나 공유** → **Artifacts**
- **화면·슬라이드·자료를 뽑기** → **Design**
- **레포를 브라우저에서 코딩** → **Code**
- **매일·매주 자동으로 돌리기** → **Code › Routines**

챗 창은 입구일 뿐이다. Projects로 맥락을 고정하고, Connectors로 바깥을 붙이고, Routines로 반복을 자동화하는 순간 claude.ai는 "질문하는 곳"에서 **"일을 굴리는 곳"**으로 바뀐다.

터미널 쪽 도구(CLI·MCP·API)까지 한 흐름으로 보려면 [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)에서 이어가자.

---
title       : "OMP란 무엇인가 — Pi와의 차이, 장점, 플러그인 호환성"
description : "Pi 기반 코딩 에이전트 OMP의 성격과 통합 도구, 설정 범위, Pi 플러그인 호환 경계를 직접 설치한 관점에서 정리한다."
date        : 2026-11-04 14:40:00 +0900
categories  : [ai, "코딩 에이전트"]
tags        : [omp, pi, ai-agent, ai-coding, coding-agent, plugin, extension, comparison, guide]
pin         : false
hidden      : false
---

> 관련: [Claude Code에서 OpenCode를 거쳐 Pi까지 — AI 코딩 하네스를 점점 얇게 만든 기록](./2026-09-21-pi-coding-agent-harness.md)

OMP(Oh My Pi)를 처음 설치하면 이름 때문에 먼저 두 가지 질문이 생긴다.

1. OMP는 Pi에 확장팩을 미리 붙여 놓은 것인가?
2. 기존 Pi 플러그인을 그대로 공유할 수 있는가?

짧게 답하면 OMP는 **Pi에서 출발해 개발 도구를 통합한 별도 코딩 에이전트**다. Pi의 확장 구조와 닮았지만, 단순한 플러그인 모음은 아니다. 플러그인도 조건부로 호환될 뿐 설치 환경까지 공유하지는 않는다.

이 글에서는 OMP 18.16.0을 Windows에 처음 설치하며 확인한 내용을 기준으로 두 도구의 관계와 선택 기준을 정리한다. 버전에 따라 기능과 호환 범위가 달라질 수 있으므로 세부 동작은 글 끝의 공식 자료를 함께 확인해야 한다.

## OMP는 Pi의 배포판인가, 별도 제품인가

[OMP 공식 저장소](https://github.com/can1357/oh-my-pi)는 자신을 Pi의 fork이자 "The Pi you love, with batteries included"라고 소개한다. 여기서 *batteries included*는 개발에 필요한 기능을 별도 조립 없이 함께 제공한다는 뜻이다.

출발점은 Pi지만 현재의 OMP는 자체 패키지, 설정, 세션 저장소, 플러그인 관리자와 도구 체계를 가진다. 따라서 관계를 다음처럼 이해하는 편이 정확하다.

| 구분 | Pi | OMP |
|---|---|---|
| 기본 방향 | 최소 하네스 위에 필요한 기능을 조립 | 개발 도구가 통합된 하네스를 바로 사용 |
| 확장 방식 | Package, Extension, Skill, Prompt Template | 내장 Tool, Plugin, Extension, Skill, 프로젝트 규칙 |
| 사용자 데이터 | `~/.pi/agent` | `~/.omp/agent` |
| 프로젝트 설정 | `.pi` | `.omp` |
| 적합한 사용자 | 작은 core와 직접 조립하는 흐름을 선호 | 통합된 개발 워크플로를 바로 사용하고 싶음 |

즉 OMP를 "Pi에 몇 개의 확장팩을 설치한 설정"으로만 보면 부족하다. Pi에서 갈라져 나온 뒤 도구 실행과 에이전트 운영 방식을 자체적으로 확장한 제품에 가깝다.

## OMP가 기본으로 제공하는 것

Pi는 공식 README에서 자신을 "minimal, extensible agent harness"라고 설명한다. Extension과 Skill로 원하는 기능을 붙이는 것이 설계의 중심이고, Subagent나 Plan mode도 기본값에서 제외한다.

OMP는 반대쪽 시작점을 택한다. 설치 직후 다음 능력을 하나의 하네스에서 사용할 수 있게 구성한다.

### IDE 수준의 코드 탐색과 수정

OMP는 단순 문자열 검색뿐 아니라 LSP(Language Server Protocol, IDE가 코드 의미를 질의하는 표준)와 DAP(Debug Adapter Protocol, debugger를 제어하는 표준)를 도구로 제공한다. 정의·참조·rename·diagnostic을 조회하고, 실행 중인 프로그램에 breakpoint를 걸어 상태를 확인할 수 있다.

이 차이는 큰 저장소에서 중요하다. 이름이 같은 문자열을 찾는 것과 실제 symbol reference를 찾는 것은 결과의 신뢰도가 다르다. OMP는 이 정보를 에이전트가 직접 사용하도록 하네스에 연결한다.

### 서브에이전트와 작업 조정

독립적인 조사나 검토를 여러 서브에이전트에 나누고, 부모 에이전트가 결과를 통합할 수 있다. Todo, background job, Agent Hub 같은 조정 기능도 같은 실행 환경에 포함된다.

Pi에서도 Extension이나 Package로 비슷한 흐름을 만들 수 있다. 차이는 가능 여부보다 기본값이다. Pi는 사용자가 작업 방식을 선택해 붙이게 하고, OMP는 병렬 작업을 제품 기능으로 제공한다.

### 파일·웹·브라우저를 잇는 Tool

OMP의 `read`는 로컬 파일 외에도 URL, PDF, archive, SQLite, GitHub resource와 내부 URI를 같은 path 형태로 다룬다. 여기에 Web search, browser 자동화, persistent Python·JavaScript 실행 환경을 연결할 수 있다.

도구마다 별도 Extension을 찾고 설정하는 비용이 줄어드는 대신, 사용자는 더 큰 기본 하네스를 받아들인다. 이것이 OMP의 가장 분명한 장점이자 Pi와 갈리는 지점이다.

### 모델 역할과 세션 운영

OMP는 일반 작업 외에 `smol`, `slow`, `plan`, `advisor` 같은 역할별 모델을 지정할 수 있다. 같은 모델 하나에 모든 일을 맡기지 않고 가벼운 조사, 깊은 추론, 계획, 검토를 다른 모델로 라우팅할 수 있다.

프로필을 사용하면 인증·설정·세션·캐시도 분리할 수 있다.

```powershell
omp --profile work --alias omp-work
omp --profile personal --alias omp-personal
```

중단된 세션 복구, 다른 도구의 세션 import, export와 협업 기능도 별도 명령으로 제공한다. OMP의 장점은 개별 기능 하나보다 이 기능들이 같은 session model 안에서 연결된다는 데 있다.

## 설치 직후 확인한 사실

OMP 18.16.0을 처음 실행한 뒤 `omp plugin list --json`을 확인했을 때 사용자 플러그인은 하나도 설치되어 있지 않았다. 그런데도 파일 읽기, Shell 실행, Web search, Skill 탐색, 서브에이전트 같은 기능은 사용할 수 있었다.

이 결과는 OMP의 성격을 잘 보여준다.

> OMP의 주요 장점은 별도 플러그인 묶음이 아니라 OMP 자체에 통합된 기능이다.

Plugin은 기본 하네스에 없는 기능을 추가하거나 동작을 바꾸는 확장점이다. OMP를 쓰기 위해 Pi 환경에서 사용하던 모든 Package를 먼저 재현할 필요는 없다. 기본 기능을 사용해 본 뒤 빠진 것만 추가하는 편이 안전하다.

## Pi 플러그인은 OMP와 호환되는가

결론부터 말하면 **조건부 호환**이다. "Pi의 fork이므로 전부 그대로 동작한다"와 "서로 완전히 다른 생태계다" 모두 정확하지 않다.

### 호환되는 부분

OMP의 Plugin loader는 Package manifest의 `omp` metadata뿐 아니라 `pi` metadata도 읽고, `extensions` 항목을 처리한다. Pi와 OMP가 같은 계통의 Extension API에서 출발했으므로 Tool 등록, Command, event hook 같은 기본 구조도 비슷하다.

따라서 단순한 Extension은 작은 수정만으로 동작할 가능성이 있다. Prompt나 Skill처럼 런타임 내부 모듈 의존성이 적은 자원은 이식 부담이 더 작다.

### 그대로 공유할 수 없는 부분

설치 위치부터 다르다.

```text
Pi   → ~/.pi/agent/extensions
OMP  → ~/.omp/agent/extensions
```

한쪽에 설치한 Extension이 다른 쪽에서 자동으로 발견되는 구조가 아니다. 두 디렉터리를 symbolic link로 묶으면 각 런타임의 업데이트와 의존성 차이가 같은 파일에 영향을 주므로 피하는 편이 낫다.

더 중요한 차이는 import namespace다. 현재 Pi Package는 `@earendil-works/pi-*`를 사용하고, 오래된 Package에는 `@mariozechner/pi-*` import가 남아 있을 수 있다. OMP 내부 Package는 `@oh-my-pi/pi-*` namespace를 사용한다.

```ts
// Pi 계열 Extension에서 볼 수 있는 import
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// OMP Extension의 import
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
```

Manifest를 읽을 수 있다는 사실이 TypeScript import까지 자동으로 호환한다는 뜻은 아니다. 실제로 OMP의 Pi Extension 설치 관련 이슈에서는 Package를 복사한 뒤 import를 OMP namespace로 바꿔야 했고, 일부 Extension은 module resolution 문제를 겪었다.

호환 범위를 표로 정리하면 다음과 같다.

| 항목 | 호환 판단 |
|---|---|
| `pi` Package manifest | OMP가 읽을 수 있음 |
| 기본 Extension API 구조 | 상당 부분 유사 |
| Skill·Prompt 같은 정적 자원 | 비교적 이식하기 쉬움 |
| Pi 내부 Package import | namespace 변환이 필요할 수 있음 |
| 설치 목록과 사용자 설정 | 공유하지 않음 |
| 모든 Pi Package의 무수정 실행 | 보장되지 않음 |

따라서 Pi 플러그인을 OMP에서 쓰고 싶다면 Package별로 OMP 지원 여부를 먼저 확인해야 한다. 공식 OMP Package가 있으면 그것을 사용하고, 없다면 별도 사본에서 import와 API 차이를 검토하는 순서가 안전하다.

## Pi와 OMP 중 무엇을 선택할까

두 도구의 차이는 기능 수의 우열보다 하네스를 운영하는 방식에 있다.

### Pi가 잘 맞는 경우

- core를 작게 유지하고 필요한 기능만 직접 고르고 싶다.
- Extension과 Prompt를 조립하는 과정 자체를 통제하고 싶다.
- 서브에이전트나 Plan mode도 내 방식으로 구현하거나 선택하고 싶다.
- 이미 Pi Package 중심의 환경을 안정적으로 운영하고 있다.

### OMP가 잘 맞는 경우

- 설치 직후 LSP, debugger, browser, Web search 같은 개발 도구를 사용하고 싶다.
- 큰 작업을 여러 서브에이전트에 나누고 결과를 통합하고 싶다.
- 역할마다 다른 모델을 배정하고 세션 복구·협업까지 한 도구에서 처리하고 싶다.
- 여러 Extension을 직접 조립하기보다 검증된 기본 워크플로에서 시작하고 싶다.

기존 Pi 사용자가 OMP로 이동할 때는 전체 환경을 먼저 복제하지 않는 편이 좋다. OMP 기본 기능으로 며칠 작업한 뒤 실제로 빠진 기능만 확인하면 중복 Extension과 호환 문제를 줄일 수 있다.

## 결론

OMP는 Pi에 플러그인을 몇 개 얹은 개인 설정이 아니다. Pi의 최소 하네스 철학에서 출발했지만, IDE 연동, 서브에이전트, 다양한 Tool, 모델 역할과 세션 운영을 통합한 별도 코딩 에이전트다.

Pi와의 연결 덕분에 Extension 개념과 Package manifest 일부는 호환된다. 그러나 설치 경로와 Package namespace가 다르고, 모든 플러그인의 무수정 실행을 보장하지는 않는다. **구조는 가깝고 환경은 분리되어 있으며, 호환성은 Package별로 확인해야 한다.**

Pi의 얇음이 좋다면 직접 조립하는 방식을 유지하면 된다. 같은 계통의 하네스에 개발 도구가 미리 연결된 시작점을 원한다면 OMP가 매력적이다.

## 참고 자료

- [OMP 공식 저장소](https://github.com/can1357/oh-my-pi)
- [Pi 공식 저장소](https://github.com/earendil-works/pi)
- [OMP의 Pi Package manifest 호환 논의](https://github.com/can1357/oh-my-pi/issues/433)
- [Pi Extension을 OMP로 옮기는 과정과 import 차이](https://github.com/can1357/oh-my-pi/issues/441)

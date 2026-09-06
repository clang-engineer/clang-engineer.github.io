---
title       : "XSS 분류 — Reflected·Stored·DOM-based를 전달 경로와 실행 지점으로 보기"
description : "Reflected·Stored는 페이로드 전달 경로를, DOM-based는 클라이언트 JavaScript의 Source→Sink 실행 경로를 강조하는 분류라는 점을 구분해 XSS 유형과 방어 지점을 정리한다."
date        : 2026-07-12 19:00:00 +0900
updated     : 2026-09-06 10:30:00 +0900
categories  : [security, "웹 취약점"]
tags        : [xss, security, dom, reflected, source-sink]
pin         : false
hidden      : false
---

XSS의 `Reflected`, `Stored`, `DOM-based`를 하나의 완전히 배타적인 축처럼 외우면 예외가 생긴다. 먼저 **무엇을 기준으로 붙인 이름인지**를 나누는 편이 정확하다.

```text
페이로드가 사용자에게 어떻게 전달되는가?
→ Request에 반사됨 / 저장됐다 나중에 전달됨

실제 위험한 HTML·JavaScript 문맥은 어디서 만들어지는가?
→ Server-side Rendering / Client-side DOM 처리
```

`Reflected`와 `Stored`는 주로 **전달·지속 방식**을 강조하고, `DOM-based`는 **Browser JavaScript의 Source→Sink 흐름에서 취약점이 만들어지는 위치**를 강조한다.

## 1. Reflected — 현재 Request의 값이 Response에 반영된다

사용자가 보낸 값이 같은 Request/Response 흐름에서 Server Response에 반영되고, 안전하지 않은 문맥에 들어가 실행되는 전형적인 형태다.

```text
Request Input
   ↓
Server
   ↓ 안전하지 않은 HTML Context에 출력
Response
   ↓
Browser에서 실행
```

핵심은 **현재 Request에서 들어온 공격자 제어 값이 응답에 반사되는 것**이다.

## 2. Stored — 값이 저장됐다 다른 Response에서 전달된다

Stored XSS는 공격자 입력이 DB, 게시물, 프로필 같은 저장소에 남았다가 이후 사용자에게 전달된다.

```text
공격자 입력
   ↓
Persistent Storage
   ↓ 나중의 Request
Response
   ↓
다른 사용자 Browser에서 실행
```

Reflected와 다른 점은 공격자가 만든 값이 **지속적으로 저장되고 이후 여러 사용자에게 전달될 수 있다는 것**이다.

## 3. DOM-based — 취약한 실행 경로가 Client JavaScript 안에 있다

DOM-based XSS에서는 Browser JavaScript가 공격자가 제어할 수 있는 값을 읽고 위험한 DOM/API 지점으로 흘려보낸다.

```javascript
const value = location.hash.substring(1);  // Source
document.querySelector('#output').innerHTML = value; // Sink
```

```text
Attacker-controlled Source
        ↓
Client JavaScript
        ↓
Dangerous Sink
        ↓
Browser DOM / Script Context
```

여기서 핵심은 **Server가 값을 봤느냐 아니냐가 아니라 실제 취약한 변환과 삽입이 Client-side JavaScript에서 일어났느냐**다.

`location.hash`처럼 Server로 전송되지 않는 Source가 대표적이지만, `location.search`처럼 Server에도 전달되는 값을 Client JavaScript가 다시 읽어 DOM Sink에 넣는 경우도 있다.

## View Source는 단서이지 정의가 아니다

`View Source`와 현재 DOM을 비교하면 Server Response와 Client-side Mutation을 구분하는 데 도움이 된다.

```text
View Source
→ Server가 내려준 원본 Response에 가까운 모습

DevTools Elements / 현재 DOM
→ Client JavaScript 실행 뒤 바뀐 상태 포함
```

하지만:

```text
View Source에 페이로드가 보임
= 무조건 Reflected XSS

View Source에 안 보임
= 무조건 DOM-based XSS
```

처럼 사용하면 안 된다.

Server Response에 공격자 제어 문자열이 들어 있어도 실제 위험한 Sink가 Client JavaScript에 있을 수 있고, Encoding·Parsing·Template 처리에 따라 단순 문자열 존재 여부만으로 취약점 유형을 확정하기 어렵다.

따라서 판별 질문은:

```text
1. 공격자 제어 값은 어디서 왔나?
2. Server Response에 어떤 형태로 들어갔나?
3. Client JavaScript가 그 값을 다시 처리하나?
4. 실제 실행 가능한 문맥을 만든 지점은 어디인가?
```

이다.

## DOM-based의 핵심 — Source에서 Sink까지의 Data Flow

### Source

공격자가 영향을 줄 수 있는 값을 JavaScript가 읽는 지점이다.

예:

```text
location.href / search / hash
window.name
document.referrer
postMessage data
Web Storage 등
```

모든 Source 값이 곧 취약한 것은 아니다. **그 값이 위험한 Sink까지 어떤 변환을 거쳐 도달하는지**가 중요하다.

### Sink

공격자 제어 값이 들어갔을 때 HTML Parsing이나 Script 실행 같은 위험한 동작을 만들 수 있는 지점이다.

대표적으로 상황에 따라:

```text
innerHTML / outerHTML
document.write
eval
Function
문자열 형태의 setTimeout / setInterval 등
```

을 주의한다.

```text
Source
  ↓
Validation / Transformation
  ↓
Sink
```

DOM XSS 분석은 이 Data Flow를 추적하는 문제다.

## 방어도 실행 문맥에 맞춰 잡는다

XSS 방어를 `입력값에서 <script> 제거`처럼 하나의 필터로 해결하지 않는다.

### Server-side 출력

Server가 HTML을 만들 때는 **출력되는 문맥에 맞는 Encoding**과 안전한 Template 동작을 사용한다.

```text
HTML Text Context
HTML Attribute Context
JavaScript Context
URL Context
```

문맥마다 안전한 처리 방식이 다르다.

### Client-side DOM 처리

HTML Parsing이 필요 없는 값은 `innerHTML` 대신 `textContent` 같은 안전한 API를 우선한다.

```javascript
output.textContent = value;
```

HTML을 정말 허용해야 한다면 신뢰 경계와 Sanitization 정책을 별도로 설계한다.

CSP는 XSS 위험을 줄이는 추가 방어층이 될 수 있지만 취약한 Source→Sink나 출력 처리를 대신 고쳐주는 것은 아니다.

## 분류를 한 장에 놓으면

```text
[전달 방식]
현재 Request에서 반사
→ Reflected

저장 후 나중에 전달
→ Stored

[취약한 실행 지점]
Client JS Source → Sink에서 생성
→ DOM-based
```

실제 사례를 설명할 때는 한 단어만 붙이기보다 **Payload가 어떻게 도착했고 어느 코드가 위험한 문맥을 만들었는지**를 함께 적는 편이 더 정확하다.

## 정리

XSS 분류의 목적은 이름을 맞히는 것이 아니라 **취약한 Data Flow와 방어 위치를 찾는 것**이다.

```text
Input / Stored Data
        ↓
Server Response
        ↓
Client-side Processing
        ↓
Execution Context
```

이 흐름에서 공격자 제어 값이 어디에서 들어오고, 어디에서 안전하지 않은 문맥으로 바뀌는지를 찾는다.

**Reflected·Stored는 전달 경로를 이해하는 데 유용하고, DOM-based는 Client-side Source→Sink 경로를 이해하는 데 유용하다. 분류명보다 실제 실행 경계를 보는 것이 더 중요하다.**

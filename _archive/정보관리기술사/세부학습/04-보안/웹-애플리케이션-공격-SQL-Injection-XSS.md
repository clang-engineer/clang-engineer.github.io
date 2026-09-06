# 웹 애플리케이션 공격 — SQL Injection과 XSS

## 이 문서에서 되짚을 질문

- SQL Injection과 XSS는 모두 입력값 문제처럼 보이는데 실제 실행 지점은 어떻게 다른가?
- SQL Injection의 Form·Second-order·Blind 같은 이름은 왜 한 트리에 넣으면 안 되는가?
- XSS의 Reflected·Stored·DOM-based는 같은 분류축인가?
- 방어할 때 입력 필터보다 실행 문맥을 먼저 봐야 하는 이유는 무엇인가?

## 1. 먼저 실행 경계를 나눈다

두 공격 모두 공격자가 제어한 데이터가 **해석 가능한 문맥**에 들어갈 때 발생한다.

```text
SQL Injection
공격자 입력
  ↓
Application의 SQL 구성
  ↓
DB가 SQL 문법으로 해석

XSS
공격자 입력
  ↓
Server Response 또는 Client DOM 처리
  ↓
Browser가 HTML / Script 문맥으로 해석
```

차이는 실행 주체와 문맥이다.

- SQL Injection: DB가 SQL로 해석하는 문맥
- XSS: Browser가 HTML·JavaScript로 해석하는 문맥

따라서 "특수문자를 막는다"보다 **데이터와 명령·실행 문맥을 분리하는 것**이 핵심이다.

## 2. SQL Injection — 서로 다른 분류축을 섞지 않는다

SQL Injection 자료에서는 `Form`, `Second-order`, `Union`, `Blind` 같은 용어가 함께 나오지만 같은 질문에 답하는 용어가 아니다.

```text
어디에서 입력이 들어오는가?
→ URL / Form / JSON / Cookie / Header

언제 위험한 SQL 문맥에 들어가는가?
→ 즉시 / 저장 후 나중에 실행(Second-order)

결과를 어떻게 관찰하는가?
→ Union / Error / Boolean / Time / OOB
```

### 입력 지점

```text
URL Query / Path Parameter
Form Body
JSON Body
Cookie
HTTP Header
```

이 축은 공격자 제어 값의 **출처**를 설명한다. URL Parameter라고 해서 반드시 Blind인 것도 아니고 Form이라고 해서 Error-based인 것도 아니다.

### 실행 시점

Second-order SQL Injection은 입력이 바로 SQL에서 사용되지 않고 저장됐다가 다른 코드 경로에서 위험한 SQL 문맥으로 다시 사용되는 경우다.

```text
공격자 입력
   ↓
DB 등에 저장
   ↓ 나중의 기능
저장값을 신뢰하고 SQL 구성
   ↓
Injection 발생
```

따라서 Second-order는 입력 지점이나 결과 획득 방식과 조합될 수 있다.

### 결과 획득 방식

#### In-band

같은 Application 응답에서 결과나 오류를 직접 관찰한다.

```text
Error-based
→ DB Error 차이로 정보 획득

Union-based
→ UNION 결과가 응답에 포함
```

#### Blind / Inferential

값이 직접 보이지 않아 Observable Difference로 추론한다.

```text
Boolean-based
→ 조건에 따른 응답 내용·상태 차이

Time-based
→ 조건에 따른 응답 시간 차이
```

#### Out-of-band

일반 Response가 아닌 DNS·HTTP 등 별도 Network Channel을 사용한다.

즉 `Union vs Blind`는 결과 관찰 방식 비교이고, `Form vs URL`은 입력 지점 비교이며, `Second-order`는 실행 Lifecycle이다.

## 3. SQL Injection의 핵심 방어

가장 중요한 원칙은 **데이터를 SQL 문법과 분리하는 것**이다.

- Parameterized Query / Prepared Statement 사용
- 동적 Table·Column처럼 Parameter Binding이 어려운 부분은 Allowlist 사용
- DB 계정 최소 권한
- 오류 메시지의 과도한 외부 노출 제한
- 입력 출처가 저장 데이터라고 해서 신뢰하지 않음

```text
사용자 값
→ SQL 문자열 이어붙이기  X
→ Parameter로 전달       O
```

입력 검증은 보조 수단이고, SQL 문맥 분리가 우선이다.

## 4. XSS — 전달 방식과 실행 지점을 분리한다

`Reflected`, `Stored`, `DOM-based`도 하나의 완전히 배타적인 분류축으로 외우면 혼란이 생긴다.

```text
Payload가 어떻게 전달되는가?
→ 현재 Request에 반사 / 저장 후 전달

위험한 실행 문맥은 어디서 만들어지는가?
→ Server-side Rendering / Client-side DOM 처리
```

### Reflected XSS

현재 Request의 값이 같은 Response에 반영되고 안전하지 않은 HTML·Script 문맥에 들어간다.

```text
Request Input
   ↓
Server
   ↓ unsafe output
Response
   ↓
Browser 실행
```

### Stored XSS

공격자 입력이 DB·게시물·프로필 등에 저장됐다가 이후 다른 사용자의 Response로 전달된다.

```text
공격자 입력
   ↓
Persistent Storage
   ↓ 나중의 Request
Response
   ↓
Browser 실행
```

### DOM-based XSS

취약한 변환과 삽입이 Client JavaScript의 Source→Sink 흐름에서 발생한다.

```javascript
const value = location.hash.substring(1); // Source
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

핵심은 Server가 값을 봤는지가 아니라 **실제 위험한 실행 문맥을 어느 코드가 만들었는가**다.

## 5. DOM XSS는 Source→Sink Data Flow를 본다

### Source

공격자가 영향을 줄 수 있는 값을 JavaScript가 읽는 지점이다.

```text
location.href / search / hash
window.name
document.referrer
postMessage data
Web Storage
```

Source 자체가 곧 취약점은 아니다. 위험한 Sink까지 어떤 변환을 거쳐 도달하는지가 중요하다.

### Sink

공격자 제어 값이 들어갔을 때 HTML Parsing이나 Script 실행을 만들 수 있는 지점이다.

```text
innerHTML / outerHTML
document.write
eval
Function
문자열 형태의 setTimeout / setInterval
```

```text
Source
  ↓
Validation / Transformation
  ↓
Sink
```

## 6. View Source는 단서이지 정의가 아니다

```text
View Source
→ Server가 내려준 원본 Response에 가까움

DevTools Elements
→ Client JavaScript 실행 뒤 DOM 변경 포함
```

하지만 Payload가 View Source에 보인다고 무조건 Reflected XSS이고, 안 보인다고 무조건 DOM-based XSS인 것은 아니다.

판별할 때는 다음을 본다.

```text
1. 공격자 제어 값은 어디서 왔는가?
2. Server Response에는 어떤 형태로 들어갔는가?
3. Client JavaScript가 다시 처리하는가?
4. 실행 가능한 문맥을 만든 지점은 어디인가?
```

## 7. XSS의 핵심 방어

XSS도 입력값에서 특정 문자열만 제거하는 방식으로 해결하지 않는다.

### Server-side 출력

출력 문맥에 맞는 Encoding을 사용한다.

```text
HTML Text Context
HTML Attribute Context
JavaScript Context
URL Context
```

문맥마다 안전한 처리 방식이 다르다.

### Client-side DOM 처리

HTML Parsing이 필요 없다면 `innerHTML`보다 `textContent` 같은 안전한 API를 사용한다.

```javascript
output.textContent = value;
```

HTML이 필요하면 Sanitization 정책과 신뢰 경계를 별도로 설계한다.

CSP(Content Security Policy)는 추가 방어층이지만 취약한 Source→Sink나 잘못된 출력 처리를 대신 고쳐주지는 않는다.

## 8. SQL Injection과 XSS 비교

| 구분 | SQL Injection | XSS |
|---|---|---|
| 실행 주체 | DBMS | Browser |
| 위험 문맥 | SQL 문법 | HTML / JavaScript 문맥 |
| 대표 원인 | 문자열 기반 SQL 구성 | 안전하지 않은 출력·DOM 삽입 |
| 핵심 방어 | Parameterized Query | Context-aware Encoding / Safe DOM API |
| 주요 영향 | 데이터 조회·변조·권한 우회 | 사용자 Session·정보 탈취, UI 변조 |

둘 다 공통적으로 **데이터와 실행 문맥의 경계가 무너진 문제**지만 실행 계층이 다르다.

## 9. 기술사 관점 핵심 정리

```text
SQL Injection
Input Vector
→ Execution Timing
→ Observation Method

XSS
Delivery Path
→ Source
→ Sink
→ Browser Execution Context
```

서로 다른 분류축의 용어를 한 계층으로 억지로 묶지 않는다.

## 기억·인출 장치

```text
SQL Injection
→ 값이 SQL이 되지 않게

XSS
→ 값이 Script/HTML 실행문맥이 되지 않게
```

핵심은 입력 자체보다 **어디에서 명령으로 해석되는가**를 찾는 것이다.

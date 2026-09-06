---
title       : "SQL Injection 분류 — 입력 지점·실행 시점·결과 획득을 섞지 않기"
description : "SQL Injection을 Form/URL/Header 같은 입력 지점, First/Second-order 실행 시점, Union/Error/Blind/OOB 같은 결과 획득 방식으로 나눠 분류축이 섞일 때 생기는 혼란을 정리한다."
date        : 2026-07-03 10:30:00 +0900
updated     : 2026-09-06 10:22:00 +0900
categories  : [security, "웹 취약점"]
tags        : [sql-injection, security, blind, union, classification]
pin         : false
hidden      : false
---

SQL Injection 자료를 보다 보면 `Form`, `Union`, `Error-based`, `Blind`, `Second-order`가 한 목록에 섞여 나오는 경우가 있다. 문제는 이 용어들이 항상 같은 질문에 답하지 않는다는 점이다.

먼저 분류축을 나누면 훨씬 명확하다.

```text
어디에서 공격자 입력이 들어오는가?
→ URL / Form / Cookie / Header ...

언제 위험한 SQL 문맥에 들어가는가?
→ 즉시 실행 / 저장 후 나중에 실행(Second-order)

결과를 어떻게 알아내는가?
→ Union / Error / Boolean / Time / OOB ...
```

따라서 `Union은 Blind의 하위인가?`, `Form은 Error-based와 같은 종류인가?` 같은 질문은 먼저 **같은 분류축을 비교하고 있는지**부터 확인해야 한다.

## 1. 입력 지점 — 사용자 제어 값이 어디서 들어오나

Application이 SQL을 만들 때 공격자가 제어할 수 있는 값의 출처를 본다.

대표적으로:

```text
URL Query / Path Parameter
Form Body
JSON Body
Cookie
HTTP Header
```

이 축은 **입력 경로**다.

예를 들어 같은 URL Parameter도 Application의 SQL 구성 방식과 DB 동작에 따라 Error-based가 될 수도, Boolean-based Blind가 될 수도 있다.

```text
URL Parameter
      ↓
취약한 SQL 구성
      ↓
결과 획득 방식은 별도 결정
```

즉 `Form-based`와 `Union-based`를 서로 배타적인 형제 분류처럼 두는 것은 기준이 다르다.

## 2. 실행 시점 — 바로 위험해지는가, 저장됐다 나중에 위험해지는가

Second-order SQL Injection은 단순히 "어디에 입력했는가"보다 **입력이 저장된 뒤 다른 코드 경로에서 SQL 문맥으로 다시 사용되는 시점**이 핵심이다.

```text
공격자 입력
   ↓
DB 등에 일단 저장
   ↓ 나중의 다른 기능
저장값을 신뢰하고 SQL 구성
   ↓
Injection 발생
```

따라서 Second-order는 Form/Cookie/Header와도 조합될 수 있고, 결과 획득 방식과도 별개로 볼 수 있다.

## 3. 결과 획득 방식 — DB의 결과를 어떻게 관찰하나

실무 보안 자료에서 자주 쓰는 구분은 **응답이나 별도 채널을 통해 정보를 어떤 방식으로 관찰하는가**다.

### In-band 계열

같은 Application 응답 채널에서 결과나 Error를 관찰할 수 있는 경우다.

```text
Error-based
→ DB Error Message나 그 차이를 통해 정보 노출

Union-based
→ 기존 Query 결과에 UNION 결과가 포함돼 응답으로 노출
```

### Blind / Inferential 계열

원하는 DB 값이 응답 본문에 직접 표시되지 않아 **조건에 따른 Observable Difference**로 추론하는 경우다.

```text
Boolean-based
→ 조건에 따라 응답 내용·상태 등이 달라짐

Time-based
→ 조건에 따라 응답 시간이 달라짐
```

따라서 일반적인 이 분류 문맥에서 `Union-based`와 `Blind`는 상하 관계가 아니다.

```text
결과를 직접 관찰 가능
→ Error / Union 같은 In-band 기법

직접 값이 보이지 않음
→ Boolean / Time 같은 Blind 기법
```

### Out-of-band

Application의 일반 Response가 아니라 별도 Network Channel을 이용해 관찰하는 방식이다.

```text
DB / Server
   ↓ 별도 통신
DNS / HTTP 등 외부 Channel
```

OOB를 독립 최상위 범주로 두는 자료도 있고, Injection Technique 목록의 한 항목으로 두는 자료도 있다. **분류 체계 이름보다 그 자료가 어떤 기준으로 묶었는지 확인하는 것이 중요하다.**

## 왜 자료마다 분류표가 조금씩 다른가

SQL Injection은 한 가지 축으로만 설명하기 어려워 교육 자료마다 목적에 따라 다른 분류를 사용한다.

```text
입력 Vector 중심 자료
→ URL / Form / Header / Cookie

데이터 추출 Technique 중심 자료
→ Union / Error / Boolean / Time / OOB

실행 Lifecycle 중심 자료
→ First-order / Second-order
```

따라서 두 자료의 목록이 다르다고 바로 어느 한쪽이 틀렸다고 판단하지 않는다. **분류 기준이 무엇인지 먼저 적혀 있는지**를 본다.

## 한 사례는 여러 축의 값을 동시에 가진다

예를 들어 하나의 취약점은 다음처럼 표현할 수 있다.

```text
입력 지점
→ URL Parameter

실행 시점
→ 즉시

결과 획득
→ Boolean-based Blind
```

또 다른 사례는:

```text
입력 지점
→ Form

실행 시점
→ 저장 후 재사용(Second-order)

결과 획득
→ Error-based
```

처럼 여러 축을 조합해 기술할 수 있다.

이 방식이 `Form SQLi`, `Second-order SQLi`, `Blind SQLi`라는 서로 다른 표현이 왜 동시에 한 취약점을 설명할 수 있는지 보여준다.

## 정리

SQL Injection 분류에서 중요한 것은 용어 목록보다 **분류 질문을 먼저 고정하는 것**이다.

```text
Input Vector
→ 어디서 들어왔나

Execution Timing
→ 언제 SQL 문맥에서 실행됐나

Observation / Extraction
→ 결과를 어떻게 알아냈나
```

이렇게 보면 `Union vs Blind`는 결과 획득 방식의 차이를 설명하는 비교이고, `Form vs URL`은 입력 지점 비교이며, `Second-order`는 저장과 재사용이라는 실행 Lifecycle을 설명한다.

**서로 다른 축의 용어를 한 계층 트리에 억지로 넣지 않는 것**이 SQL Injection 분류를 이해하는 가장 중요한 원칙이다.

---
title       : "SQL Injection 분류 체계 — Union은 Blind의 하위 유형이 아니다"
description : "SQL Injection을 결과 획득 방식(In-band/Blind/OOB)과 주입 위치(Form/URL/Cookie 등)라는 두 직교 축으로 나눠, Union과 Blind가 상하 관계가 아니라 대등 분류임을 정리한다."
date        : 2026-07-03 10:30:00 +0900
categories  : [security, "웹 취약점"]
tags        : [sql-injection, security, blind, union, classification]
pin         : false
hidden      : false
---

## 결론 먼저

Union-based SQL Injection은 Blind SQL Injection의 하위 유형이 아니라 **대등한(병렬) 분류**다.

분류의 핵심 기준은 **"결과가 응답에 직접 노출되는가"**다.

- **Union-based** — `UNION SELECT`로 추출한 데이터가 정상 응답(화면)에 그대로 실려 나온다 → 직접 노출됨
- **Blind** — 데이터가 응답에 직접 드러나지 않아, 참/거짓 추론으로 한 글자씩 알아낸다 → 직접 노출 안 됨

Union은 데이터가 바로 보이므로 In-band 쪽이고, Blind는 추론에 의존한다. 획득 방식 자체가 반대라서 둘은 형제 관계지 상하 관계가 아니다. 어떤 분류 체계에서도 Union-based를 Blind의 하위 유형으로 넣지 않는다.

## 두 개의 직교 축

혼란은 대개 서로 **직교(orthogonal)**하는 두 축을 하나로 섞을 때 생긴다.

- **축 1 — 결과가 응답에 직접 노출되는가** (결과 획득 방식): In-band / Blind / Out-of-band
- **축 2 — 어디에/어떻게 구문을 끼워넣는가** (주입 위치·기법): Form, URL, Cookie, Header, Second-order 등

### 축 1: 결과 획득 방식 (In-band / Blind / OOB)

"결과를 어떻게 받아오는가"가 기준이다.

- **In-band (Classic)** — 공격 채널과 결과 수신 채널이 동일
  - **Error-based** — DB 에러 메시지를 통해 데이터 추출
  - **Union-based** — `UNION SELECT`로 결과를 정상 응답에 실어 직접 추출
- **Blind (Inferential)** — 응답에 직접 노출 없이 추론
  - **Boolean-based** — 조건의 참/거짓에 따른 응답 차이로 추론
  - **Time-based** — 응답 지연 시간으로 추론
- **Out-of-band (OOB)** — DNS/HTTP 등 별도 채널로 데이터 유출

즉 **Union / Error는 In-band**, **Boolean / Time-based는 Blind**에 위치한다.

체계 차이는 있다. OOB를 Blind 하위로 두는 곳도, 독립 카테고리로 두는 곳도 있다. 크게 In-band vs Blind(=Inferential) 2분류로만 나누기도 한다. 출처마다 묶는 위치가 갈리지만, **Union을 Blind 밑에 넣는 경우는 없다.**

### 축 2: 주입 위치·기법

"어디에/어떻게 구문을 끼워넣는가"가 기준이며, 위의 결과 획득 방식과는 별개 축이다.

- Form(폼 입력값) 기반
- URL/파라미터 기반
- Cookie 기반
- HTTP Header 기반
- Second-order(저장형) 등

**Form SQLi는 주입 지점 축, Union/Blind는 결과 획득 방식 축**이다. 축이 다르기 때문에 "Form, Union을 Blind의 유형으로 묶을 수 있나"라는 질문은 애초에 성립하지 않는다.

실제 공격은 두 축이 조합된다.

- "폼 입력값을 통한 Union-based SQLi"
- "URL 파라미터를 통한 Time-based Blind SQLi"

## 함정 정리

- **축 혼용 주의.** `Error, Form, Union, Blind`처럼 나열하면 두 축이 한 줄에 섞인다 — Error·Blind는 결과 획득 방식, Form·Union은 주입 위치(단, 문헌에 따라 Union의 위치가 갈린다. 아래 참고). 하나로 열거하려면 축을 통일하거나 축을 명시해 구분해야 한다.
  - **한 축으로 통일** — Error-based, Union-based, Boolean-based Blind, Time-based Blind (모두 결과 획득 방식)
  - **축을 명시해 구분** — "주입 위치: Form, URL / 결과 획득 방식: Error-based, Blind"
- **Union의 위치는 자료마다 다르다.** 일부 교재는 Form·Union을 "주입 기법" 축의 예시로, Error-based·Blind를 "결과 획득 방식"의 예시로 나눠 놓는다. 반면 일반 보안 문헌은 Union을 결과 확인 방식(In-band) 축에 넣는 경우가 많다. 어느 쪽이든 참조하는 자료의 분류 기준을 먼저 확인하고 따르는 게 안전하다.

## 정리

- SQL Injection은 최소 두 개의 직교 축으로 분류된다: **결과가 응답에 직접 노출되는가**(In-band/Blind/OOB)와 **어디에 주입하는가**(Form/URL/Cookie/Header/Second-order).
- Union과 Blind는 같은 축(결과 획득 방식) 위의 **대등한 형제 분류**이며, Union이 Blind의 하위가 아니다.
- 두 축을 한 줄에 섞지 말고, 열거할 때는 축을 통일하거나 명시해서 구분한다.

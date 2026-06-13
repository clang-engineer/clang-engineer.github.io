---
title       : URI, URL, URN
description : >-
    Identifier·Locator·Name이라는 세 가지 개념과 URI의 구성 요소
date        : 2025-01-13 16:55:20 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [network, "웹·HTTP"]
tags        : []
pin         : false
hidden      : false
---

세 단어가 자주 섞여 쓰여서 헷갈리지만, 정확히는 URI가 상위 개념이고 URL과 URN은 그 아래의 두 갈래다.

## 관계

```
        URI (Uniform Resource Identifier)
        ┌──────────────┴──────────────┐
URL (어디서 찾는지)            URN (이름이 무엇인지)
```

- **URI**: 자원을 가리키는 식별자 일반 명칭
- **URL**: 자원의 *위치*를 가리키는 URI 하위 분류 (대부분 URL이다)
- **URN**: 자원의 *이름*을 가리키는 URI 하위 분류 (위치 무관)

## URI의 일반 구성

```
scheme://authority/path?query#fragment
  │       │        │     │      │
  http    example.com /a   ?q=1   #section
```

| 부분 | 설명 |
|---|---|
| scheme | 프로토콜 (`http`, `https`, `ftp`, `mailto`, `urn`) |
| authority | 호스트(+포트, +사용자정보) |
| path | 리소스 경로 |
| query | `?key=value` 형태 파라미터 |
| fragment | `#`로 시작, 클라이언트 측 위치(앵커) |

URL은 위 형식 중 scheme + authority + path 같은 "위치 정보"를 채운 것이고, URN은 같은 URI 자리에 이름을 넣은 것이다.

## URL 예시

```
https://example.com/users/42?tab=profile#summary
mailto:test@example.com
```

위치 또는 접근 방법이 들어 있다.

## URN 예시

```
urn:isbn:0451450523
urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6
urn:oid:2.16.840.1.113883.4.642.1.1067
```

포맷은 `urn:{namespace}:{namespace-specific-string}`. 도서의 ISBN, 의료 표준 코드, UUID 등 "위치는 모르지만 이름은 영구적인" 식별자에 쓴다.

## 언제 URN이 의미 있나

리소스가 옮겨다닐 수 있는데 식별은 안정적이어야 할 때. 예를 들어 FHIR(의료 데이터 교환 표준)은 환자/관측 자원 식별자로 URN을 쓴다 — 어느 서버에 있는지와 무관하게 같은 자원임을 보장하려고.

> 이 글은 [HL7 FHIR](https://www.hl7.org/fhir/)에서 자원 식별자로 URN이 쓰이는 걸 보고 정리한 것.

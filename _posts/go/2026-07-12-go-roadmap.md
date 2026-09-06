---
title       : "Go 학습 로드맵 — C++ 습관을 내려놓고 Go답게 쓰기"
description : "C++ 배경에서 Go로 넘어올 때 패키지·타입, interface·composition, slice·map, error·defer, goroutine·channel·context, 표준 라이브러리·관용구를 핵심 줄기로 잡고 Tooling과 generics를 별도 축으로 배치한 학습 지도."
date        : 2026-07-12 10:00:00 +0900
updated     : 2026-09-06 13:15:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

Go는 C++의 기능을 하나씩 대응시켜 배우기보다 **Go가 일부 복잡성을 의도적으로 제거하고 어떤 규칙을 대신 강하게 만든 언어인지** 보는 편이 빠르다.

C++ 대응은 출발점으로만 쓴다.

```text
C++에서 익숙한 질문
→ Go에서는 어떤 기능이 없어졌나?
→ 대신 어떤 단순한 규칙·관용구를 쓰나?
→ 그 규칙이 실제 API 설계에 어떻게 나타나나?
```

> **검토 기준:** Go 1.27. Go 1.27은 2026년 8월 공개됐고 generic method 같은 언어 변화가 포함됐다. 세부 버전보다 Go 1 compatibility 아래의 현재 언어·도구 모델을 기준으로 본다.

## 한눈에 보기

| 구역 | 핵심 질문 | 우선순위 |
|---|---|---|
| 1. 패키지·기초 | Go program은 package/module 단위로 어떻게 구성되나 | 필수 |
| 2. struct·interface | class·상속 없이 동작과 추상화를 어떻게 조합하나 | 필수 · 핵심 |
| 3. slice·map·string | Go의 기본 자료구조는 어떤 값/공유 의미를 가지나 | 필수 |
| 4. error·defer | 실패와 정리를 예외 없이 어떻게 흐르게 하나 | 필수 |
| 5. concurrency | 실행·통신·공유상태·취소를 어떻게 나누나 | 필수 · Go 고유 |
| 6. stdlib·idiom·testing | Go다운 API와 코드 구조는 어떤 관례를 따르나 | 필수 |
| Cross-cutting | `go fmt`·`test`·`vet`·`mod`·build Tool은 언제 쓰나 | 처음부터 계속 |
| Branch | generics·generic methods는 언제 필요한가 | 나중 |

## 1. 패키지·모듈과 기본 문법

| 글 | 역할 |
|---|---|
| [문법·패키지·모듈](./2026-07-12-go-basics-package-module.md) | `package`·export 규칙·module·함수·zero value를 한 번에 잡는 입문 Concept/How-to |

Go에서 파일 하나보다 먼저 봐야 할 단위는 package와 module이다.

```text
source files
→ package
→ module
→ import graph
→ go toolchain
```

`go mod`, `go fmt`, `go test`는 마지막에 배우는 별도 Tool이 아니라 이 단계부터 일상적으로 사용한다.

## 2. struct·method·interface — 상속 없는 조합

| 글 | 역할 |
|---|---|
| [struct·method·interface](./2026-07-12-go-struct-method-interface.md) | receiver·method set·implicit interface satisfaction·embedding의 Go 의미론 |

핵심 관계는 “class가 없다”에서 끝나지 않는다.

```text
data
→ struct

dynamic behavior
→ method

capability contract
→ interface

reuse / composition
→ embedding·field composition
```

Interface 만족은 선언문이 아니라 method set으로 결정된다. C++ 상속 계층을 그대로 재현하려 하지 않는 것이 중요하다.

## 3. slice·map·string — 값처럼 전달되지만 내부 공유를 이해한다

| 글 | 역할 |
|---|---|
| [slice·map·string](./2026-07-12-go-slice-map-string.md) | slice header/backing array, map, byte/rune/string의 구체 의미론 |

특히 slice는 “C++ vector의 다른 문법”으로 보면 함정이 생긴다.

```text
slice value
→ pointer + len + cap 성격의 descriptor
→ backing array를 다른 slice와 공유할 수 있음
```

따라서 값 전달과 underlying storage 공유를 구분한다.

## 4. error와 defer — 실패·정리 흐름

| 글 | 역할 |
|---|---|
| [error 처리 + defer·panic·recover](./2026-07-12-go-error-handling-defer.md) | error value·wrapping·`defer`·panic/recover의 역할 경계 |

서로 다른 책임을 한 덩어리로 보지 않는다.

```text
예상 가능한 실패
→ error value 반환

함수 종료 시 정리
→ defer

일반 흐름으로 복구하기 어려운 비정상 상태
→ panic

특정 경계에서 panic을 가로채야 할 때
→ recover
```

`defer`는 RAII와 “정리를 놓치지 않는다”는 목적은 비슷하지만 object lifetime 기반 destructor와 동일한 메커니즘은 아니다.

## 5. concurrency — 실행·통신·동기화·취소를 분리한다

| 글 | 역할 |
|---|---|
| [goroutine·channel·context](./2026-07-12-go-concurrency-goroutine-channel.md) | goroutine, channel, `sync`, context, race detector의 책임을 나눠 설명 |

이 Zoom-in 문서의 구조를 그대로 기준으로 삼는다.

```text
goroutine
→ 실행 단위

channel
→ 통신·동기화 지점

sync
→ 공유 상태·완료 조율

context
→ cancellation / deadline / request scope 전파
```

Channel을 쓰면 자동으로 race가 사라진다거나, goroutine을 OS thread와 같은 단위로 보지 않는다.

## 6. 표준 라이브러리·관용구·testing — Go다운 설계

| 글 | 역할 |
|---|---|
| [표준 라이브러리·관용구·testing](./2026-07-12-go-stdlib-idiom-testing.md) | stdlib 사용과 naming·interface·error·test 관례를 실제 코드 구조로 연결 |

문법을 아는 것과 Go다운 코드를 쓰는 것은 다르다. 이 단계에서는 “기능”보다 다음 질문을 본다.

- interface를 어디에서 정의할까?
- zero value를 유용하게 만들 수 있나?
- error에 어떤 context를 추가할까?
- table-driven test가 언제 유용한가?
- 작은 package 경계를 어떻게 잡을까?

## Cross-cutting — Go Tooling은 처음부터 사용한다

| 글 | 역할 |
|---|---|
| [Go 도구 — build·mod·fmt·vet](./2026-07-12-go-tooling.md) | Go toolchain의 명령을 목적별로 정리하는 Tool/Reference |

이 문서는 “⑦ 마지막 단계”가 아니다.

```text
코드 작성
→ gofmt / go fmt

의존성 변경
→ go mod

반복 검증
→ go test

정적 점검
→ go vet

실행물 생성
→ go build
```

각 단계에서 필요할 때 옆에 두고 쓰는 Cross-cutting Tool 문서다.

## Branch — generics와 generic methods

Generics는 기본 API를 읽기 위한 첫 관문은 아니지만 현재 Go의 언어 기능이다. Go 1.18에서 type parameter가 들어왔고 Go 1.27에서는 method 자체도 type parameter를 선언할 수 있게 됐다.

처음에는 interface·concrete type·ordinary function으로 충분히 익힌 뒤, **여러 타입에 같은 compile-time algorithm을 표현해야 할 때** Zoom-in하는 편이 좋다.

## 일반 Concept과의 경계

에러 처리 모델·메모리 관리·다형성·코루틴 같은 언어 공통 Concept의 정본은 정보관리기술사 Knowledge에 둔다. Go 상세 글은 그 공통 개념을 다시 복제하기보다 **Go에서 실제로 어떤 문법·runtime·stdlib contract로 나타나는지**에 집중한다.

## 어디서 시작할까

```text
Go가 처음이다
→ package/module
→ struct/interface
→ slice/map/string
→ error/defer
→ concurrency
→ idiom/testing

명령이 헷갈린다
→ Tooling 문서를 옆에 두고 필요한 명령만 참조

여러 타입에 같은 algorithm을 일반화해야 한다
→ generics Branch
```

> **Go의 줄기는 package → composition/interface → core data types → explicit error flow → concurrency → idiom이다. Tooling은 마지막 단계가 아니라 전 과정에 걸쳐 사용하고, C++ 대응은 의미론을 등치하지 않는 학습 발판으로만 쓴다.**

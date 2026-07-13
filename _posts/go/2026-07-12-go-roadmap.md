---
title       : Go 학습 로드맵 — C++ 하던 사람이 무엇을 먼저
description : "C++ 배경에서 Go로 넘어올 때의 학습 순서를 기초·타입·에러·동시성·도구로 묶고, 각 주제를 필수·나중·선택으로 표시한 로드맵. C++ 개념과의 대응, 정본 교재(A Tour of Go·Go by Example) 링크, 자주 막히는 지점을 함께 정리한다. 상세 글은 배우면서 채워 나가는 진행형 인덱스."
date        : 2026-07-12 10:00:00 +0900
updated     : 2026-07-13 00:26:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

## 이 로드맵을 만든 이유

Go를 처음 시작하면서, "무슨 문법이 있나"를 목차 순서로 훑는 대신 **C++을 아는 사람이 무엇을 먼저 배우고 무엇을 나중으로 미뤄도 되는지**를 지도로 만들었습니다.

Go는 C++과 방향이 정반대인 언어입니다. C++이 기능을 계속 쌓아 올렸다면, Go는 **의도적으로 걷어냈습니다** — 헤더 파일 없음, 상속 없음, 예외 없음, 제네릭도 한참 뒤에야 들어왔습니다. 그래서 배울 양 자체가 적고 며칠이면 읽고 씁니다. 어려움은 문법이 아니라 **C++/객체지향 습관을 내려놓는 것**에 있습니다.

각 주제에는 세 가지 우선순위를 붙였습니다.

- **[필수]** — 이걸 건너뛰면 다음이 막힙니다. 순서대로 잡고 갑니다.
- **[나중]** — 중요하지만 급하지 않습니다. 필요해질 때 돌아와도 됩니다.
- **[선택]** — 특정 상황에서만 필요합니다. 개념만 알고 넘어가도 됩니다.

그리고 각 단계에는 **C++ 하던 사람을 위한 상세 글**을 붙였습니다. 정본 교재 챕터를 요약하되, 그 위에 세 가지를 얹은 학습용 다이제스트입니다 — **대응**("이건 C++의 뭐냐"), **차이**(겉은 같은데 속이 다른 지점), **습관 교정**(C++ 사고가 오히려 방해되는 지점). 그 글만 읽어도 학습이 되도록 쓰되, 더 깊이는 각 글 끝의 정본 교재로 연결합니다.

- 학습 상태: **⬜ 미학습** · **🚧 진행 중** · **✅ 상세 글 완료**

> 📖 **정본 교재 3종** — 각 상세 글이 더 깊이 볼 때 아래로 연결합니다.
> - [A Tour of Go](https://go.dev/tour/) — 브라우저에서 바로 돌리는 인터랙티브 투어. **여기서 시작.** 반나절.
> - [Go by Example](https://gobyexample.com/) — 주제별 최소 예제 모음. 사전처럼.
> - 『The Go Programming Language』(Donovan & Kernighan) — C의 K&R 저자가 쓴 정본 책.
{: .prompt-tip }

## C++ 대응으로는 안 잡히는 Go 고유 영역

대응표(부록)는 "이게 C++의 뭐냐"를 빠르게 잡아 주지만, Go에는 **대응이 없거나 Go에서만 배우는** 축이 따로 있습니다. 이게 오히려 Go를 Go답게 쓰는 핵심이라, 각주가 아니라 줄기 안에 넣었습니다.

- **`context` — 취소·타임아웃 전파** (⑤): 실전 Go 코드의 절반. C++에 대응 개념이 없음.
- **관용구·철학(Effective Go)** (⑥): "accept interfaces, return structs", 네이밍, 에러 관례. 문법을 넘어 **Go답게** 쓰는 법.
- **`defer`/`panic`/`recover` 3종** (④): RAII를 명시적으로 대체하는 Go만의 조합.
- **race detector(`-race`)·goroutine 누수** (⑤): 경량 동시성의 그림자. 도구로 잡는 법.
- **struct tag·reflection** (⑥): `json:"..."` 같은 태그 기반 메타데이터. 표준 라이브러리를 관통.
- **method set — 포인터 vs 값 리시버** (②): 인터페이스 만족 여부를 가르는 Go 특유의 미묘함.

## 한눈에 보기

| 단계 | 주제 | 우선순위 | 상태 |
|---|---|---|---|
| 기초 | [① 문법·패키지·모듈](/posts/go/2026-07-12-go-basics-package-module/) | 필수 | ✅ |
| 타입 | [② struct·method·interface (+method set)](/posts/go/2026-07-12-go-struct-method-interface/) | 필수 · **뼈대** | ✅ |
| 타입 | [③ slice·map·string](/posts/go/2026-07-12-go-slice-map-string/) | 필수 | ✅ |
| 흐름 | [④ error 처리 + defer·panic·recover](/posts/go/2026-07-12-go-error-handling-defer/) | 필수 | ✅ |
| 동시성 | [⑤ goroutine·channel·context (+`-race`)](/posts/go/2026-07-12-go-concurrency-goroutine-channel/) | 필수 · Go의 정체성 | ✅ |
| 실전 | [⑥ 표준 라이브러리·관용구·testing](/posts/go/2026-07-12-go-stdlib-idiom-testing/) | 필수 | ✅ |
| 마지막 | [⑦ 도구 — go build·mod·fmt·vet](/posts/go/2026-07-12-go-tooling/) | 필수 | ✅ |
| 부록 | 제네릭 (1.18+) | 나중 | ⬜ |
| 부록 | C++ → Go 개념 대응표 | 참고 | ✅ |

**①~⑦의 [필수]만 세로로 따라가면 하나의 완결된 경로**입니다. 아래는 각 단계를 왜 그 순서로 두는지 풀어 쓴 것입니다.

## ① 기초 — 문법·패키지·모듈

> 📖 상세 글: [① 문법·패키지·모듈](/posts/go/2026-07-12-go-basics-package-module/)

C를 알면 문법 절반은 익숙합니다. 이 단계 목표는 암기가 아니라 **C++과 다른 Go의 뼈대 규칙**입니다.

- **[필수] 기본 문법** — 변수(`:=` 짧은 선언), 함수(다중 반환값!), 제어문. `for`가 유일한 반복문(while 없음).
- **[필수] 패키지와 `go mod`** — 헤더/`#include`가 없습니다. 파일이 아니라 **패키지 단위**로 묶이고, 대문자로 시작하면 공개(export)입니다. `go mod init`으로 모듈을 시작.
- **[필수] 타입 기초** — 명시적 변환만 허용(암묵 형변환 없음). `nil`, zero value(모든 타입에 기본값이 있음) 개념.

**자주 막히는 지점:** 대소문자로 가시성이 결정되는 것(`private`/`public` 키워드가 없음), 그리고 안 쓴 import·변수가 **컴파일 에러**라는 것(경고가 아님).

> **통과 기준:** `go mod init` 한 모듈에서 다중 반환 함수를 만들어 다른 패키지에서 호출할 수 있으면 다음으로.

## ② 타입 — struct·method·interface (뼈대)

> 📖 상세 글: [② struct·method·interface](/posts/go/2026-07-12-go-struct-method-interface/)

Go에는 **클래스가 없습니다.** 이 단계가 C++ 습관과 가장 크게 충돌하는 지점이자 Go 설계의 핵심이라, 뼈대로 둡니다.

- **[필수] struct와 method** — 데이터는 `struct`, 동작은 그 위에 붙는 method. 클래스 하나로 묶지 않고 분리합니다.
- **[필수] interface (암묵적 구현)** — `implements` 선언이 없습니다. 메서드 시그니처만 맞으면 자동으로 그 인터페이스입니다(구조적 타이핑, 덕 타이핑). C++의 순수 가상 함수 상속과 완전히 다른 사고방식. → "누가 인터페이스 만족을 선언하나"(구조적 vs 명목적)는 [서브타입 다형성](/posts/concept/2026-07-12-subtype-polymorphism-dynamic-dispatch/).
- **[필수] embedding (상속 대신 컴포지션)** — Go에는 상속이 없습니다. struct 안에 struct를 심어(embed) 기능을 조합합니다.
- **[필수] method set — 포인터 vs 값 리시버** — method가 원본을 수정하려면 포인터 리시버. 그리고 **어느 쪽 리시버냐가 인터페이스 만족 여부를 가릅니다**(값 타입은 포인터 리시버 메서드를 만족 못 함). C++에 없는 Go 특유의 규칙이라 인터페이스 구현이 "왜 안 되지" 할 때 십중팔구 여기입니다.

**자주 막히는 지점:** 상속으로 풀던 문제를 자꾸 상속으로 풀려는 것. Go에서는 **인터페이스 + 컴포지션**이 정답입니다. "is-a"가 아니라 "can-do"로 생각하기. 그리고 위 method set 규칙 — 값/포인터 리시버 혼동.

> **통과 기준:** 인터페이스를 하나 정의하고, 그걸 만족하는 struct를 두 개 만들어 같은 함수에 넘길 수 있으면 통과.

## ③ 타입 — slice·map·string

> 📖 상세 글: [③ slice·map·string](/posts/go/2026-07-12-go-slice-map-string/)

Go의 핵심 자료구조. C++ 컨테이너와 겉은 비슷하지만 내부가 다릅니다.

- **[필수] slice** — C++ `vector`에 대응하지만, **배열의 뷰(view)**라는 게 핵심. `len`/`cap`, `append`, 슬라이싱. 얕은 공유 때문에 함정이 있습니다.
- **[필수] map** — `unordered_map` 대응. 순회 순서가 **무작위**(의도적).
- **[필수] string과 rune** — 문자열은 UTF-8 바이트열. 한글 다룰 때 `byte`와 `rune`(코드포인트) 구분이 중요.

**자주 막히는 지점:** `append`가 원본 slice를 공유해서 예상치 못하게 데이터가 바뀌는 것. slice가 "값이 아니라 참조처럼 동작하는" 이유를 이해해야 합니다.

## ④ 흐름 — error 처리 (예외가 없다)

> 📖 상세 글: [④ error 처리 + defer·panic·recover](/posts/go/2026-07-12-go-error-handling-defer/)

C++/Java에서 온 사람에게 가장 큰 문화 충격. **Go에는 예외(exception)가 없습니다.** 예외·에러 값·Result 세 모델의 비교는 [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/) 참고.

- **[필수] error 값 반환** — 함수가 `(결과, error)`를 반환하고, `if err != nil`로 매번 확인합니다. `try/catch`가 아니라 값으로 흐릅니다.
- **[필수] error wrapping** — `fmt.Errorf("...: %w", err)`로 감싸고 `errors.Is`/`errors.As`로 판별.
- **[나중] panic / recover** — 진짜 복구 불가능한 상황용. C++ 예외처럼 일상 흐름 제어에 쓰면 안 됩니다.
- **[나중] defer** — 함수 종료 시 실행. RAII 소멸자의 역할을 명시적으로. 파일 닫기·언락에 필수.

**자주 막히는 지점:** `if err != nil`이 반복되는 게 지겨워서 무시하는 것. Go는 이 명시성을 **일부러** 택했습니다. 습관을 바꾸는 게 학습의 핵심.

> **통과 기준:** 에러를 `%w`로 감싸 상위로 올리고, 상위에서 `errors.Is`로 특정 에러를 구분해 처리할 수 있으면 통과.

## ⑤ 동시성 — goroutine·channel (Go의 정체성)

> 📖 상세 글: [⑤ goroutine·channel·context](/posts/go/2026-07-12-go-concurrency-goroutine-channel/)

Go를 Go답게 만드는 킬러 피처. C++의 `std::thread`·뮤텍스 고생과 비교하면 놀랄 만큼 가볍습니다.

- **[필수] goroutine** — `go f()` 한 줄로 경량 스레드 실행. 수천 개를 띄워도 됩니다(OS 스레드가 아님). goroutine이 스레드·코루틴과 뭐가 다른지는 [코루틴이란 무엇인가](/posts/concept/2026-07-12-coroutine/) 참고.
- **[필수] channel** — goroutine 간 통신. "메모리를 공유해 통신하지 말고, 통신으로 메모리를 공유하라"는 Go 철학. → 공유 상태+뮤텍스 vs 채널(CSP) vs 소유권 비교는 [동시성 조율 모델](/posts/concept/2026-07-12-concurrency-coordination-models/).
- **[필수] select** — 여러 채널을 동시에 기다리기.
- **[나중] sync 패키지** — `WaitGroup`, `Mutex`. 채널로 안 풀리는 경우의 전통적 동기화.
- **[나중] context** — 취소·타임아웃 전파. C++에 대응이 없는 Go 고유 개념으로, **실전 서버·클라이언트에서는 사실상 필수**입니다. 채널 기본을 잡은 직후에 봐 두세요.
- **[나중] race detector(`-race`)** — `go test -race`, `go run -race`로 데이터 레이스를 런타임에 탐지. 경량 goroutine을 남발하다 생기는 **goroutine 누수**와 함께, 동시성 코드를 실전에 올리기 전 반드시 거치는 관문.

**자주 막히는 지점:** 채널을 안 닫거나, 아무도 안 받는 채널에 보내서 생기는 **deadlock**. 한 번 겪어봐야 채널이 이해됩니다. 그리고 눈에 안 보이는 데이터 레이스 — `-race` 없이는 안 드러납니다.

> **통과 기준:** goroutine 여러 개가 채널로 결과를 모으고, main이 `WaitGroup` 또는 채널로 완료를 기다리는 코드를 짤 수 있으면 통과.

## ⑥ 실전 — 표준 라이브러리·관용구·testing

> 📖 상세 글: [⑥ 표준 라이브러리·관용구·testing](/posts/go/2026-07-12-go-stdlib-idiom-testing/)

문법을 넘어 실제로 뭔가 만들고, **Go답게** 쓰는 단계. 표준 라이브러리도 관용구도 여기서.

- **[필수] net/http** — 웹 서버·클라이언트가 표준 라이브러리만으로. Go가 서버 언어로 뜬 이유.
- **[필수] encoding/json + struct tag** — struct ↔ JSON. `json:"..."` **태그(tag)**로 매핑하는데, 이 태그 기반 메타데이터 + reflection은 표준 라이브러리 전반을 관통하는 Go 방식입니다.
- **[필수] 관용구·철학(Effective Go)** — "accept interfaces, return structs"(인터페이스를 받고 구체 타입을 반환), 짧은 이름, 에러 문자열 소문자 시작 같은 **관례**. 문법이 맞아도 이걸 모르면 "Go답지 않은" 코드가 나옵니다. 문법을 뗀 직후 반드시 한 번.
- **[필수] testing** — `go test`, `_test.go` 파일, **테이블 주도 테스트(table-driven test)**라는 Go 관용구. 벤치마크(`Benchmark`)·퍼징(`fuzz`)도 표준 내장.
- **[나중] reflection(`reflect`)** — 태그를 읽어 동작을 바꾸는 메타프로그래밍. 라이브러리를 쓸 땐 몰라도 되지만, 왜 struct tag가 먹히는지의 원리.
- **[나중] io / bufio** — 스트림 처리.

## ⑦ 마지막 — 도구

> 📖 상세 글: [⑦ 도구 — go build·mod·fmt·vet](/posts/go/2026-07-12-go-tooling/)

Go는 도구가 언어에 내장되어 있어서 C++의 CMake 같은 외부 빌드 시스템이 필요 없습니다.

- **[필수] go build / go run / go test** — 빌드·실행·테스트가 명령 하나씩.
- **[필수] go fmt** — 포맷이 **언어 표준으로 강제**됩니다(스타일 논쟁이 없음). C++의 clang-format을 팀이 합의할 필요가 없는 셈.
- **[필수] go mod** — 의존성 관리. `go.mod`/`go.sum`.
- **[나중] go vet / staticcheck** — 정적 분석.

여기까지가 Go를 배우는 학습 줄기입니다.

---

## 부록 — 제네릭 (Go 1.18+)

Go는 오랫동안 제네릭이 없었고 2022년 1.18에서야 들어왔습니다. **[필수] 경로 밖**입니다 — 인터페이스와 `any`로 대부분 풀리고, 제네릭이 진짜 필요한 순간(자료구조 라이브러리 작성 등)이 오면 그때 봐도 됩니다. → 제네릭(파라미터 다형성)의 언어 공통 개념은 [제네릭 — 파라미터 다형성](/posts/concept/2026-07-12-generics-parametric-polymorphism/).

> 📖 [A Tour of Go — Generics](https://go.dev/tour/generics/1)

## 부록 — C++ → Go 개념 대응표 (참고)

C++을 알고 오는 사람의 지도. "이건 C++의 뭐에 해당하나"를 빠르게 잡는 용도입니다.

| C++ | Go | 핵심 차이 |
|---|---|---|
| `class` | `struct` + method | 데이터와 동작이 분리됨. 클래스 없음 |
| 상속 (`: public Base`) | embedding | is-a가 아니라 조합. 상속 자체가 없음 |
| 순수 가상 함수 인터페이스 | `interface` | `implements` 선언 없이 **암묵적** 구현 |
| 예외 (`try/catch/throw`) | `error` 값 반환 | 예외 없음. 에러는 값으로 흐름 |
| RAII 소멸자 | `defer` | 자동이 아니라 명시적 호출 |
| `std::vector` | slice | 배열의 뷰. append 공유 함정 있음 |
| `std::unordered_map` | `map` | 순회 순서 무작위 |
| `unique_ptr`/`shared_ptr` | (불필요) | GC가 관리. 스마트 포인터 개념 없음 |
| `std::thread` + mutex | goroutine + channel | 훨씬 가볍고, 공유보다 통신 선호 |
| 템플릿 | 제네릭(1.18+) / `interface` | 대부분 인터페이스로 해결 |
| CMake / Make | `go build` / `go mod` | 빌드 시스템이 언어 내장 |
| clang-format (합의 필요) | `go fmt` (강제) | 스타일 논쟁 자체가 없음 |

## 이 로드맵을 쓰는 법

- **진도는 "봤다"가 아니라 각 단계의 통과 기준을 직접 구현할 수 있는지**로 판단합니다.
- ①→⑦ [필수]를 세로로. [나중]·[선택]은 미뤄도 완결됩니다.
- 한 단계를 정리하면 상태를 ⬜→✅로 바꾸고, 직접 겪은 함정을 상세 글로 남겨 링크를 붙입니다.
- C++ 습관이 튀어나오면(상속으로 풀려 하거나 예외를 찾으면) 대응표로 돌아와 Go식 사고로 교정합니다.

## Reference

- [A Tour of Go](https://go.dev/tour/) — 공식 인터랙티브 투어. 시작점.
- [Go by Example](https://gobyexample.com/) — 주제별 최소 예제.
- [Effective Go](https://go.dev/doc/effective_go) — 관용구·스타일의 공식 가이드. 기초를 뗀 뒤 필독.
- [Go 공식 문서](https://go.dev/doc/) — 표준 라이브러리·언어 스펙 1차 레퍼런스.
- 『The Go Programming Language』(Donovan & Kernighan) — 정본 책.

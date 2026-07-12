---
title       : 실전 ⑥ 표준 라이브러리·관용구·testing — Go답게 쓰기
description : "문법을 넘어 실제로 뭔가 만들고 Go답게 쓰는 단계. net/http만으로 서버를 세우고, encoding/json과 struct tag로 매핑하고, 'accept interfaces, return structs' 같은 Effective Go 관용구를 익히고, 테이블 주도 테스트로 go test를 쓴다. struct tag를 먹게 하는 reflection의 정체까지."
date        : 2026-07-12 10:55:00 +0900
updated     : 2026-07-12 10:55:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **⑥ 실전** 단계입니다. 앞 글: [⑤ goroutine·channel·context](/posts/go/2026-07-12-go-concurrency-goroutine-channel/)

문법을 뗐으면 이제 실제로 뭔가 만들고, 무엇보다 **Go답게** 쓰는 단계입니다. 문법이 맞아도 관용구를 모르면 "Go 문법으로 쓴 C++/Java" 코드가 나옵니다.

## net/http — 표준만으로 서버

Go가 서버 언어로 뜬 이유입니다. 외부 프레임워크 없이 표준 라이브러리만으로 웹 서버·클라이언트가 됩니다.

```go
http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "hello")
})
http.ListenAndServe(":8080", nil)
```

`http.Handler`는 `ServeHTTP(w, r)` 메서드 하나짜리 인터페이스입니다(②의 작은 인터페이스). 미들웨어·라우팅이 전부 이 인터페이스 조합으로 굴러갑니다.

## encoding/json + struct tag

struct와 JSON을 오갑니다. 필드 옆의 **백틱 태그(tag)**가 JSON 키 매핑을 지정합니다.

```go
type User struct {
    Name  string `json:"name"`
    Email string `json:"email,omitempty"`   // 비었으면 생략
    admin bool   // 소문자 → export 안 됨 → JSON에서 무시
}

b, _ := json.Marshal(u)        // struct → JSON
json.Unmarshal(b, &u)          // JSON → struct
```

여기서 **대소문자 export 규칙(①)이 다시 등장**합니다 — `encoding/json`은 다른 패키지라, 소문자 필드는 아예 안 보여서 직렬화되지 않습니다. 태그 기반 메타데이터는 JSON뿐 아니라 DB·설정 등 표준 라이브러리 전반을 관통하는 Go 방식입니다.

## 관용구 — Effective Go

문법을 뗀 직후 반드시 한 번 훑어야 하는 **관례**들입니다. 몇 가지 핵심:

- **"accept interfaces, return structs"** — 함수 인자는 **작은 인터페이스**로 받고(유연), 반환은 **구체 타입**으로(명확). ②에서 배운 인터페이스의 실전 지침입니다.
- **에러 문자열은 소문자로, 마침표 없이** — `fmt.Errorf("파일 없음")`이 아니라 `"file not found"` 식. 감싸일 때 문장 중간에 들어가기 때문.
- **짧은 이름** — 스코프가 좁으면 `i`, `r`, `buf`처럼 짧게. 긴 이름은 오히려 비관용적.
- **getter에 `Get` 안 붙이기** — `user.Name()`이지 `user.GetName()`이 아님.

## testing — 표준 내장, 테이블 주도

테스트 프레임워크가 언어에 내장입니다. `_test.go` 파일에 `TestXxx(t *testing.T)`를 쓰면 `go test`가 찾아 돌립니다. Go 관용구는 **테이블 주도 테스트**입니다.

```go
func TestAbs(t *testing.T) {
    cases := []struct {
        name string
        in, want int
    }{
        {"음수", -3, 3},
        {"양수", 5, 5},
        {"영", 0, 0},
    }
    for _, c := range cases {
        t.Run(c.name, func(t *testing.T) {
            if got := Abs(c.in); got != c.want {
                t.Errorf("Abs(%d) = %d, want %d", c.in, got, c.want)
            }
        })
    }
}
```

케이스를 슬라이스로 나열하고 루프로 도는 이 패턴이 Go 테스트의 기본형입니다. 벤치마크(`BenchmarkXxx`)·퍼징(`FuzzXxx`)도 같은 파일에 표준으로 들어갑니다 — C++의 GoogleTest 같은 외부 의존이 필요 없습니다.

## reflection — struct tag가 먹는 원리

라이브러리를 **쓸** 땐 몰라도 되지만, `encoding/json`이 어떻게 태그를 읽어 필드를 매핑하는지의 답이 `reflect`입니다. 런타임에 타입·필드·태그를 들여다보는 메타프로그래밍이라, 직접 쓸 일은 드물지만 "왜 struct tag가 동작하나"의 원리로 알아 두면 됩니다.

## C++ 전환으로 정리

| C++ | Go | 핵심 차이 |
|---|---|---|
| Boost.Beast 등 외부 라이브러리 | `net/http` (표준) | 서버가 표준 라이브러리에 |
| 직렬화 라이브러리(nlohmann 등) | `encoding/json` + 태그 | 태그 기반 매핑이 표준 |
| GoogleTest (외부) | `testing` (내장) | 테스트·벤치·퍼징 내장 |
| 팀마다 다른 스타일 | Effective Go 관용구 | 공식 관례가 사실상 표준 |

## 자주 막히는 지점

- **JSON에 필드가 안 나온다** — 소문자 필드(unexported)라 그렇습니다. export하려면 대문자 + `json:"..."` 태그.
- **인터페이스를 반환** — 습관적으로 인터페이스를 반환하면 호출부가 구체 정보를 잃습니다. **구체 타입을 반환**하고, 받는 쪽에서 필요한 인터페이스로 좁히세요.
- **테스트를 한 케이스씩** — 함수마다 `TestXxx`를 여러 개 쓰지 말고 테이블 한 개로 모으는 게 관용구.

## 통과 기준

- `net/http`로 간단한 핸들러를 세우고, `encoding/json`으로 struct ↔ JSON을 왕복할 수 있다.
- 테이블 주도 테스트를 작성하고 `go test`로 돌릴 수 있다.
- "accept interfaces, return structs"를 자기 코드에 적용할 수 있다.

다음은 [⑦ 도구 — build·mod·fmt·vet](/posts/go/2026-07-12-go-tooling/)입니다. 언어에 내장된 도구 체계로 로드맵의 마지막 단계입니다.

## Reference

- [Effective Go](https://go.dev/doc/effective_go) — 관용구·스타일의 공식 가이드. 이 단계의 필독.
- [Go by Example: JSON](https://gobyexample.com/json) · [HTTP Server](https://gobyexample.com/http-server) · [Testing](https://gobyexample.com/testing-and-benchmarking)
- [Go 블로그 — Table-driven tests](https://go.dev/wiki/TableDrivenTests)

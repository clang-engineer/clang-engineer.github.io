---
title       : 동시성 ⑤ goroutine·channel·context — Go의 정체성
description : "Go를 Go답게 만드는 킬러 피처. go 한 줄로 수천 개를 띄우는 경량 goroutine, '메모리 공유 대신 통신으로 공유'하는 channel과 select, sync.WaitGroup·Mutex, 취소·타임아웃을 전파하는 context, 그리고 눈에 안 보이는 데이터 레이스를 잡는 -race까지. std::thread 고생과 비교하며 정리한다."
date        : 2026-07-12 10:50:00 +0900
updated     : 2026-07-12 10:50:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **⑤ 동시성** 단계입니다. 앞 글: [④ error 처리 + defer](/posts/go/2026-07-12-go-error-handling-defer/)

Go를 Go답게 만드는 킬러 피처입니다. C++의 `std::thread`·뮤텍스 고생과 비교하면 놀랄 만큼 가볍습니다. goroutine이 스레드·코루틴과 뭐가 다른지는 [코루틴이란 무엇인가](/posts/concept/2026-07-12-coroutine/)를 함께 보세요.

## goroutine — `go` 한 줄

함수 앞에 `go`를 붙이면 **경량 스레드**로 동시에 실행됩니다. OS 스레드가 아니라 런타임이 관리하는 가벼운 단위라, 수천~수만 개를 띄워도 됩니다(스택이 몇 KB에서 시작해 필요할 때 자랍니다).

```go
go doWork()          // doWork를 별도 goroutine에서 실행, 즉시 다음 줄로
```

문제는 **main이 끝나면 프로그램이 통째로 죽는다**는 것 — 띄운 goroutine의 완료를 기다리지 않습니다. 그래서 완료를 기다릴 장치(채널·WaitGroup)가 반드시 필요합니다.

## channel — 통신으로 공유하라

Go의 동시성 철학은 한 문장입니다. **"메모리를 공유해 통신하지 말고, 통신으로 메모리를 공유하라."** 뮤텍스로 공유 변수를 지키는 대신, **채널**로 값을 주고받습니다.

```go
ch := make(chan int)     // 채널 생성
go func() { ch <- 42 }() // 보내기 (받는 쪽이 준비될 때까지 대기)
v := <-ch                // 받기

// 버퍼 있는 채널 — 버퍼가 찰 때까지 안 막힘
buf := make(chan int, 3)
buf <- 1
buf <- 2                 // 버퍼에 여유가 있으면 받는 쪽 없이도 진행

// 다 보냈으면 닫고, range로 받으면 남은 값을 모두 꺼낸다
close(buf)
for v := range buf { ... }   // 1, 2
```

버퍼 없는(unbuffered) 채널은 **보내는 쪽과 받는 쪽이 만나야** 통과합니다(랑데부). 이 blocking이 곧 동기화라, 별도 락 없이 순서가 맞춰집니다.

## select — 여러 채널을 동시에

여러 채널 중 준비된 것을 골라 처리합니다. `switch`의 채널 버전입니다.

```go
select {
case v := <-ch1:      fmt.Println("ch1", v)
case ch2 <- x:        fmt.Println("ch2로 보냄")
case <-time.After(time.Second): fmt.Println("타임아웃")   // 흔한 관용구
default:              fmt.Println("아무것도 준비 안 됨")   // 있으면 non-blocking
}
```

## sync — 채널로 안 풀릴 때

모든 걸 채널로 풀 필요는 없습니다. 단순히 "여러 goroutine이 끝나기를 기다림"은 `WaitGroup`이, 짧은 임계 구역 보호는 `Mutex`가 더 간단합니다.

```go
var wg sync.WaitGroup
for _, job := range jobs {
    wg.Add(1)
    go func(j Job) {
        defer wg.Done()      // 끝나면 카운트 감소 (defer로 보장)
        process(j)
    }(job)
}
wg.Wait()                    // 전부 Done 될 때까지 대기
```

## context — 취소·타임아웃 전파

C++에 대응 개념이 없는 Go 고유 축이지만, **실전 서버·클라이언트에서는 사실상 필수**입니다. `context`는 "이 작업 이제 그만"이라는 취소 신호를 여러 goroutine에 **전파**합니다.

```go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()

select {
case res := <-slowCall(ctx):  use(res)
case <-ctx.Done():            return ctx.Err()   // 타임아웃·취소 시
}
```

관례상 함수의 **첫 인자로 `ctx context.Context`**를 받아 하위로 계속 넘깁니다. 그러면 최상위에서 `cancel()` 한 번에 아래 모든 작업이 정리됩니다.

## -race — 눈에 안 보이는 레이스 잡기

경량이라 goroutine을 남발하다 보면 **데이터 레이스**(여러 goroutine이 동기화 없이 같은 변수를 읽고 씀)가 생깁니다. 이건 **평소엔 안 드러나다가 운 나쁘면 터집니다.** Go는 런타임 탐지기를 내장합니다.

```bash
go test -race ./...
go run -race main.go
```

동시성 코드를 실전에 올리기 전 반드시 한 번 `-race`로 돌리세요. 함께 조심할 것이 **goroutine 누수** — 아무도 안 받는 채널에 영원히 막혀 goroutine이 안 죽고 쌓이는 것.

## C++ 전환으로 정리

| C++ | Go | 핵심 차이 |
|---|---|---|
| `std::thread` (OS 스레드) | goroutine | 경량, 수천 개 OK. `go` 한 줄 |
| 공유 변수 + mutex | channel (통신) | 공유보다 통신 선호 |
| `std::mutex` / `join()` | `sync.Mutex` / `WaitGroup` | 필요할 땐 전통 방식도 |
| (대응 없음) | `context` | 취소·타임아웃 전파 |
| ThreadSanitizer | `-race` (내장) | 빌드 플래그 하나 |

## 자주 막히는 지점

- **deadlock** — 아무도 안 받는 채널에 보내거나, 채널을 안 닫고 `range`로 받으면 전체가 멈춥니다(`fatal error: all goroutines are asleep - deadlock!`). 한 번 겪어야 채널이 이해됩니다.
- **닫힌 채널에 send → 패닉** — 받기는 닫힌 뒤에도 되지만(버퍼에 남은 값을 다 꺼낸 뒤엔 zero value), **보내기는 패닉**. 닫는 책임은 **보내는 쪽**에 둡니다.
- **루프 변수 캡처** — `for` 안에서 `go func(){ use(v) }()`처럼 루프 변수를 클로저로 캡처하면 예전 Go에선 전부 마지막 값을 봤습니다. 인자로 넘기거나(위 WaitGroup 예제), Go 1.22+의 새 루프 변수 시맨틱에 의존.
- **보이지 않는 레이스** — `-race` 없이는 안 드러납니다. 습관적으로 테스트를 `-race`로.

## 통과 기준

- goroutine 여러 개가 채널로 결과를 모으고, main이 `WaitGroup` 또는 채널로 완료를 기다리는 코드를 짤 수 있다.
- unbuffered vs buffered 채널의 차이, `select`·`context` 취소를 설명할 수 있다.
- `-race`로 데이터 레이스를 탐지할 수 있다.

다음은 [⑥ 표준 라이브러리·관용구·testing](/posts/go/2026-07-12-go-stdlib-idiom-testing/)입니다. 문법을 넘어 실제로 뭔가 만들고 **Go답게** 쓰는 단계입니다.

## Reference

- [A Tour of Go — Concurrency](https://go.dev/tour/concurrency/1) — goroutine·channel·select의 정본.
- [Go by Example: Goroutines](https://gobyexample.com/goroutines) · [Channels](https://gobyexample.com/channels) · [Context](https://gobyexample.com/context)
- [코루틴이란 무엇인가](/posts/concept/2026-07-12-coroutine/) — goroutine이 스레드·코루틴과 어떻게 다른지.

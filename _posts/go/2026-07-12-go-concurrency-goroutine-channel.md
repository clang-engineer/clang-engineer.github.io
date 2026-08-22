---
title       : 동시성 ⑤ goroutine·channel·context — Go의 정체성
description : "goroutine을 단순한 경량 스레드로 등치하지 않고 Go 런타임이 스케줄링하는 경량 실행 단위로 설명한다. channel·select·context·WaitGroup·Mutex·race detector의 역할을 구분한다."
date        : 2026-07-12 10:50:00 +0900
updated     : 2026-08-22 18:00:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **⑤ 동시성** 단계다. 앞 글: [④ error 처리 + defer](/posts/go/2026-07-12-go-error-handling-defer/)

Go의 동시성 모델을 이해하려면 `goroutine`, channel, `sync`, `context`를 한 덩어리로 외우기보다 **실행 단위·통신·동기화·취소 전파**로 역할을 나눠 보는 편이 좋다.

```text
goroutine
→ Go 런타임이 스케줄링하는 경량 실행 단위

channel
→ goroutine 사이의 통신·동기화 지점

sync
→ 공유 상태와 완료 대기를 직접 조율

context
→ 취소·deadline·요청 범위 값을 하위 호출로 전파
```

## goroutine — Go 런타임의 경량 실행 단위

```go
go doWork()
```

`go` statement는 함수를 새로운 goroutine에서 실행하도록 예약하고 현재 goroutine은 계속 진행한다.

goroutine을 흔히 **경량 스레드**라고 설명하지만 OS thread와 같은 단위는 아니다. Go runtime scheduler가 많은 goroutine을 더 적은 수의 OS thread 위에서 실행할 수 있고, 필요에 따라 선점과 재스케줄링을 수행한다.

```text
OS thread
→ 운영체제 스케줄링 단위

goroutine
→ Go runtime 스케줄링 단위
```

코루틴과도 역사적·구현적 공통점이 있지만 일반적인 `async/await` stackless coroutine과 같은 의미론으로 등치하지 않는다. 자세한 경계는 [코루틴이란 무엇인가](/posts/concept/2026-07-12-coroutine/)에서 본다.

main goroutine이 종료되면 프로그램 프로세스가 끝나므로 다른 goroutine의 완료를 자동으로 기다려 주지 않는다. 완료를 기다려야 한다면 `WaitGroup`, channel 등으로 수명 관계를 명시한다.

## channel — 통신과 동기화 지점

```go
ch := make(chan int)

go func() {
    ch <- 42
}()

v := <-ch
```

unbuffered channel의 send와 receive는 상대편이 준비될 때까지 서로 동기화된다.

buffered channel은 용량만큼 값을 임시 보관할 수 있다.

```go
ch := make(chan int, 2)
ch <- 1
ch <- 2
```

channel은 통신을 구조화하는 강력한 도구지만 **값을 보냈다고 자동으로 소유권이 이전되는 것은 아니다.**

```go
ch <- slice
```

처럼 slice·map·pointer를 보내면 송신 측에 같은 backing data나 객체를 가리키는 별칭이 남을 수 있다. 양쪽 goroutine이 같은 데이터를 동시에 수정하면 여전히 data race가 가능하다.

따라서 Go의 격언

> "Do not communicate by sharing memory; instead, share memory by communicating."

은 **공유 가변 상태를 줄이는 설계 방향**이지 channel이 모든 race를 자동으로 제거한다는 뜻은 아니다.

## channel close — 누가 닫는가

channel을 닫는 것은 "더 이상 값을 보내지 않는다"는 신호다.

```go
close(ch)
```

일반적인 원칙은 **보내는 쪽이 send가 끝났음을 확실히 알 때 닫는다**는 것이다. receiver가 무조건 channel을 닫는다는 식으로 규칙을 외우지 않는다.

닫힌 channel에서는

- receive 가능
- 버퍼를 다 비우면 zero value와 `ok=false`를 받을 수 있음
- send는 panic
- 이미 닫힌 channel을 다시 close하면 panic

이다.

## select — 여러 channel operation 중 준비된 것을 선택

```go
select {
case v := <-ch1:
    fmt.Println(v)
case ch2 <- x:
    fmt.Println("sent")
case <-ctx.Done():
    return ctx.Err()
}
```

`select`는 여러 send/receive case 중 진행 가능한 것을 선택한다. 여러 case가 동시에 준비돼 있으면 하나가 선택된다.

`default`를 넣으면 아무 case도 준비되지 않았을 때 즉시 진행할 수 있어 non-blocking poll 형태가 된다.

타임아웃을 반복 루프에서 구현할 때는 매 반복마다 `time.After`를 새로 만드는 것보다 `context.WithTimeout`, `time.NewTimer` 등 수명과 비용을 명확히 관리하는 방식이 더 적합한 경우가 많다.

## sync — 공유 상태와 완료 대기

channel이 모든 동기화의 정답은 아니다.

### WaitGroup

```go
var wg sync.WaitGroup

for _, job := range jobs {
    wg.Add(1)
    go func(j Job) {
        defer wg.Done()
        process(j)
    }(job)
}

wg.Wait()
```

`WaitGroup`은 여러 goroutine의 완료를 기다리는 단순한 카운터 동기화에 적합하다.

### Mutex

공유된 in-memory state를 짧은 critical section으로 보호해야 한다면 `sync.Mutex`가 더 직접적일 수 있다.

```go
mu.Lock()
state++
mu.Unlock()
```

```text
channel
→ 통신과 ownership-like handoff 규약을 설계할 때 유리

Mutex
→ 이미 공유된 상태의 원자적 접근을 보호할 때 유리
```

둘을 "Go다운 것 vs 나쁜 것"으로 나누지 않는다.

## context — 취소와 deadline 전파

`context.Context`는 요청 범위의 취소·deadline과 일부 request-scoped value를 호출 그래프 아래로 전달한다.

```go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()

if err := doWork(ctx); err != nil {
    return err
}
```

관용적으로 `ctx context.Context`를 함수의 첫 번째 인자로 전달한다.

중요한 점은 **context가 goroutine을 강제로 종료하지 않는다는 것**이다. 하위 함수와 goroutine이 `ctx.Done()` 또는 context-aware API를 관찰하고 스스로 종료 경로를 구현해야 한다.

```text
cancel()
→ 취소 신호를 보냄

≠

goroutine 강제 kill
```

또한 `context.Value`를 일반 설정 전달용 map처럼 남용하지 않는다. 요청 범위를 가로질러 필요한 메타데이터에 제한하는 것이 일반적이다.

## race detector

```bash
go test -race ./...
go run -race main.go
```

race detector는 실행 중 실제로 관찰된 메모리 접근을 바탕으로 data race를 탐지한다.

따라서

```text
-race에서 안 나옴
→ race가 절대 없음
```

을 의미하지 않는다. 테스트가 해당 실행 경로를 지나지 않았다면 탐지할 수 없다. 동시성 테스트의 coverage와 함께 사용해야 한다.

## goroutine leak

끝나지 않는 goroutine은 메모리뿐 아니라 channel·timer·socket 같은 자원을 계속 붙잡을 수 있다.

대표 원인은 다음과 같다.

- 아무도 받지 않는 channel send에서 영구 대기
- receive가 끝나지 않는 channel 기다림
- context 취소를 전달하지 않음
- ticker/timer 또는 I/O 수명을 정리하지 않음

따라서 goroutine을 만들 때는 **누가 언제 끝내는가**를 같이 설계한다.

## C++을 발판으로 비교

| C++에서 떠올릴 것 | Go | 경계 |
|---|---|---|
| `std::thread` | goroutine | 둘 다 동시 실행 흐름이지만 스케줄링 주체와 비용 모델이 다름 |
| queue + mutex/condvar | channel | 통신 직관은 비슷하지만 channel semantics가 언어에 통합됨 |
| `std::mutex` | `sync.Mutex` | 공유 상태 보호라는 역할은 비슷함 |
| join/future wait | `WaitGroup` | 완료 대기 목적은 비슷하지만 API 모델은 다름 |
| cancellation token류 | `context` | 취소 전파라는 목적은 비슷하지만 Go API 관용구가 별도로 정립됨 |
| ThreadSanitizer | `-race` | dynamic race detection이라는 목적이 비슷함 |

## 통과 기준

- goroutine이 OS thread와 같은 단위가 아니라는 점을 설명할 수 있다.
- channel send가 소유권 이전을 자동 보장하지 않는다는 것을 안다.
- channel과 Mutex 중 무엇이 현재 문제에 더 자연스러운지 판단할 수 있다.
- context cancel이 강제 종료가 아니라 협력적 취소 신호임을 설명할 수 있다.
- race detector가 실행 경로 기반 동적 분석임을 안다.

다음은 [⑥ 표준 라이브러리·관용구·testing](/posts/go/2026-07-12-go-stdlib-idiom-testing/)이다.

## Reference

- [A Tour of Go — Concurrency](https://go.dev/tour/concurrency/1)
- [Go Blog — Share Memory By Communicating](https://go.dev/blog/codelab-share)
- [Go Blog — Context](https://go.dev/blog/context)
- [Data Race Detector](https://go.dev/doc/articles/race_detector)
- [코루틴이란 무엇인가](/posts/concept/2026-07-12-coroutine/)

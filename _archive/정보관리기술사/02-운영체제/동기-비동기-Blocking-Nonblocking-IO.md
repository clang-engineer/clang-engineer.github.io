# 동기·비동기와 Blocking·Non-blocking I/O

> 핵심 질문: **I/O 요청의 완료를 어떻게 다루며, 호출한 실행 흐름은 언제 대기하는가?**
>
> 관련 개념: [I/O 처리 방식](../01-컴퓨터-구조/IO-처리-방식.md) · [I/O Multiplexing · Event Loop · Reactor](IO-Multiplexing-EventLoop-Reactor.md) · [Socket과 서버 I/O](../03-네트워크/_보충학습/Socket-서버-IO.md)

## 1. 큰 그림 — 서로 다른 세 질문

```text
Software I/O 모델
├─ 호출의 대기 → Blocking / Non-blocking
├─ 요청과 완료의 관계 → Synchronous / Asynchronous
└─ 이벤트가 의미하는 것 → Readiness / Completion
```

- **Blocking / Non-blocking:** 호출한 실행 흐름이 필요한 결과를 기다리며 멈추는가?
- **Synchronous / Asynchronous:** I/O 요청을 제출한 뒤 완료를 호출 흐름에서 직접 기다리고 처리하는가, 별도의 완료 경로로 결과를 전달받는가?
- **Readiness / Completion:** I/O를 *시도할 수 있음*을 알리는가, *제출한 작업이 끝남*을 알리는가?

이 구분은 학습용 모델이다. 운영체제·API·문맥마다 동기/비동기의 정의가 다를 수 있으므로 모든 함수를 네 칸 중 하나에 고정하지 않는다.

## 2. 동기·비동기 × Blocking·Non-blocking — 4분면

| | Blocking | Non-blocking |
|---|---|---|
| **Synchronous** | 완료될 때까지 호출이 대기 | 즉시 반환하는 I/O를 호출자가 재시도·확인하여 완료 처리 |
| **Asynchronous** | 비동기 요청 후 별도의 완료 대기 호출에서 대기 | 요청을 제출하고 다른 작업을 진행하다 완료 결과 처리 |

### ① 동기 + Blocking

```text
Application → read() ── 대기 ── 데이터 준비·복사 ── 반환
```

전형적인 Blocking Socket `read()` 예시다. 데이터가 없으면 호출한 Thread가 기다린다.

### ② 동기 + Non-blocking

```text
Application → read() → EAGAIN (즉시 반환)
            → 다른 처리 / 준비 확인
            → read() 재시도 → 데이터 획득
```

각 호출은 대기하지 않지만, 애플리케이션이 읽기를 다시 시도해 결과를 얻는다. 반복 호출을 쉬지 않고 수행하면 Busy Polling이 될 수 있으므로 실제 서버에서는 `epoll` 같은 준비 이벤트를 이용한다.

### ③ 비동기 + Blocking

```text
Application → 비동기 I/O 요청 제출 → 즉시 반환
            → 완료 대기 API 호출 ── 대기 ── 완료 결과 수신
```

**비동기 작업 자체**와 **완료를 기다리는 호출**을 구분한 조합이다. 비동기 요청을 했더라도 나중에 `wait` 성격의 API에서 Blocking할 수 있다. 하나의 호출이 동시에 '즉시 반환'하고 '대기'한다는 뜻이 아니다.

### ④ 비동기 + Non-blocking

```text
Application → 비동기 I/O 요청 제출 → 다른 작업
OS / Runtime → 작업 완료 이벤트 전달
Application → 완료 결과 처리
```

예를 들어 `io_uring`에 작업을 제출하고 다른 일을 진행한 뒤 Completion Queue의 결과를 처리할 수 있다. 단, `io_uring`의 모든 연산이 항상 완전한 비차단 실행을 보장하는 것은 아니다.

**복원 단서:** 동기/비동기는 *요청·완료 처리 관계*, Blocking/Non-blocking은 *개별 호출의 대기 여부*다.

## 3. Readiness와 Completion은 4분면과 다른 축

```text
Readiness 기반
  준비 이벤트 → Application이 read/write 시도
  예: select / poll / epoll

Completion 기반
  I/O 요청 제출 → OS가 처리 → 완료 결과 확인
  예: IOCP / io_uring Completion Queue
```

Readiness는 **작업이 완료되었다**는 뜻이 아니다. 반대로 Completion은 **제출한 작업의 완료**를 의미한다. `epoll_wait()`는 준비 이벤트를 기다리며 Blocking할 수 있고, 비동기 Completion API도 완료를 기다리는 호출을 제공할 수 있다.

따라서 **Readiness = 동기, Completion = 비동기**로 외우지 않는다.

## 4. 하드웨어 I/O와의 경계

```text
Application → Blocking / Non-blocking · Sync / Async · Readiness / Completion
                     ↓
                OS / Driver
                     ↓
Hardware → MMIO(장치 접근) · DMA(데이터 전송) · Interrupt/Polling(상태 확인)
```

소프트웨어의 Completion과 하드웨어의 Interrupt는 다른 계층의 개념이다. DMA가 데이터를 전송했다고 애플리케이션에 곧바로 Completion이 전달되는 것도 아니다. OS와 Runtime의 후속 처리가 개입할 수 있다.

## 5. 이해 복원

1. 동기/비동기와 Blocking/Non-blocking은 각각 어떤 질문에 답하는가?
2. 비동기 I/O 요청을 사용하면서도 Blocking이 발생할 수 있는 이유는?
3. Non-blocking Socket을 반복 호출하는 것과 `epoll`을 이용하는 것의 차이는?
4. Readiness 이벤트를 받았는데도 실제 `read()`가 끝나지 않은 이유는?
5. DMA·Interrupt와 소프트웨어 Completion은 왜 같은 계층의 개념이 아닌가?

**복원 문장:** 호출 대기(Blocking) · 요청/완료 관계(Sync/Async) · 이벤트 의미(Readiness/Completion)를 구분한다.

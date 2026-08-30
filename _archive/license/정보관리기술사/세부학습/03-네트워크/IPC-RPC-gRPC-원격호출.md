# IPC, RPC, gRPC와 원격 호출

## 1. 핵심 개념

프로세스는 독립된 주소 공간을 가지므로 다른 프로세스의 함수를 직접 호출할 수 없다. 프로세스 경계를 넘으려면 데이터를 전달할 통신 메커니즘이 필요하며, 같은 시스템에서는 IPC를 사용할 수 있고 네트워크를 통해 다른 시스템과도 통신할 수 있다.

핵심 관계는 다음과 같다.

```text
RPC
= 원격 기능을 함수 호출처럼 사용하기 위한 추상화
        ↓
요청/응답, 직렬화, Stub/Proxy
        ↓
IPC 또는 Network Transport
        ↓
Socket / Pipe / Message Queue / ...
```

> IPC는 프로세스 사이의 데이터 전달 문제를 다루고, RPC는 그 통신을 원격 함수 호출이라는 프로그래밍 모델로 추상화한다.

---

## 2. IPC(Inter-Process Communication)

IPC는 서로 다른 프로세스가 데이터를 교환하기 위한 운영체제 수준의 통신 메커니즘을 총칭한다.

대표 수단은 다음과 같다.

| 수단 | 특징 |
|---|---|
| Pipe | 단순한 스트림 기반 프로세스 통신 |
| Unix Domain Socket | 같은 시스템에서 Socket 인터페이스를 이용한 프로세스 통신 |
| Message Queue | 메시지 단위 비동기 통신 |
| Shared Memory | 메모리 영역을 공유하여 고속 데이터 교환 |

Socket은 IPC 전용 수단이 아니다. Unix Domain Socket은 로컬 IPC에 사용할 수 있고, TCP/UDP Socket은 네트워크를 통한 다른 시스템의 프로세스와 통신하는 데 사용할 수 있다.

```text
Socket API
   ├─ Unix Domain Socket → 같은 시스템의 Process
   └─ TCP/UDP Socket     → 네트워크상의 Process
```

따라서 `IPC = Socket`도 아니고 `Socket = 네트워크 계층`도 아니다. Socket은 애플리케이션이 커널의 통신 기능을 사용하는 프로그래밍 인터페이스/통신 endpoint 추상화다.

---

## 3. IPC를 직접 사용할 때의 문제

IPC 자체는 데이터를 전달해 주지만 그 데이터가 어떤 기능을 의미하는지는 애플리케이션이 정의해야 한다.

```text
Process A

{ requestId: 17, type: "GET_USER", id: 10 }
        ↓
       IPC
        ↓
Process B

GET_USER 판별
→ getUser(10) 실행
→ 응답 메시지 생성
```

규모가 커지면 다음을 직접 설계해야 한다.

```text
메시지 규격
→ 직렬화/역직렬화
→ 요청 종류 판별
→ 요청/응답 매칭
→ 오류 처리
→ Timeout
→ 취소 처리
```

RPC는 이러한 통신 과정을 더 높은 수준에서 추상화한다.

---

## 4. RPC(Remote Procedure Call)

RPC는 다른 프로세스 또는 다른 시스템의 기능을 로컬 함수처럼 호출할 수 있도록 만드는 원격 호출 모델이다.

호출자는 다음과 같이 사용할 수 있다.

```text
user = client.getUser(10)
```

하지만 실제로 상대 프로세스의 메모리에 있는 함수를 직접 호출하는 것은 아니다.

```text
Client Process                         Server Process

client.getUser(10)
       │
       ▼
 Client Stub / Proxy
       │
       │ 요청 생성 + 직렬화
       ▼
 IPC / Network Transport
       │
       └──────────────────────────────→ RPC Server
                                           │
                                           ▼
                                      getUser(10)
                                           │
                                           ▼
                                         User
       ←───────────────────────────────────┘
       │
       ▼
 역직렬화 후 반환
```

즉 RPC의 본질은 다음과 같다.

> 함수 호출을 메시지 교환으로 변환하고, 그 메시지 교환 과정을 다시 함수 호출처럼 보이게 하는 추상화다.

---

## 5. Client Stub / Proxy

RPC 호출자에는 일반적으로 Client Stub 또는 Proxy가 존재한다.

```text
Application
    │
    │ getUser(10)
    ▼
Client Stub / Proxy
    ├─ 요청 메시지 생성
    ├─ 직렬화
    ├─ 전송
    ├─ 응답 대기
    └─ 역직렬화
```

서버 측에는 요청을 실제 구현에 연결하는 Server Stub/Handler가 존재한다.

```text
Client                         Server

Application                    Service Logic
    ↓                              ↑
Client Stub                   Server Stub
    │                              ↑
    └──── IPC / Network ────────────┘
```

따라서 호출자는 통신 세부사항보다 서비스 인터페이스에 집중할 수 있다.

---

## 6. RPC Server의 동작

RPC Server도 웹 서버처럼 요청을 받을 endpoint를 열고 수신 대기한다.

```text
RPC Client                         RPC Server

client.add(10, 20)
      │
      │ Request
      ├──────────────────────────→ 수신
      │                              ↓
      │                          add(10,20)
      │                              ↓
      │                             30
      │ Response                     │
      ←──────────────────────────────┘
```

같은 시스템이라면 Unix Domain Socket 등의 IPC를 사용할 수 있고, 다른 시스템이라면 TCP 기반 네트워크 통신 등을 사용할 수 있다.

따라서 IPC와 RPC는 경쟁 관계가 아니다.

```text
RPC        : 어떤 프로그래밍 모델로 통신할 것인가
IPC/Network: 프로세스 사이 데이터를 어떻게 전달할 것인가
```

---

## 7. RPC의 장점과 한계

### 장점

- 원격 통신을 함수/메서드 호출 모델로 단순화
- 명확한 Interface Contract 정의 가능
- Client/Server Stub 자동 생성 가능
- 직렬화/역직렬화 자동화
- 요청/응답 매칭, Timeout, 오류, 취소 등 공통 기능 제공
- IDL 기반 구현에서는 서로 다른 언어 간 호출 지원 가능

### 한계

- 실제 호출은 로컬 함수가 아니므로 네트워크 지연과 실패 가능성이 존재
- 직렬화/역직렬화 비용 발생
- 서버 장애와 네트워크 단절을 고려해야 함
- 인터페이스 버전 및 호환성 관리 필요
- 단순한 로컬 IPC에 무거운 RPC Framework를 도입하면 과설계가 될 수 있음

특히 RPC 호출은 코드상 함수 호출처럼 보여도 분산 시스템 호출이라는 사실을 잊으면 안 된다.

---

## 8. REST와 RPC 비교

REST와 RPC는 모두 원격 시스템에 요청을 보내고 응답을 받는 Client-Server 통신 방식으로 활용할 수 있다. 차이는 주로 외부에 노출하는 인터페이스 모델에 있다.

| 구분 | REST | RPC |
|---|---|---|
| 중심 개념 | Resource | Procedure / Method |
| 호출 표현 | `GET /users/10` | `getUser(10)` |
| 인터페이스 | URI + HTTP Method | Service + Method |
| 대표 계약 | OpenAPI | IDL, `.proto` 등 |
| 목적 | 자원의 상태 표현·조작 | 원격 기능 호출 |

REST의 예:

```text
GET    /users/10
POST   /users
DELETE /users/10
```

RPC의 예:

```text
getUser(10)
createUser(...)
deleteUser(10)
```

REST는 HTTP를 활용하는 아키텍처 스타일이고, RPC는 원격 기능을 함수 호출처럼 표현하는 통신 모델이다. 따라서 REST와 RPC를 OSI 계층의 서로 다른 프로토콜처럼 단순 치환해서는 안 된다.

---

## 9. gRPC

gRPC는 RPC 모델을 구현한 대표적인 프레임워크다. 일반적으로 Protocol Buffers를 인터페이스 정의 및 메시지 직렬화에 사용하고 HTTP/2 기반으로 통신한다.

```text
RPC                  개념 / 통신 모델
 ↓
gRPC                 구체적인 RPC Framework
 ├─ Protocol Buffers
 ├─ Service Contract
 ├─ Client/Server Stub 생성
 └─ HTTP/2 기반 통신
```

서비스 계약은 `.proto` 파일로 정의할 수 있다.

```protobuf
service UserService {
  rpc GetUser(GetUserRequest)
      returns (GetUserResponse);
}
```

이를 기반으로 Client/Server Stub을 생성할 수 있다.

```text
             user.proto
                 │
         ┌───────┴───────┐
         ▼               ▼
    Client Stub      Server Stub
         │               │
 getUser(10) ────────────→│
         │           Service 실행
         │←────────────── │
       User
```

---

## 10. gRPC와 네트워크 계층

gRPC를 `HTTP 대신 사용하는 L7 프로토콜`이라고 단순하게 이해하면 정확하지 않다. gRPC는 일반적으로 HTTP/2를 사용한다.

```text
Application
    ↓
gRPC / RPC Semantics
    ↓
HTTP/2
    ↓
TCP
    ↓
IP
    ↓
Data Link / Physical
```

애플리케이션에서 실제 네트워크 기능을 사용할 때는 Socket API와 운영체제의 Network Stack이 관여한다.

```text
Application
    ↓
gRPC
    ↓
HTTP/2
    ↓
TCP
    ↓
Socket API
    ↓
Kernel Network Stack
    ↓
NIC / Network
```

OSI/TCP-IP 계층은 통신 기능을 역할별로 설명하는 모델이고, Network Stack은 그 프로토콜들을 실제 시스템에서 구현한 구조이며, Socket API는 애플리케이션이 그 통신 기능을 사용하는 인터페이스다.

---

## 11. REST 대신 gRPC를 선택하는 이유

gRPC는 특히 내부 서비스 간 통신에서 다음 특성이 유리할 수 있다.

```text
.proto 기반 계약
      ↓
강한 타입
      ↓
Client/Server 코드 생성
      ↓
Protocol Buffers 직렬화
      ↓
HTTP/2 + Streaming
```

대표적인 장점은 다음과 같다.

- 명시적인 서비스 및 메시지 계약
- 다양한 언어의 Stub 생성
- 바이너리 직렬화를 통한 효율적인 메시지 표현
- Unary, Client Streaming, Server Streaming, Bidirectional Streaming 지원

반면 REST는 HTTP/JSON 생태계를 활용하기 쉽고 사람이 읽기 쉬우며 브라우저, curl, Proxy, Gateway 등 범용 웹 도구와 결합하기 편하다.

따라서 시스템에 따라 다음과 같은 구조를 사용할 수 있다.

```text
Browser / External Client
          ↓
      REST / HTTP
          ↓
      Application
          ↓
         gRPC
          ↓
   Internal Service
```

이는 절대적인 규칙이 아니라 요구사항에 따른 선택이다.

---

## 12. RPC 보안

RPC Server를 네트워크에 공개하면 외부에서 접근 가능한 API endpoint가 생기는 것이므로 보안 경계가 형성된다.

```text
Untrusted Network
       ↓
   RPC Endpoint
       ↓
Authentication
       ↓
Authorization
       ↓
RPC Method
```

주요 고려사항은 다음과 같다.

- TLS를 통한 전송구간 보호
- Authentication
- Method/Resource 단위 Authorization
- 입력값 검증
- Rate Limiting
- Firewall / Network Policy
- Audit Logging
- 외부에 공개할 Method 최소화

인터페이스를 외부에 공개할수록 공격 표면도 증가하므로 확장성과 보안 경계를 함께 설계해야 한다.

---

## 13. 기술사 관점 핵심 비교

```text
Protocol / Layer Model
= 통신 역할과 규약을 설명

Network Stack
= 프로토콜을 실제 시스템에 구현

Socket API
= Application이 커널 통신 기능을 사용하는 인터페이스

IPC
= 프로세스 사이의 데이터 전달 메커니즘

RPC
= 프로세스/네트워크 경계를 함수 호출처럼 추상화

gRPC
= RPC를 구현한 대표 Framework
```

관계를 한 번에 보면 다음과 같다.

```text
Application Logic
       ↓
RPC / REST 등 Application-level Model
       ↓
gRPC / HTTP 등 구체 기술
       ↓
Transport Protocol
       ↓
Socket API
       ↓
Kernel Network Stack
       ↓
Network
```

같은 시스템 내부에서는 네트워크 대신 IPC 경로가 사용될 수도 있다.

```text
Application
    ↓
RPC
    ↓
IPC
    ↓
Unix Domain Socket 등
    ↓
Kernel
    ↓
Other Process
```

---

## 14. 답안용 핵심 문장

> **IPC는 독립된 주소 공간을 갖는 프로세스 간 데이터 교환을 위한 통신 메커니즘이며, RPC는 IPC 또는 네트워크 통신의 복잡성을 추상화하여 원격 프로시저를 로컬 함수처럼 호출할 수 있도록 하는 분산 통신 모델이다.**

> **gRPC는 Protocol Buffers 기반 인터페이스 계약과 Stub 생성, HTTP/2 기반 전송 및 Streaming을 제공하는 대표적인 RPC Framework로, 명확한 계약과 효율적인 서비스 간 통신이 요구되는 분산 시스템에 활용된다.**

> **Socket은 OSI 계층 자체가 아니라 애플리케이션이 운영체제의 네트워크/IPC 기능을 사용하는 인터페이스 및 통신 endpoint 추상화이며, 프로토콜 계층과 구현 수단을 구분하여 이해해야 한다.**

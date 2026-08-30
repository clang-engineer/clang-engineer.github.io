---
title       : "Socket API와 네트워크 스택 이해하기"
description : "Socket API가 애플리케이션과 OS 커널 네트워크 스택 사이에서 어떤 역할을 하는지 HTTP, TCP/IP, MAC 주소와 함께 정리한다."
date        : 2026-08-30 18:40:00 +0900
updated     : 2026-08-30 18:40:00 +0900
categories  : [network]
tags        : [socket, tcp, udp, http, network, osi]
pin         : false
hidden      : false
---

네트워크를 공부하다 보면 Socket을 TCP/IP 계층 중 하나처럼 생각하기 쉽다.

하지만 Socket과 TCP/IP는 같은 종류의 개념이 아니다.

핵심부터 정리하면 다음과 같다.

> **HTTP, TCP, IP, Ethernet은 통신의 규약과 역할을 정의하고, Socket API는 애플리케이션이 OS의 통신 기능을 사용하기 위한 인터페이스다.**

## OS가 실제 네트워크 통신을 처리한다

일반적인 애플리케이션은 TCP/IP를 직접 구현하지 않는다.

```text
Application
     │
     ▼
OS Kernel
 ├─ TCP / UDP
 ├─ IP
 ├─ Ethernet
 └─ Network Driver
     │
     ▼
    NIC
```

TCP의 연결 관리, 순서 보장, 재전송, 흐름 제어와 IP 처리 등의 기능은 일반적으로 OS 커널의 네트워크 스택이 담당한다.

애플리케이션은 이 기능을 사용하기 위한 인터페이스가 필요하다.

그 역할을 하는 것이 Socket API다.

## Socket API

애플리케이션은 다음과 같은 API를 이용해 커널의 통신 기능을 사용한다.

```text
socket()
connect()
send()
recv()
close()
    │
    ▼
────── Socket API ──────
    │
    ▼
Kernel Network Stack
```

따라서 Socket API는 다음과 같이 이해할 수 있다.

> **Socket API = 애플리케이션이 OS 커널의 네트워크 및 IPC 기능을 사용하기 위한 추상 인터페이스**

## Socket API와 Socket은 다르다

`socket()`을 호출한다고 생각해 보자.

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);
```

각 요소의 의미는 다음과 같다.

```text
socket()    Socket API의 함수
    ↓
Kernel이 Socket 생성
    ↓
fd          해당 Socket을 가리키는 handle
```

즉 다음 세 개를 구분할 수 있다.

```text
Socket API = socket을 생성하고 조작하는 인터페이스
Socket     = Kernel이 관리하는 통신 endpoint
fd         = Application이 해당 socket을 가리키는 handle
```

Unix 계열에서는 socket 역시 file descriptor를 통해 다룬다.

파일과 비교하면 이해하기 쉽다.

```text
File                         Network

open()                       socket()
read()                       recv()
write()                      send()
close()                      close()

   ↓                            ↓
File Descriptor             File Descriptor
   ↓                            ↓
Kernel File Object          Kernel Socket
```

## Socket과 TCP는 같은 개념이 아니다

TCP는 통신 프로토콜이고 Socket은 통신 기능을 사용하는 인터페이스와 endpoint 추상화다.

```text
Application
     │
 Socket API
     │
     ▼
TCP / UDP
     ↓
IP
     ↓
Ethernet
```

따라서 TCP socket과 UDP socket을 모두 만들 수 있다.

```text
             Socket API
             /        \
          TCP          UDP
```

또한 Unix Domain Socket처럼 TCP/IP를 사용하지 않으면서 socket이라는 추상화를 사용하는 방식도 있다.

따라서 다음과 같이 이해하면 안 된다.

```text
Socket = TCP
```

Socket은 TCP보다 더 일반적인 통신 endpoint 추상화다.

## HTTP와 Socket의 관계

HTTP는 애플리케이션 간에 어떤 형식으로 메시지를 주고받을 것인지 정의한 프로토콜이다.

예를 들어 HTTP 요청은 다음과 같은 규약을 따른다.

```text
GET /users HTTP/1.1
Host: example.com
```

하지만 이 데이터를 실제 다른 컴퓨터까지 전달할 수단이 필요하다.

전통적인 HTTP/1.1과 HTTP/2에서는 TCP 연결을 사용한다.

```text
HTTP
 ↓
TCP Socket
 ↓
TCP
 ↓
IP
 ↓
Ethernet
```

Socket은 HTTP의 의미를 알 필요가 없다.

```text
"GET /users HTTP/1.1"

Socket 관점
→ HTTP인지 알 필요 없음
→ byte 데이터로 취급
→ OS의 통신 기능을 통해 전달
```

따라서 HTTP와 Socket의 관계는 **규약과 수단**으로 생각할 수 있다.

```text
HTTP       = 어떤 형식으로 대화할 것인가
Socket API = OS의 통신 기능을 어떻게 사용할 것인가
TCP        = 데이터를 어떻게 신뢰성 있게 전달할 것인가
IP         = 목적지까지 어떻게 전달할 것인가
```

## Axios는 어디에 있는가

JavaScript에서 Axios를 사용할 경우 개발자는 훨씬 높은 수준의 API를 사용한다.

```js
axios.get("/users");
```

개념적으로 아래와 같은 계층을 거친다.

```text
Application Code
      ↓
    Axios
      ↓
     HTTP
      ↓
 Socket API
      ↓
     TCP
      ↓
      IP
      ↓
  Ethernet
      ↓
     NIC
```

실제 브라우저나 Node.js 구현에는 추가 계층이 존재하지만, 전체적인 추상화 관계를 이해하기에는 이 정도로 충분하다.

Axios는 Socket 자체를 직접 대체하는 것이 아니라 HTTP 요청을 편리하게 사용할 수 있도록 더 높은 수준의 추상화를 제공한다.

## Socket은 OSI 몇 계층인가

Socket을 OSI 7계층 중 하나에 직접 배치하려고 하면 혼란이 생긴다.

OSI 모델과 Socket API는 서로 다른 관점의 개념이기 때문이다.

```text
[Network Protocol / Role]

HTTP              Application
 ↓
TCP               Transport
 ↓
IP                Network
 ↓
Ethernet          Data Link


[Programming Interface]

Application
     │
 Socket API
     │
Kernel Network Stack
```

OSI/TCP-IP 모델은 네트워크 통신의 기능과 프로토콜을 역할별로 나눈 모델이다.

Socket API는 애플리케이션이 OS의 네트워크 기능을 사용하기 위한 프로그래밍 인터페이스다.

따라서 Socket을 L4 또는 L7 프로토콜이라고 분류하는 것은 적절하지 않다.

다만 일반적인 TCP/UDP 애플리케이션 구조를 설명할 때는 다음처럼 Application과 Transport 사이의 경계에 Socket API를 표시할 수 있다.

```text
Application
    HTTP
      │
====== Socket API ======
      │
     TCP
      ↓
      IP
      ↓
  Ethernet
```

여기서 Socket API가 별도의 OSI Layer라는 의미는 아니다.

## MAC 주소는 누가 처리하는가

TCP socket을 사용하는 일반적인 애플리케이션은 MAC 주소를 직접 처리할 필요가 없다.

예를 들어 애플리케이션이 같은 네트워크의 다음 주소로 연결한다고 하자.

```text
192.168.0.20:5432
```

대략적인 흐름은 다음과 같다.

```text
Application
     │
   send()
     ↓
Socket
     ↓
TCP
     ↓
IP
     ↓
ARP 등으로 next-hop MAC 확인
     ↓
Ethernet Frame
     ↓
NIC
```

MAC 주소 확인과 Ethernet frame 생성은 일반적으로 커널 네트워크 스택과 드라이버가 처리한다.

따라서 애플리케이션 개발자는 MAC 주소를 몰라도 TCP/IP 통신을 할 수 있다.

## 서로 다른 컴퓨터 사이의 통신

두 컴퓨터의 프로그램이 TCP/IP로 통신한다고 생각해 보자.

```text
Computer A                        Computer B

Application                      Application
     │                                ↑
 Socket API                        Socket API
     │                                ↑
    TCP ──────────────────────────── TCP
     ↓                                ↑
     IP ───────────────────────────── IP
     ↓                                ↑
 Ethernet ───── Physical Network → Ethernet
```

여기서 중요한 것은 **Socket 자체가 네트워크를 통해 상대 컴퓨터로 이동하는 것이 아니라는 점**이다.

A의 Socket은 A의 OS에 존재하고 B의 Socket은 B의 OS에 존재한다.

서로 다른 운영체제와 프로그램이 통신할 수 있게 만드는 것은 Socket 자체가 아니라 양쪽이 이해하는 공통 프로토콜이다.

```text
Linux Application        Windows Application
        │                         │
     Socket                    Socket
        │                         │
        └──── TCP / IP / HTTP ────┘
              공통 규약
```

Socket은 각 운영체제에서 그 통신 기능을 사용할 수 있게 해주는 로컬 인터페이스다.

## 같은 컴퓨터에서도 Socket을 사용할 수 있다

Socket은 반드시 서로 다른 컴퓨터 사이에서만 사용하는 것은 아니다.

같은 머신의 프로세스끼리는 Unix Domain Socket 등을 사용할 수 있다.

```text
Process A
    ↓
Unix Domain Socket
    ↓
Process B
```

이 경우 IP나 TCP를 사용하지 않더라도 Socket이라는 endpoint 추상화는 그대로 사용할 수 있다.

이 때문에 Socket 자체를 TCP/IP의 특정 계층으로 보는 것은 적절하지 않다.

## 일반적인 네트워크 통신은 대부분 Socket을 사용한다

일반적인 OS 기반 애플리케이션의 IP 네트워크 통신은 대부분 Socket API를 통해 이루어진다고 생각해도 된다.

```text
HTTP / HTTPS
SSH
PostgreSQL
DNS
WebSocket
...
      ↓
 Socket API
      ↓
 TCP / UDP
      ↓
     IP
```

다만 모든 네트워크 통신이 반드시 일반 Socket API를 거쳐야 하는 것은 아니다.

Raw packet interface, DPDK, RDMA 등 일반적인 커널 Socket 경로와 다른 방식도 존재한다.

따라서 정확한 표현은 다음과 같다.

> **Socket API는 일반 애플리케이션이 OS의 네트워크 스택을 사용하는 표준적인 인터페이스다.**

## 추상화 관점에서 보기

Socket API 역시 소프트웨어에서 반복적으로 등장하는 추상화 구조의 한 사례다.

```text
Application
     ↓
Socket API
     ↓
Kernel Network Stack
```

애플리케이션은 TCP 재전송이나 Ethernet frame 생성 같은 내부 구현을 알 필요가 없다.

공개된 Socket API라는 계약만 사용한다.

이 구조는 Plugin Architecture에서 다음과 같은 관계와 비슷한 설계 원리를 가진다.

```text
Plugin
   ↓
Plugin API
   ↓
Application Core
```

두 기술이 동일하다는 의미는 아니다.

공통점은 **복잡한 내부 구현을 숨기고 외부에는 안정적인 인터페이스를 제공한다**는 추상화 원칙이다.

## 정리

전체 구조를 한 장으로 정리하면 다음과 같다.

```text
                Application
                     │
            Axios / HTTP Client
                     │
                   HTTP
                     │
            ===== Socket API =====
                     │
                 OS Kernel
                     │
                   TCP
                     │
                    IP
                     │
                Ethernet
                     │
                    NIC
                     │
                  Network
```

핵심은 두 종류의 개념을 구분하는 것이다.

```text
HTTP / TCP / IP / Ethernet
→ 네트워크에서 어떤 규칙과 역할로 통신하는가

Socket API
→ 애플리케이션이 OS의 통신 기능을 어떻게 사용하는가
```

즉 **Layer는 통신의 기능과 규약을 설명하는 모델이고, Socket API는 그 통신 기능을 프로그램에서 사용하기 위한 도구**라고 이해하면 된다.

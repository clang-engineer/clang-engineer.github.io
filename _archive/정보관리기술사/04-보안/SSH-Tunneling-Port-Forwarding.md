# SSH Tunneling — Port Forwarding과 Channel

## 이 문서에서 되짚을 질문

- SSH Tunneling은 단순한 "포트 우회"인가?
- SSH에서 다른 TCP Connection을 전달할 수 있는 이유는 무엇인가?
- `-L`, `-R`, `-D`는 무엇을 기준으로 구분하는가?
- Listen 위치와 Target Connection이 나가는 위치는 어떻게 다른가?
- Tunnel을 만들었다고 최종 Service 인증까지 해결되는가?
- SSH Tunnel은 VPN과 같은 것인가?

## 1. 먼저 전체 위치를 잡는다

SSH는 안전한 원격 로그인만 제공하는 Protocol이 아니다.

SSH 내부에는 암호화된 연결 위에서 여러 기능을 제공하기 위한 구조가 있다.

```text
SSH
├─ Transport
│    └─ 키 교환·암호화·무결성·Server 인증
│
├─ Authentication
│    └─ 사용자 인증
│
└─ Connection
     └─ 여러 Channel
          ├─ Shell / Command
          └─ TCP Connection 전달
                 ↓
            SSH Tunneling
                 ├─ Local  -L
                 ├─ Remote -R
                 └─ Dynamic -D
```

여기서 `SSH Transport Layer`는 OSI Transport Layer(L4)가 아니라 **SSH Protocol 내부 계층 이름**이다.

이 문서의 핵심은 Connection Layer 아래로 내려간다.

```text
SSH 연결
   ↓
Connection Layer
   ↓
Channel
   ↓
다른 TCP Connection 전달
   ↓
SSH Tunneling
```

## 2. SSH Tunneling — 암호화된 SSH Channel을 길로 사용한다

먼저 SSH 연결이 만들어진다.

그 뒤 SSH Connection Layer는 하나의 연결 안에 여러 논리 Channel을 만들 수 있다.

Port Forwarding은 그 Channel을 이용해 **다른 TCP Connection의 Data를 SSH 연결 안으로 전달하는 기능**이다.

```text
Application
   ↓
[Listen = Tunnel 입구]
   ↓
===== SSH Channel =====
   ↓
[Target으로 연결 = Tunnel 출구]
   ↓
Target Service
```

따라서 세 옵션의 차이는 암호화 방식이 아니다.

다음 두 질문으로 복원한다.

```text
1. 어느 쪽에서 Listen할까?
2. 최종 Target Connection은 어느 쪽에서 만들까?
```

## 3. Local Forwarding `-L`

Local PC에 Listen Socket을 만들고, SSH Server 쪽에서 Target으로 연결한다.

```bash
ssh -N -L 35432:db.internal:5432 user@bastion
```

```text
Application
  ↓ localhost:35432
Local SSH Client가 Listen
  ↓
===== SSH Channel =====
  ↓
Bastion SSH Server
  ↓ db.internal:5432로 연결
Internal DB
```

Application이 보는 Destination과 실제 Target을 분리한다.

```text
Application이 보는 Destination
→ localhost:35432

SSH Server가 실제로 연결하는 Destination
→ db.internal:5432
```

따라서 `db.internal`은 기본적으로 **SSH Server가 있는 쪽에서 접근 가능한 주소**다.

대표 용도는 Bastion 뒤의 DB·Web Service 접근이다.

## 4. Remote Forwarding `-R`

Remote SSH Server 쪽에 Listen Socket을 만들고, SSH Client 쪽에서 Target으로 연결한다.

```bash
ssh -N -R 8080:localhost:3000 user@remote-server
```

```text
remote-server:8080
  ↓ SSH Server가 Listen
===== SSH Channel =====
  ↓
Local SSH Client
  ↓ localhost:3000
Local Application
```

즉 `-L`과 방향이 뒤집힌다.

```text
-L
Local에서 들어와 Remote 쪽 Target으로 나감

-R
Remote에서 들어와 Local 쪽 Target으로 나감
```

Remote Forward를 외부 Interface에 공개하면 개인용 Tunnel이 아니라 외부 접근 가능한 Service Entry Point가 될 수 있다.

Remote의 **어느 주소에 Listen하는지**도 함께 본다.

```text
127.0.0.1:8080
→ Remote Server 자신만 접근 가능한 입구

0.0.0.0:8080
→ 여러 Network Interface에서 연결을 받을 수 있는 입구
→ 실제 외부 접근은 GatewayPorts, Firewall 등의 정책에도 영향받음
```

여기서는 다음 정도만 기억한다.

```text
Bind
→ 어느 주소에 입구를 만들지 결정

Listen
→ 그 주소·Port에서 연결을 기다림
```

즉 `-R`에서는 **Remote에 입구를 만든다**에서 끝나지 않고, 그 입구가 Loopback에만 열리는지 외부 Interface에도 열리는지를 구분한다.

## 5. Dynamic Forwarding `-D`

Local PC에 SOCKS Proxy를 만들고 Application이 요청한 목적지로 SSH Server 쪽에서 연결한다.

```bash
ssh -N -D 1080 user@remote-server
```

```text
SOCKS 지원 Application
  ↓ localhost:1080
SSH Client
  ↓
===== SSH Channel =====
  ↓
SSH Server
  ↓ 요청마다 다른 Target
Target
```

`-L`은 Target이 명령 실행 시 고정되지만 `-D`는 SOCKS 요청마다 목적지가 달라질 수 있다.

### Dynamic의 의미 — 내부망 여러 목적지를 Proxy 하나로 접근

`Dynamic`은 "모든 Port를 한꺼번에 Forward한다"는 뜻이 아니다. **Tunnel을 만들 때 최종 Target을 고정하지 않고, Application이 SOCKS 요청마다 Target Host와 Port를 지정한다**는 의미다.

```text
-L

localhost:15432
      ↓
SSH Channel
      ↓
db.internal:5432

→ Target 고정
```

반면 `-D`는:

```text
Application
     ↓
localhost:1080
SOCKS Proxy 하나
     ↓
===== SSH Channel =====
     ↓
Bastion
     ├─→ 10.0.0.10:8080
     ├─→ 10.0.0.20:3000
     ├─→ 10.0.0.30:9200
     └─→ internal-db:5432

→ SOCKS 요청마다 Target 결정
```

따라서 내 PC에서는 직접 접근할 수 없지만 Bastion에서는 접근 가능한 내부망의 여러 Service가 있다면, `-L`을 Service마다 여러 개 만드는 대신 **SOCKS Proxy 하나를 통해 여러 목적지에 접근**할 수 있다.

```bash
ssh -N -D 1080 user@bastion
```

예를 들어 SOCKS를 지원하는 Client는 같은 Proxy를 사용하면서 목적지만 바꿀 수 있다.

```bash
curl --socks5-hostname 127.0.0.1:1080 http://internal-web:8080
curl --socks5-hostname 127.0.0.1:1080 http://grafana:3000
```

```text
127.0.0.1:1080
→ SOCKS Proxy의 고정된 입구

internal-web:8080 / grafana:3000
→ 각 연결에서 동적으로 지정되는 실제 목적지
```

모든 Network Traffic이 자동으로 Tunnel을 타는 것은 아니며 **Application이 SOCKS Proxy를 사용하도록 설정한 연결만** 이 경로를 사용한다. 이 점이 OS Routing 수준에서 Network Traffic 경로를 구성하는 VPN과의 중요한 차이다.

DNS 이름을 어느 쪽에서 해석하는지도 Proxy 설정 방식에 따라 달라질 수 있다. 예를 들어 내 PC에서는 해석되지 않는 `internal-web` 같은 내부 이름을 사용할 때는 DNS 해석도 Proxy 쪽에서 이루어지도록 하는 설정이 필요할 수 있다.

즉 `-D`는 다음 한 줄로 기억한다.

> **SSH를 통해 Bastion을 출구로 사용하는 Local SOCKS Proxy를 만든다.**

## 6. 세 옵션을 한 축에서 비교한다

| 옵션 | Listen 위치 | Target 연결이 나가는 쪽 | Target | 대표 용도 |
|---|---|---|---|---|
| `-L` | Local | SSH Server 쪽 | 고정 | Bastion 뒤 Service 접근 |
| `-R` | Remote | SSH Client 쪽 | 고정 | Local Service를 Remote에 노출 |
| `-D` | Local SOCKS | SSH Server 쪽 | 요청마다 결정 | 여러 Target을 Proxy 방식으로 접근 |

기억할 때는 Forward 이름보다 **입구와 출구 위치**를 그린다.

```text
-L → Local 입구  → Remote 쪽 출구
-R → Remote 입구 → Local 쪽 출구
-D → Local SOCKS 입구 → Remote 쪽에서 요청별 Target
```

## 7. SSH Tunnel은 VPN과 범위가 다르다

SSH Port Forwarding과 VPN은 모두 다른 Network에 접근하는 데 사용할 수 있지만 적용 범위가 다르다.

```text
SSH Tunnel
→ 특정 TCP Port 또는 SOCKS를 통한 Application Traffic 전달

VPN
→ 일반적으로 IP Routing 수준에서 Network Traffic 경로 구성
```

예를 들어 `-L`은 지정한 Local Port로 들어온 TCP Connection만 전달한다.

```text
localhost:15432 → DB
localhost:8080  → Web

그 외 Traffic
→ 자동으로 SSH Tunnel을 타는 것은 아님
```

따라서 SSH Tunnel을 "간단한 VPN"으로 외우기보다 **SSH Channel을 이용한 선택적 Connection Forwarding**으로 이해한다.

## 8. Tunnel과 인증은 별도 경계다

SSH Tunnel을 만들었다고 최종 Service의 인증·인가가 사라지는 것은 아니다.

```text
SSH Server 인증
→ 접속한 SSH Host가 맞는가?

SSH 사용자 인증
→ 이 사용자가 SSH에 로그인해도 되는가?

SSH Forwarding
→ Tunnel을 사용할 수 있는가?

DB / Web 인증
→ 최종 Service에 접근해도 되는가?
```

또한 Forwarding 자체는 `AllowTcpForwarding` 같은 sshd 정책의 영향을 받고, Listen Address에 따라 외부 노출 범위도 달라질 수 있다.

## 9. Bastion과 주변 관문 용어

SSH Tunneling을 실제 환경에서 보면 Bastion, Jump Host 같은 용어가 자주 함께 나온다.

먼저 공통 그림을 잡는다.

```text
외부 사용자
    │
    ▼
[접근 관문]
Bastion / Jump Host
    │
    ▼
Private Network
    ├─ App Server
    └─ DB Server
```

### Bastion Host

외부에서 내부 Network로 접근할 때 **접근을 집중·통제하기 위한 관문 Host**다.

내부 Server를 Internet에 직접 노출하지 않고 Bastion에 대한 접근만 허용한 뒤, 그 지점을 통해 내부로 들어가도록 구성할 수 있다.

```text
Internet
   │
   ▼
Bastion
   │
   ├─ Internal App
   └─ Internal DB
```

Bastion은 Tunnel 자체가 아니다. **보안상 통제된 진입점이라는 역할**을 가리킨다.

### Jump Host / Jump Server

최종 Server에 직접 접속하지 않고 **중간 Host를 거쳐 다음 Host로 넘어갈 때 사용하는 중계 Host**라는 의미에 초점이 있다.

실무에서는 Bastion이 Jump Host 역할을 하는 경우가 많아 두 용어가 비슷하게 사용되기도 한다.

```text
Bastion
→ 보안 관문이라는 역할에 초점

Jump Host
→ 다른 Host로 넘어가기 위한 중계에 초점
```

### ProxyJump `-J`

SSH 자체에도 Jump Host를 경유해 최종 SSH Server로 접속하는 기능이 있다.

```bash
ssh -J user@bastion user@internal-server
```

```text
Local SSH Client
      ↓
   Bastion
      ↓
Internal SSH Server
```

이것은 `-L`처럼 내부 DB Port를 Local Port로 Forward하는 것과 목적이 다르다.

```text
ProxyJump
→ 다른 SSH Server로 접속하기 위한 SSH 경유

Local Forwarding
→ SSH Channel을 이용해 다른 TCP Service를 전달
```

### 주변 관문 개념과 구분

```text
Bastion / Jump Host
→ 사람이 내부 Server에 접근하는 관문

VPN Gateway
→ Network Traffic이 Private Network로 들어가는 VPN 종단점

Reverse Proxy
→ HTTP Request가 내부 Application으로 들어가는 관문

DMZ
→ 외부 노출 시스템을 내부망과 분리해 배치할 수 있는 Network 영역
```

Gateway는 이보다 더 일반적인 용어로, 서로 다른 Network 사이에서 Traffic을 전달하는 장치나 기능을 가리킬 수 있다.

따라서 `Bastion = Gateway = Reverse Proxy`처럼 같은 개념으로 묶지 않고 **무엇의 관문인가**를 기준으로 구분한다.

## 10. Tunnel 진단 순서

```text
1. SSH 로그인 자체가 되는가?
2. Forward Listen Socket이 열렸는가?
3. Target Host를 출구 쪽에서 해석할 수 있는가?
4. 출구에서 Target Port까지 TCP 연결 가능한가?
5. 최종 Service Protocol과 인증이 정상인가?
```

예:

```bash
ssh -vvv -N -L 15432:db.internal:5432 user@bastion
```

Local Listen은 `ss`, `lsof` 등으로 확인한다.

## 11. 기술사 관점 핵심 경계

```text
SSH Transport
→ 안전한 SSH 연결 기반

SSH Authentication
→ 사용자 인증

SSH Connection
→ 여러 Channel 제공

SSH Tunneling
→ Channel을 이용해 다른 TCP Connection 전달

VPN
→ IP Routing 수준의 더 넓은 Network Traffic 경로
```

핵심은 **SSH Tunneling이 SSH 자체와 별개의 암호화 기술이 아니라 SSH Connection Layer의 Channel 활용 방식**이라는 점이다.

## 기억·인출 장치

먼저 위치를 복원한다.

```text
SSH
 ↓
Connection
 ↓
Channel
 ↓
Tunneling
```

그 다음 두 질문을 붙인다.

> **입구는 어디이고, 최종 Target Connection은 어느 쪽에서 만드는가?**

```text
-L → Local 입구, Remote 쪽 출구
-R → Remote 입구, Local 쪽 출구
-D → Local SOCKS 입구, 목적지는 요청마다 결정
```

그리고 Tunnel이 연결되더라도 **SSH 인증과 최종 Service 인증은 별도**라는 경계를 유지한다.

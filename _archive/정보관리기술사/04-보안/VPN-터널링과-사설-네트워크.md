# VPN — 공용망 위의 논리적 사설 연결

## 이 문서에서 되짚을 질문

- VPN은 단순히 Traffic을 암호화하는 기술인가?
- 공용 Internet을 사용하는데 왜 "Private Network"라고 부르는가?
- VPN에서 Tunnel은 무엇을 의미하는가?
- Remote Access VPN과 Site-to-Site VPN은 무엇이 다른가?
- Full Tunnel과 Split Tunnel은 무엇을 기준으로 나뉘는가?
- VPN과 SSH Tunneling은 무엇이 다른가?
- IPSec은 VPN 자체인가, VPN을 구현하는 기술인가?

## 1. 먼저 VPN이 해결하려는 문제를 본다

서로 떨어진 사용자나 Network를 전용선처럼 연결하고 싶지만 실제 물리망을 직접 구축하는 것은 비용과 운영 부담이 크다.

```text
떨어진 사용자 / 사설 Network
        ↓
직접 전용 Network 구축은 부담
        ↓
Internet 같은 공용 Network 사용
        ↓
그 위에 논리적인 사설 연결 구성
        ↓
VPN
```

VPN(Virtual Private Network)은 **공용 Network 위에 논리적인 Private Network 연결을 만드는 큰 개념**이다.

따라서 VPN을 단순히 "암호화 통신"이라고만 외우지 않는다.

```text
Public Network
────────────────────────────────

Private Network A
      │
      │   ===== VPN Tunnel =====
      │  /                      \
      ▼ /                        \ ▼
 VPN Endpoint                 VPN Endpoint
                                  │
                                  ▼
                           Private Network B
```

물리적으로는 공용망을 지나지만, 사용자나 조직 입장에서는 허용된 상대와 사설 Network처럼 통신할 수 있는 논리적 경로를 만든다.

## 2. VPN의 핵심은 Tunnel과 보안 경계다

VPN에서는 원래 전달하려던 Packet이나 Traffic을 VPN Endpoint 사이의 전달 형식 안에 넣어 공용망을 통과시킬 수 있다.

```text
원래 Traffic
     ↓
VPN Endpoint
     ↓
Tunnel용 Encapsulation / 보호
     ↓
Public Network
     ↓
VPN Endpoint
     ↓
원래 Traffic 복원
     ↓
Private Destination
```

여기서 두 개를 구분한다.

```text
Tunneling
→ 원래 Traffic을 다른 전달 구조 안에 넣어
  논리적인 경로를 구성

Encryption / Integrity / Authentication
→ 그 경로의 Traffic을
  도청·변조·위장으로부터 보호
```

VPN 구현 방식에 따라 제공되는 보안 속성은 달라질 수 있으므로 **Tunnel = Encryption**이라고 동일시하지 않는다.

## 3. 연결 대상을 기준으로 Remote Access와 Site-to-Site를 나눈다

### Remote Access VPN

개별 사용자 Device가 조직 Network의 VPN Gateway에 접속한다.

```text
Laptop
  │
  │ VPN
  ▼
Internet
  │
  ▼
VPN Gateway
  │
  ▼
Company Network
```

대표적인 목적은 외부 사용자가 내부 시스템에 안전하게 접근하는 것이다.

### Site-to-Site VPN

두 Network의 Gateway가 서로 Tunnel을 구성한다.

```text
Office A
  │
VPN Gateway
  │
  │ ===== Public Network =====
  │
VPN Gateway
  │
Office B
```

개별 Host가 매번 VPN을 직접 구성하기보다 두 Site의 Network를 Gateway 단위로 연결한다.

따라서 먼저 다음 질문을 한다.

```text
User ↔ Network
→ Remote Access VPN

Network ↔ Network
→ Site-to-Site VPN
```

## 4. Traffic을 어디까지 Tunnel에 넣을지도 정책이다

Remote Access VPN에서는 모든 Traffic을 VPN으로 보낼 수도 있고 특정 목적지 Traffic만 보낼 수도 있다.

### Full Tunnel

```text
Client Traffic
     ↓
모든 대상
     ↓
VPN Tunnel
     ↓
VPN Gateway
```

Internet Traffic까지 조직의 VPN Gateway를 경유하도록 구성할 수 있다.

### Split Tunnel

```text
Client
├─ Company Network 목적지 → VPN
└─ 일반 Internet 목적지  → 기존 Local 경로
```

즉 차이는 "VPN이 켜졌는가"가 아니라 **어떤 Route가 VPN Interface / Tunnel을 선택하도록 구성되는가**다.

```text
Full Tunnel
→ 기본 경로까지 VPN 쪽으로

Split Tunnel
→ 특정 Private Prefix만 VPN 쪽으로
```

실제 동작을 볼 때는 VPN Client 화면보다 Routing Table을 함께 보는 것이 이해하기 쉽다.

## 5. VPN은 가상 Network Interface와 Routing으로 보일 수 있다

많은 Client VPN 구현은 OS에 가상 Network Interface를 만들고 Route를 추가한다.

```text
Application
   ↓
OS Routing Table
   ↓
목적지에 맞는 Route 선택
   ├─ Physical NIC
   └─ VPN Virtual Interface
          ↓
       VPN Tunnel
```

따라서 "VPN을 연결했다"는 것은 모든 Packet이 무조건 Tunnel을 탄다는 뜻이 아니다.

어떤 Traffic이 VPN을 사용하는지는 Route와 VPN 정책에 따라 달라진다.

이 관점은 Split Tunnel을 이해할 때 특히 중요하다.

## 6. IPSec은 VPN을 구현하는 대표 기술이다

VPN은 **논리적인 사설 연결이라는 목적/구조**이고, IPSec은 IP Packet을 보호하기 위한 Protocol Suite다.

```text
VPN
→ 공용망 위 논리적 사설 연결

IPSec
→ IP 계층에서 인증·무결성·기밀성 등을 제공하는
  대표적인 VPN 구현 기술
```

따라서 다음처럼 관계를 잡는다.

```text
VPN
├─ IPSec 기반 VPN
├─ TLS 기반 VPN
└─ 기타 Tunnel / Overlay 방식
```

IPSec 내부의 AH, ESP, Transport Mode, Tunnel Mode 등은 별도 세부학습으로 내려간다.

## 7. VPN과 SSH Tunneling은 범위가 다르다

둘 다 공용 Network를 통해 다른 곳의 Service에 접근할 수 있어 비슷해 보인다.

하지만 기본 범위를 비교하면 다음과 같다.

```text
SSH Tunneling
Application
   ↓
특정 Local Port / SOCKS
   ↓
SSH Channel
   ↓
Target TCP Connection

VPN
Application
   ↓
OS Routing
   ↓
VPN Virtual Interface / Tunnel
   ↓
대상 Network
```

| 구분 | SSH Tunneling | VPN |
|---|---|---|
| 기본 관점 | Connection Forwarding | Network 연결 |
| 대표 범위 | 특정 TCP Port / SOCKS | IP Traffic / Network Prefix |
| 경로 선택 | Application이 Local Port·Proxy 사용 | OS Routing이 VPN 경로 선택 |
| 대표 목적 | Bastion 뒤 특정 Service 접근 | 사용자·Site를 Private Network처럼 연결 |

따라서 SSH Tunnel을 단순히 "작은 VPN"이라고 외우지 않는다.

```text
SSH Tunnel
→ 특정 Connection을 SSH Channel로 전달

VPN
→ Network Traffic이 사용할 논리적 Network 경로 구성
```

## 8. VPN을 사용해도 최종 Service 보안은 별도다

VPN에 접속했다고 내부의 모든 Service에 자동으로 접근할 권한이 생기는 것은 아니다.

```text
VPN 인증
→ VPN 연결을 만들 수 있는가?

Network 정책
→ 어떤 Network / Port까지 갈 수 있는가?

Service 인증·인가
→ 최종 Application / DB를 사용할 수 있는가?
```

즉 VPN은 Network 접근 경계를 제공하지만 Application의 인증·인가를 대체하지 않는다.

## 9. 장애 진단은 Tunnel보다 경로부터 복원한다

```text
1. VPN 연결과 인증이 성공했는가?
2. VPN Virtual Interface가 생성됐는가?
3. 필요한 Route가 추가됐는가?
4. 목적지 Traffic이 실제 VPN Route를 선택하는가?
5. VPN Gateway 이후 Target Network까지 전달되는가?
6. Firewall / ACL이 허용하는가?
7. 최종 Service가 정상인가?
```

"VPN은 연결됨"이라는 상태만으로 End-to-End 통신 성공을 보장하지 않는다.

## 10. 기술사 관점 핵심 경계

```text
VPN
→ 공용망 위 논리적 사설 Network 연결

Tunnel
→ 원래 Traffic을 다른 전달 구조 안에 넣어 논리적 경로 구성

IPSec
→ IP Traffic을 보호하는 대표 Protocol Suite

Remote Access
→ User ↔ Network

Site-to-Site
→ Network ↔ Network

Full / Split
→ 어떤 Traffic을 VPN Route로 보낼 것인가
```

VPN을 제품이나 Client 프로그램 이름으로 기억하지 않고 **논리적 Network 연결 → Tunnel → Route → 보안 기술**의 순서로 복원한다.

## 기억·인출 장치

먼저 한 줄을 떠올린다.

> **VPN = 공용망 위에 만든 논리적 사설 Network 경로**

그 다음 세 질문으로 내려간다.

```text
누구와 누구를 연결하지?
→ Remote Access / Site-to-Site

어떤 Traffic을 보낼까?
→ Full / Split Tunnel

어떻게 보호하지?
→ IPSec / TLS 등
```

마지막으로 SSH Tunnel과 헷갈리면:

```text
SSH Tunnel → Connection을 전달
VPN        → Network 경로를 만든다
```

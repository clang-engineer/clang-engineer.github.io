# SSH와 TLS — 보안 채널과 SSH Tunneling

## 이 문서에서 되짚을 질문

- SSH와 TLS는 둘 다 암호화 통신을 제공하는데 왜 같은 계층으로 보면 안 되는가?
- SSH는 TLS 위에서 동작하는가?
- SSH Tunneling의 `-L`, `-R`, `-D`는 무엇을 기준으로 구분하는가?
- Tunnel을 만들었다고 최종 Service 인증까지 해결되는가?
- SSH Host Key와 TLS Certificate는 각각 무엇을 신뢰하는가?
- SSH Tunnel은 VPN과 같은 것인가?

## 1. SSH와 TLS는 같은 암호 재료를 쓰지만 독립된 프로토콜이다

SSH와 TLS는 모두 공개키 기반 키 교환, 대칭키 암호화, 무결성 보호 같은 공통 암호 기술을 사용한다. 그러나 한쪽이 다른 쪽 위에서 동작하는 관계는 아니다.

```text
SSH
→ 원격 로그인·명령 실행·파일 전송·Port Forwarding까지 포함한 완결형 Application Protocol

TLS
→ 여러 Application Protocol이 사용할 수 있는 범용 보안 채널 계층
```

따라서 `SSH가 SSL/TLS 기반인가?`라는 질문에는 **아니다**라고 답한다.

## 2. 계층 구조로 비교한다

TLS는 Application Protocol과 TCP 사이에서 암호화·무결성·상대 인증을 제공한다.

```text
HTTP / SMTP / DB Protocol
        ↓
       TLS
        ↓
       TCP
        ↓
        IP
```

SSH는 자체 Transport, Authentication, Connection 기능을 하나의 Protocol Suite 안에 갖는다.

```text
SSH Connection Layer
→ Channel 다중화, Shell, Port Forwarding

SSH Authentication Layer
→ 사용자 인증

SSH Transport Layer
→ 키 교환, 암호화, 무결성, Server 인증

TCP
IP
```

여기서 `SSH Transport Layer`는 OSI의 Transport Layer(L4)가 아니라 **SSH 내부 계층 이름**이다.

## 3. 인증 모델도 다르다

| 구분 | SSH | TLS |
|---|---|---|
| 주 목적 | 원격 접속·명령 실행 | 범용 통신 채널 보호 |
| 대표 Server 인증 | Host Key, `known_hosts`, TOFU | CA Chain 기반 Certificate |
| 대표 Client/User 인증 | 공개키, 비밀번호 등 | 선택적 Client Certificate 등 |
| 대표 사용 | Shell, SFTP, Port Forwarding | HTTPS, Mail, DB TLS |

SSH는 원격 시스템에 들어가 작업하는 사용자를 인증하는 흐름이 중심이고, TLS는 범용 Application이 상대 Server의 신원을 확인하고 안전한 채널을 만드는 기반으로 널리 사용된다.

### Host Key와 Certificate — 신뢰를 만드는 방식

둘 다 상대가 누구인지 확인하는 데 공개키를 사용할 수 있지만 신뢰 모델이 다르다.

```text
SSH
Server Host Key
   ↓
known_hosts와 비교
   ↓
이전에 접속했던 Host인가?
또는 관리자가 신뢰하도록 배포한 Key인가?

TLS
Server Certificate
   ↓
Certificate Chain 검증
   ↓
신뢰하는 CA까지 연결되는가?
Hostname·유효기간 등 조건이 맞는가?
```

SSH에서 흔히 사용하는 TOFU(Trust On First Use)는 첫 연결에서 본 Host Key를 저장하고 이후 연결에서 변경 여부를 검사하는 방식이다.

따라서 다음 경고는 단순 접속 실패가 아니라 **기존에 신뢰했던 Host Identity가 달라졌다는 신호**다.

```text
REMOTE HOST IDENTIFICATION HAS CHANGED
```

정상적인 Server 재설치나 Key 교체일 수도 있고 중간자 공격 가능성도 있으므로 원인을 확인한 뒤 신뢰 정보를 갱신한다.

## 4. SSH Tunneling — SSH 채널 안으로 다른 TCP 연결을 전달한다

SSH Tunneling은 단순히 "포트를 우회"하는 기능이 아니다.

```text
SSH 연결 수립
    ↓
암호화된 SSH Channel
    ↓
다른 TCP Connection 전달
```

세 옵션은 이름을 외우기보다 두 질문으로 복원한다.

```text
어느 쪽에서 Listen할까?
        ↓
최종 Target Connection은 어느 쪽에서 만들까?
```

## 5. Local Forwarding `-L`

Local PC에 Listen Socket을 만들고, SSH Server 쪽에서 Target으로 연결한다.

```bash
ssh -N -L 35432:db.internal:5432 user@bastion
```

```text
Application
  ↓ localhost:35432
Local SSH Client가 Listen
  ↓ SSH Channel
Bastion SSH Server
  ↓ db.internal:5432로 연결
Internal DB
```

`db.internal`은 기본적으로 **SSH Server가 있는 쪽에서 접근 가능한 주소**다.

대표 용도는 Bastion 뒤의 DB·Web Service 접근이다.

여기서 중요한 점은 Application 입장에서는 Local Port에 연결하지만, 실제 Target 연결은 SSH Server 쪽에서 생성된다는 것이다.

```text
Application이 보는 Destination
→ localhost:35432

SSH Server가 실제로 연결하는 Destination
→ db.internal:5432
```

## 6. Remote Forwarding `-R`

SSH Server 쪽에 Listen Socket을 만들고, SSH Client 쪽에서 Target으로 연결한다.

```bash
ssh -N -R 8080:localhost:3000 user@remote-server
```

```text
remote-server:8080
  ↓ SSH Server가 Listen
SSH Channel
  ↓
Local SSH Client
  ↓ localhost:3000
Local Application
```

Remote Forward를 외부 Interface에 공개하면 단순 개인용 Tunnel이 아니라 외부 접근 가능한 Service Entry Point가 될 수 있다. `GatewayPorts`, Bind Address, Firewall을 함께 본다.

## 7. Dynamic Forwarding `-D`

Local PC에 SOCKS Proxy를 만들고 Application이 요청한 목적지로 SSH Server 쪽에서 연결한다.

```bash
ssh -N -D 1080 user@remote-server
```

```text
SOCKS 지원 Application
  ↓ localhost:1080
SSH Client
  ↓ SSH Channel
SSH Server
  ↓ 요청별 Target
```

`-L`은 Target이 고정되지만 `-D`는 SOCKS 요청마다 목적지가 달라질 수 있다.

모든 Network Traffic이 자동으로 Tunnel을 타는 것은 아니며 Application이 SOCKS Proxy를 사용하도록 설정해야 한다.

DNS 이름을 어느 쪽에서 해석하는지도 Proxy 설정 방식에 따라 달라질 수 있으므로, "SOCKS를 쓰면 DNS까지 항상 Tunnel 내부에서 처리된다"고 단정하지 않는다.

## 8. 세 옵션을 한 축에서 비교한다

| 옵션 | Listen 위치 | Target 연결이 나가는 쪽 | 대표 용도 |
|---|---|---|---|
| `-L` | Local | SSH Server 쪽 | Bastion 뒤 Service 접근 |
| `-R` | Remote | SSH Client 쪽 | Local Service를 Remote에 노출 |
| `-D` | Local SOCKS | SSH Server 쪽 | 여러 Target을 Proxy 방식으로 접근 |

기억할 때는 Forward 이름보다 **입구와 출구 위치**를 그린다.

## 9. SSH Tunnel은 VPN과 범위가 다르다

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

## 10. SSH Tunnel과 Service 인증은 별도 경계다

SSH Tunnel을 만들었다고 최종 Service의 인증·인가가 사라지는 것은 아니다.

```text
SSH 인증
→ Tunnel 사용 권한

DB / Web 인증
→ 최종 Service 접근 권한
```

또한 다음 보안 경계를 따로 본다.

```text
누가 SSH Server에 로그인 가능한가
→ AuthorizedKeys / MFA / 접근 정책

Forwarding 자체가 허용되는가
→ AllowTcpForwarding 등 sshd 정책

어디에 Listen하는가
→ Loopback / External Interface

최종 Service는 누구를 허용하는가
→ Service 자체 인증·인가
```

## 11. Tunnel 진단 순서

```text
1. SSH 로그인 자체가 되는가?
2. Forward Listen Socket이 열렸는가?
3. Target Host를 해당 쪽에서 해석할 수 있는가?
4. Target Port까지 TCP 연결 가능한가?
5. Service Protocol과 인증이 정상인가?
```

예:

```bash
ssh -vvv -N -L 15432:db.internal:5432 user@bastion
```

Local Listen은 `ss`, `lsof` 등으로 확인한다.

## 12. 기술사 관점 핵심 경계

```text
TLS
→ 여러 Application이 공유하는 범용 보안 채널

SSH
→ 원격 접속·인증·채널 다중화까지 포함한 Application Protocol

SSH Tunneling
→ SSH Connection Layer의 Channel을 이용해 다른 TCP 연결을 전달

VPN
→ IP Routing 수준에서 더 넓은 Network Traffic 경로를 구성
```

SSH와 TLS는 같은 암호 기술을 사용할 수 있지만 **서로를 기반으로 하는 상하 관계가 아니다.**

## 기억·인출 장치

```text
-L → Local에 Listen
-R → Remote에 Listen
-D → Dynamic SOCKS
```

그리고 항상 다음 질문을 붙인다.

> 입구는 어디이고, 최종 Target Connection은 어느 쪽에서 만드는가?

```text
-L → Local 입구, Remote 쪽 출구
-R → Remote 입구, Local 쪽 출구
-D → Local SOCKS 입구, 목적지는 요청마다 결정
```

그리고 Tunnel이 연결되더라도 **SSH 인증과 최종 Service 인증은 별도**라는 경계를 유지한다.

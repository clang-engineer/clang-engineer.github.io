---
title       : "SSH Tunneling — -L·-R·-D를 연결의 출발점과 목적지로 이해하기"
description : "SSH 포트 포워딩을 Local·Remote·Dynamic 세 종류의 암기 대신 어디에서 Listen하고 SSH 서버 쪽에서 어디로 연결하는지라는 공통 모델로 설명한다."
date        : 2025-06-25 11:44:14 +0900
updated     : 2026-09-06 10:40:00 +0900
categories  : [security, "SSH·인증"]
tags        : [ssh, tunneling, port-forwarding]
pin         : false
hidden      : false
---

SSH Tunneling은 단순히 "포트를 우회한다"는 기능이 아니다. **SSH 연결을 하나 만든 뒤 그 암호화된 연결 안으로 다른 TCP 연결을 전달하는 기능**이다.

세 옵션을 외우기 전에 두 질문을 잡으면 된다.

```text
어느 쪽에서 Listen할까?
        ↓
그 연결을 어느 Host:Port로 보낼까?
```

이 기준으로 보면:

```text
-L
→ 내 PC에서 Listen
→ SSH Server 쪽에서 Target으로 연결

-R
→ SSH Server 쪽에서 Listen
→ 내 PC 쪽에서 Target으로 연결

-D
→ 내 PC에서 SOCKS Proxy로 Listen
→ Application이 요청한 목적지로 SSH Server 쪽에서 연결
```

이다.

## 기본 구조 — SSH 연결이 전달 경로가 된다

예를 들어 Bastion을 통해 내부 DB에 접근한다고 하자.

```text
내 PC
  ↓ SSH
Bastion
  ↓ TCP
내부 DB:5432
```

SSH는 인증·암호화된 Channel을 제공하고, Port Forwarding은 그 Channel을 이용해 추가 TCP Stream을 전달한다.

따라서 터널을 이해할 때는 "포트가 어디로 순간 이동한다"보다 **Listen Socket과 최종 Connection을 누가 여는지**를 본다.

## 1. Local Forwarding `-L` — 내 PC에 입구를 만든다

형식:

```bash
ssh -L [local-bind-address:]local-port:target-host:target-port user@ssh-server
```

예:

```bash
ssh -N -L 35432:db.internal:5432 user@bastion
```

흐름은:

```text
Application
  ↓ localhost:35432
내 PC의 SSH Client가 Listen
  ↓ SSH Tunnel
Bastion의 SSH Server
  ↓ db.internal:5432로 TCP 연결
Internal DB
```

이제 로컬 Application은:

```text
localhost:35432
```

만 바라보면 된다.

여기서 `db.internal`은 기본적으로 **SSH Server가 있는 쪽에서 해석·접근 가능한 주소**다. 내 PC에서 직접 접근 가능한지와는 별개의 문제다.

### Bastion을 통한 폐쇄망 접근

```bash
ssh -N -L 15432:10.10.20.15:5432 ops@bastion.example.com
```

이 구조는 DB Port를 Public Network에 직접 열지 않고 Bastion의 SSH 접근 권한 안에서 관리할 수 있다는 장점이 있다.

단, SSH Tunnel을 쓴다고 DB 인증 자체가 없어지는 것은 아니다.

```text
SSH 인증
→ Tunnel 사용 권한

DB 인증
→ DB 접근 권한
```

두 보안 경계는 별개다.

## 2. Remote Forwarding `-R` — SSH Server 쪽에 입구를 만든다

형식:

```bash
ssh -R [remote-bind-address:]remote-port:target-host:target-port user@ssh-server
```

예:

```bash
ssh -N -R 8080:localhost:3000 user@remote-server
```

흐름은 반대다.

```text
remote-server:8080
  ↓ SSH Server가 Listen
SSH Tunnel
  ↓
내 PC의 SSH Client
  ↓ localhost:3000으로 연결
Local Application
```

즉 외부 Remote Server 쪽에서 내 로컬 개발 서버에 접근해야 하는 경우 같은 상황에 사용할 수 있다.

### 중요한 경계 — 기본 Bind Address

Remote Forward의 Listen Socket이 다른 Host에도 공개되는지는 SSH Server 설정과 요청한 Bind Address에 따라 달라진다.

OpenSSH Server의 `GatewayPorts`가 관련된다.

```text
GatewayPorts no
→ 일반적으로 Loopback에 제한

GatewayPorts clientspecified
→ Client가 Bind Address를 지정할 수 있게 허용

GatewayPorts yes
→ Remote Forward를 non-loopback 주소에도 bind하도록 허용
```

외부에 공개해야 한다면 무조건 `GatewayPorts yes`로 바꾸기보다 **어떤 Interface에 누구에게 노출할 것인지** 먼저 정한다.

예를 들어 Server 설정이 허용하는 환경에서:

```bash
ssh -N -R 0.0.0.0:8080:localhost:3000 user@remote-server
```

처럼 요청할 수 있다.

이 순간 Remote Forward는 단순 개인용 Tunnel이 아니라 외부 접근 가능한 Service Entry Point가 될 수 있으므로 Firewall과 SSH 접근 정책까지 같이 본다.

## 3. Dynamic Forwarding `-D` — 목적지를 Application이 고르는 SOCKS Proxy

형식:

```bash
ssh -D [bind-address:]local-port user@ssh-server
```

예:

```bash
ssh -N -D 1080 user@remote-server
```

이 경우 `localhost:1080`에 SOCKS Proxy가 생긴다.

```text
SOCKS 지원 Application
  ↓ localhost:1080
SSH Client
  ↓ SSH Tunnel
SSH Server
  ↓ Application이 요청한 목적지로 연결
Target
```

`-L`이 하나의 고정된 `target-host:target-port`를 지정한다면 `-D`는 SOCKS 요청마다 Target이 달라질 수 있다.

중요한 점은 **PC의 모든 Network Traffic이 자동으로 Tunnel을 타는 것이 아니라는 것**이다. Browser나 CLI 등 Application이 해당 SOCKS Proxy를 사용하도록 설정해야 한다.

DNS Resolution을 어느 쪽에서 할지도 Client 설정에 따라 달라질 수 있다. 예를 들어 `curl`에서는 SOCKS5 hostname resolution을 Proxy 쪽에 맡기려면 `socks5h` 형태를 사용할 수 있다.

```bash
curl --proxy socks5h://127.0.0.1:1080 https://example.com
```

## 세 옵션을 같은 표로 비교한다

| 옵션 | Listen 위치 | 최종 Target 연결이 나가는 쪽 | 대표 용도 |
|---|---|---|---|
| `-L` | Local | SSH Server 쪽 | Bastion 뒤 DB·Web 접근 |
| `-R` | Remote | SSH Client 쪽 | Local Service를 Remote 쪽에 노출 |
| `-D` | Local SOCKS | SSH Server 쪽 | 여러 목적지를 Proxy 방식으로 접근 |

핵심 차이는 "Forward 방향"이라는 추상적인 이름보다 **입구가 어디 있고 출구가 어디인가**다.

## Tunnel 전용 연결에 자주 쓰는 옵션

```bash
ssh -N \
  -o ExitOnForwardFailure=yes \
  -L 15432:db.internal:5432 \
  user@bastion
```

- `-N` — Remote Command를 실행하지 않고 Forwarding 용도로만 연결
- `ExitOnForwardFailure=yes` — 요청한 Forwarding을 만들지 못하면 연결 자체를 실패 처리
- `-v` / `-vv` / `-vvv` — SSH 연결과 Forwarding 문제 진단
- `-f` — 인증 후 Background로 전환하는 전통적인 방식

자동 운영에서는 단순 `-f`보다 systemd 같은 Process Supervisor나 환경에 맞는 관리 방식을 사용하는 편이 상태 확인과 재시작에 유리할 수 있다.

## `~/.ssh/config`로 이름 붙이기

반복해서 사용할 Tunnel은 명령 전체를 기억하지 않고 Host 설정으로 관리할 수 있다.

```sshconfig
Host project-bastion
    HostName bastion.example.com
    User ops
    LocalForward 15432 db.internal:5432
    ExitOnForwardFailure yes
```

이후:

```bash
ssh -N project-bastion
```

으로 실행한다.

한 Host Entry에 Local/Remote/Dynamic Forward를 모두 넣을 수도 있지만, 목적이 다른 Tunnel은 Host Alias를 분리하면 운영 의도가 더 명확하다.

## 보안 경계

SSH Tunnel은 암호화된 전송 경로를 제공하지만 **접근 제어를 자동으로 해결하지 않는다.**

```text
누가 SSH Server에 로그인 가능한가
→ SSH 인증 / AuthorizedKeys / MFA / 접근 정책

어떤 Forward를 만들 수 있는가
→ sshd AllowTcpForwarding 등 정책

어디에 Listen하는가
→ Loopback vs External Interface

최종 Service에 누가 접근 가능한가
→ DB/Web 자체 인증·인가
```

특히 Remote Forward를 `0.0.0.0`에 공개하거나 Local Forward를 Localhost가 아닌 Interface에 bind하면 예상보다 넓은 사용자가 Tunnel을 사용할 수 있다.

필요 이상으로 넓은 Bind Address를 사용하지 않고, Firewall과 SSH Server 정책을 함께 관리한다.

## 진단 순서

Tunnel이 동작하지 않으면 다음처럼 층을 나눈다.

```text
1. SSH 로그인 자체가 되는가?
2. Forward Listen Socket이 실제로 열렸는가?
3. SSH Server/Client 쪽에서 Target Host를 해석할 수 있는가?
4. Target Port까지 TCP 연결 가능한가?
5. Service 자체 인증·Protocol은 정상인가?
```

Verbose Log:

```bash
ssh -vvv -N -L 15432:db.internal:5432 user@bastion
```

Local Listen 확인:

```bash
ss -lnt
# 또는 macOS: lsof -nP -iTCP:15432 -sTCP:LISTEN
```

이렇게 보면 "SSH가 안 된다"와 "SSH는 되지만 Target에 못 간다"를 분리할 수 있다.

## 정리

SSH Tunneling의 세 옵션은 하나의 모델로 정리된다.

```text
-L
Local Listen → SSH → Remote-side Target

-R
Remote Listen → SSH → Local-side Target

-D
Local SOCKS Listen → SSH → 요청별 Remote-side Target
```

**어느 쪽에서 Listen하고, 최종 Target Connection을 어느 쪽에서 만드는지**만 그리면 `-L`, `-R`, `-D`를 외우지 않아도 방향을 다시 복원할 수 있다.

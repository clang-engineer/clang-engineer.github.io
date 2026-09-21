# TLS — 보안 채널과 Handshake

## 이 문서에서 되짚을 질문

- TLS는 무엇을 보호하는가?
- TLS는 HTTP 같은 Application Protocol과 어떤 관계인가?
- TLS Handshake에서는 무엇을 합의하고 무엇을 검증하는가?
- Certificate 검증과 Key Exchange는 왜 모두 필요한가?
- Handshake가 끝난 뒤 실제 Application Data는 어떤 Key로 보호되는가?
- SSH와 TLS는 둘 다 암호화 통신을 제공하는데 무엇이 다른가?

## 1. 먼저 전체 위치를 잡는다

TLS는 HTTP 자체를 대신하는 Protocol이 아니라 **기존 Application Protocol이 안전하게 통신할 수 있도록 보안 채널을 제공하는 계층**이다.

```text
Application Protocol
HTTP / SMTP / DB Protocol
        ↓
       TLS
        ↓
       TCP
        ↓
        IP
```

예를 들어 HTTPS는 새로운 HTTP 문법이 아니라 HTTP 통신을 TLS로 보호하는 형태다.

```text
HTTP + TLS
→ HTTPS
```

TLS의 전체 흐름은 먼저 다음 정도로 잡는다.

```text
Client와 Server
   ↓
Handshake
   ├─ 사용할 TLS 조건 협상
   ├─ Server 신원 검증
   └─ 공유할 Traffic Key 도출
   ↓
보안 채널 성립
   ↓
Application Data 암호화 통신
```

즉 TLS의 핵심 질문은 **"서로를 확인하고 안전한 통신 Key를 어떻게 만든 뒤 Application Data를 보호하는가?"**다.

## 2. TLS가 제공하는 보안 속성

TLS는 통신 구간에서 대표적으로 다음을 제공한다.

| 속성 | 의미 |
|---|---|
| 기밀성 | 제3자가 Application Data 내용을 읽기 어렵게 함 |
| 무결성 | 전송 중 Data 변조를 탐지 |
| 상대 인증 | 일반적으로 Client가 Server Certificate를 검증 |
| 선택적 Client 인증 | 필요하면 Client Certificate를 통한 상호 인증 가능 |

TLS를 단순히 "암호화"라고만 보면 Server 인증과 무결성의 의미가 빠진다.

## 3. Handshake — 보안 채널을 만들기 위한 준비 단계

TLS 1.3 기준으로 큰 흐름을 단순화하면 다음과 같다.

```text
Client
  │
  │ ClientHello
  │ - 지원 TLS Version
  │ - Cipher Suite 후보
  │ - Key Share
  ▼
Server
  │
  │ ServerHello
  │ - 사용할 조건 선택
  │ - Server Key Share
  ▼
공유 Secret 도출
  │
  ▼
Server Certificate / CertificateVerify
  │
  ▼
Client가 Server 신원 검증
  │
  ▼
Finished 확인
  │
  ▼
Application Traffic Key
  │
  ▼
암호화된 Application Data
```

실제 TLS Handshake에는 더 많은 세부 Message와 Key 단계가 있지만, 먼저 **협상 → Key 도출 → 인증 → Handshake 검증 → Application Data 보호**의 흐름을 잡는다.

## 4. ClientHello / ServerHello — 통신 조건을 맞춘다

Client는 자신이 지원하는 TLS 조건과 Key Exchange에 필요한 정보를 보낸다.

Server는 그중 사용할 조건을 선택하고 자신의 Key Share를 보낸다.

```text
Client
"나는 이런 TLS Version과 Cipher를 지원하고
 Key Exchange용 값은 이것이야"

Server
"그중 이것을 사용하고
 내 Key Exchange용 값은 이것이야"
```

TLS 1.3에서는 일반적으로 (EC)DHE 계열 Key Exchange를 이용해 양쪽이 공유 Secret을 도출한다.

핵심은 **Session Key 자체를 Network로 그대로 보내는 것이 아니라 양쪽이 교환한 정보와 각자의 비밀값으로 같은 Secret을 계산한다는 점**이다.

## 5. Certificate — 지금 연결한 Server가 맞는가?

암호화만 된다고 안전한 것은 아니다.

공격자와 암호화 채널을 만들어 버리면 통신 내용은 공격자에게 안전하게 전달되는 셈이기 때문이다.

따라서 Client는 Server가 제시한 Certificate를 검증한다.

```text
Server Certificate
      ↓
Certificate Chain
      ↓
신뢰하는 CA까지 연결되는가?
      ↓
Hostname이 일치하는가?
      ↓
유효기간 등 검증 조건이 맞는가?
      ↓
Server Identity 신뢰
```

즉 TLS에서는 다음 두 질문을 분리한다.

```text
안전한 Key를 만들 수 있는가?
→ Key Exchange

그 Key를 함께 만든 상대가
내가 접속하려던 Server가 맞는가?
→ Certificate Authentication
```

## 6. Handshake가 끝나면 대칭키로 Application Data를 보호한다

공개키 암호 기술은 인증과 Key Exchange 과정에서 중요한 역할을 하지만, 실제 Application Data를 계속 공개키 방식으로 암호화하는 것으로 이해하면 안 된다.

Handshake에서 도출한 Key Material로 Traffic Key를 만들고 이후 Application Data를 효율적인 대칭키 기반 암호 방식으로 보호한다.

```text
Handshake
→ 인증 + Key Exchange
        ↓
Traffic Key 도출
        ↓
Application Data
→ 대칭키 기반 암호화·무결성 보호
```

## 7. TLS와 SSH의 위치 차이

TLS와 SSH는 공개키 기반 Key Exchange, 대칭키 암호화, 무결성 보호 같은 공통 암호 기술을 사용할 수 있지만 서로를 기반으로 하는 관계는 아니다.

```text
TLS
→ 여러 Application Protocol이 사용할 수 있는 범용 보안 채널

SSH
→ 원격 로그인·명령 실행·파일 전송·Port Forwarding까지 포함한
  완결형 Application Protocol
```

SSH는 자체 Transport, Authentication, Connection 기능을 Protocol Suite 안에 갖는다.

따라서 `SSH가 TLS 위에서 동작하는가?`라는 질문에는 **아니다**라고 답한다.

### Server 신뢰 모델 비교

```text
TLS
Certificate
   ↓
CA Chain 검증
   ↓
Server Identity 확인

SSH
Host Key
   ↓
known_hosts / 관리된 신뢰 정보
   ↓
SSH Host Identity 확인
```

SSH에서 흔히 사용하는 TOFU(Trust On First Use)는 첫 연결에서 본 Host Key를 저장하고 이후 연결에서 변경 여부를 확인하는 방식이다.

## 8. 기술사 관점 핵심 경계

```text
TLS
→ 기존 Application 통신에 보안 채널 제공

Handshake
→ 통신 조건 협상
→ 상대 인증
→ Key Exchange
→ Traffic Key 도출

Application Data
→ 도출된 대칭키 기반으로 보호
```

TLS를 "HTTPS에 쓰는 암호화"로만 외우지 않고 **보안 채널을 수립하는 과정과 그 위에서 Application Data가 흐르는 구조**로 이해한다.

## 기억·인출 장치

```text
TLS
협상
 ↓
인증
 ↓
Key 공유 기반 마련
 ↓
Traffic Key
 ↓
암호화 통신
```

먼저 **Handshake는 보안 채널을 만들기 위한 과정이고, 실제 Application Data 통신은 그 뒤**라는 경계를 떠올린다.

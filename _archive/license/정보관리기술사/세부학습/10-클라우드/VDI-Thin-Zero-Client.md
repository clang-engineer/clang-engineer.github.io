# VDI·Thin Client·Zero Client

이 문서는 VDI, Thin Client, Zero Client를 한 묶음의 제품명처럼 외우지 않고, **어디에서 Desktop이 실행되는지와 접속 단말에 Local 기능을 얼마나 남기는지**를 기준으로 이해하는 데 목적이 있다.

## 이 문서에서 되짚을 질문

- VDI는 Server 가상화와 같은 말인가?
- Thin Client와 Zero Client는 가상 Desktop 자체인가, 접속 단말인가?
- Zero Client는 정말 CPU나 OS가 전혀 없는가?
- Zero PC는 Server인가, PC인가, VDI 제품명인가?
- VDI를 도입하면 왜 Network와 중앙 Infrastructure가 더 중요해지는가?

---

# 1. 가장 먼저 구조를 분리하자

```text
VDI
= Desktop 실행 위치를 중앙 Data Center / Cloud로 옮기는 Architecture

Thin Client / Zero Client
= 그 중앙 Desktop에 접속하는 단말의 형태
```

즉:

```text
중앙
┌──────────────────────────┐
│ VM / Virtual Desktop     │
│ Application 실행         │
│ User Data 처리           │
└────────────┬─────────────┘
             │ Network
             │ 화면 ↓ / 입력 ↑
             │
┌────────────┴─────────────┐
│ Thin / Zero / 일반 PC    │
│ 사용자 접속 단말          │
└──────────────────────────┘
```

이 둘을 같은 계층으로 보면 헷갈린다.

---

# 2. VDI란 무엇인가

VDI(Virtual Desktop Infrastructure)는 사용자 Desktop을 중앙 Data Center나 Cloud의 VM에서 실행하고, 사용자 단말에는 화면과 입력을 전달하는 구조다.

사용자가 단말에서 Windows Application을 실행하는 것처럼 보여도 실제로는 중앙 VM에서 실행될 수 있다.

```text
사용자 Keyboard / Mouse 입력
        ↓ Network
중앙 Virtual Desktop
        ↓ Application 실행·Data 처리
화면 변화
        ↓ Network
사용자 단말에 표시
```

즉 VDI는 단순 Remote File 저장이 아니다.

> **Desktop의 실행 위치 자체를 사용자 PC에서 중앙 Infrastructure로 옮긴다.**

---

# 3. VDI와 Server 가상화는 같은가

같지 않다.

Server 가상화는 하나의 물리 Server 위에 여러 Server VM을 운영하여 Server Resource를 통합하고 효율화하는 기술이다.

```text
Physical Server
├─ Web Server VM
├─ DB Server VM
└─ Batch Server VM
```

VDI도 가상화 Infrastructure를 사용할 수 있지만 목적은 사용자별 Desktop 제공이다.

```text
VDI Platform
├─ User A Desktop VM
├─ User B Desktop VM
└─ User C Desktop VM
```

따라서 관계는:

```text
Server 가상화
= VDI를 구현하는 기반 기술이 될 수 있음

VDI
= 사용자 Desktop 중앙화가 목적
```

이라고 이해하면 된다.

---

# 4. VDI의 장점은 왜 생기는가

Desktop 실행과 Data가 중앙에 있기 때문에 다음 장점이 생긴다.

## 중앙 관리

```text
개별 PC마다 Patch
→ 관리 대상 분산

VDI
→ 중앙 Image / 정책 관리
→ 표준화 쉬움
```

## Data의 Local 잔존 감소

업무 Data를 중앙에서 처리하면 단말에 Data를 많이 남기지 않는 구조를 만들 수 있다.

그래서 단말 분실 시 Data 유출 위험을 줄이는 데 도움이 될 수 있다.

## 사용자 환경 표준화

Desktop Image, Application, 권한을 중앙에서 통제할 수 있어 환경 편차를 줄일 수 있다.

---

# 5. 대신 왜 Network와 중앙 Infrastructure 의존성이 커지는가

일반 PC에서는 Application이 Local에서 실행되므로 Network가 잠시 불안정해도 일부 작업은 계속할 수 있다.

VDI에서는:

```text
단말
→ Network
→ 중앙 Desktop
```

구조가 항상 필요하다.

따라서 다음 문제가 사용자 체감에 직접 영향을 준다.

- Network 지연
- Packet Loss
- 중앙 Server 장애
- Storage IOPS 부족
- GPU 부족
- 동시 로그인 집중
- 중앙 인증 장애

즉 VDI는 관리와 Data를 중앙화하는 대신 **장애와 성능 영향도 중앙으로 집중**될 수 있다.

---

# 6. Thin Client

Thin Client는 일반 PC보다 Local 기능을 줄인 경량 단말이다.

보통:

- 경량 OS
- CPU / Memory
- 제한된 Storage
- Remote Desktop Client
- Browser나 일부 Local Application

등을 가질 수 있다.

```text
Thin Client
├─ Local OS 있음
├─ 일부 Local Program 실행 가능
└─ 주 업무는 중앙 Desktop 접속
```

### 왜 Thin이라고 부르는가

`아무것도 없다`는 뜻이 아니라 일반 PC보다 Local 기능이 얇다는 뜻이다.

따라서 Thin Client에도 다음 관리가 남을 수 있다.

- OS Patch
- Endpoint Security
- Local Browser 관리
- 접속 Client 관리

장점은 일반 PC보다 Local Data와 관리 복잡도를 줄일 수 있다는 점이다.

---

# 7. Zero Client

Zero Client는 범용 Local OS와 Storage를 최소화하고 VDI 접속 기능에 집중한 단말이다.

```text
Zero Client
├─ 범용 Local OS 최소화
├─ Local Storage 최소화
├─ 특정 Remote Display Protocol 중심
└─ 중앙 Desktop 의존
```

### 정말 CPU가 0개인가

아니다.

부팅, Network 통신, 화면 출력, Keyboard/Mouse 처리, Remote Protocol 동작을 위해 최소한의 Hardware와 Firmware는 필요하다.

`Zero`는 물리적으로 아무것도 없다는 뜻이 아니라 **범용 Local Computing 환경을 최대한 없앴다**는 의미에 가깝다.

### 장점

- Local 관리 대상 감소
- 부팅과 운영이 단순
- Local Data 저장 면적 축소

### 한계

- 중앙 Server와 Network 의존성 큼
- 특정 VDI Solution·Protocol 의존 가능
- Local 독립 작업이 어려움

---

# 8. Thin Client와 Zero Client 경계는 완전히 고정돼 있는가

제품마다 경계가 다를 수 있다.

따라서 이름만 보고 판단하기보다 다음을 확인하는 것이 좋다.

```text
Local OS가 있는가?
Local Storage가 있는가?
Browser나 일반 App을 실행할 수 있는가?
특정 VDI Protocol에 종속되는가?
Offline 작업이 가능한가?
```

쉽게 비교하면:

```text
일반 PC
Local 기능  ██████████
중앙 의존성 ██

Thin Client
Local 기능  █████
중앙 의존성 ██████

Zero Client
Local 기능  █
중앙 의존성 █████████
```

정확한 수치가 아니라 개념적 방향을 나타낸다.

---

# 9. Zero PC는 무엇인가

`Zero PC`는 VDI, Thin Client처럼 하나의 엄격한 표준 기술 분류로 보기 어렵다.

제품이나 사업자 문맥에서:

- 중앙 Virtual Desktop을 사용하는 단말
- Zero Client 계열 제품
- VDI Solution

등을 가리키는 표현으로 쓰일 수 있다.

따라서 `Zero PC`라는 이름만 보고 별도의 Server 기술로 이해하면 안 된다.

핵심은 실제 Architecture를 확인하는 것이다.

```text
Desktop은 어디서 실행되는가?
단말에 OS와 Storage가 얼마나 있는가?
어떤 Protocol로 중앙에 접속하는가?
```

---

# 10. 일반 PC · Thin · Zero · VDI를 함께 보기

VDI는 Server 쪽 Architecture이고 Thin/Zero는 Client 선택지다.

```text
                 [중앙 Virtual Desktop]
                          ↑
                    Remote Protocol
                          ↑
        ┌─────────────────┼─────────────────┐
        │                 │                 │
     일반 PC          Thin Client       Zero Client
 Local 기능 많음      Local 기능 일부      Local 기능 최소
```

따라서 다음 문장은 틀리다.

```text
VDI vs Thin Client 중 무엇을 고를까?
```

정확한 질문은:

```text
VDI Architecture를 사용할 때
사용자 접속 단말을 일반 PC / Thin / Zero 중 어떻게 구성할까?
```

에 가깝다.

---

# 11. 설계 고려사항

VDI는 중앙화의 장점만 보는 것이 아니라 병목과 장애 집중을 함께 봐야 한다.

## Network

- 지연
- 대역폭
- Packet Loss
- 끊김

## Compute

- 동시 사용자 CPU·Memory
- GPU 요구
- Login 집중 부하

## Storage

- Boot Storm
- Login Storm
- 사용자 Profile
- Storage IOPS

## 운영

- Desktop Image
- Patch
- Application 배포
- 사용자 Profile 관리

## 보안

- 인증
- MFA
- 단말 통제
- Clipboard·File 전송 정책
- Local Data 통제

## 가용성

중앙 Infrastructure 장애 시 많은 사용자가 동시에 영향을 받을 수 있으므로 HA·DR이 중요하다.

## 업무 특성

Offline 업무가 필요한 사용자라면 중앙 의존성이 높은 구조가 적합하지 않을 수 있다.

---

# 12. 처음 헷갈리기 쉬운 부분

```text
VDI = Server 가상화?
→ X
Server 가상화는 기반 기술이 될 수 있지만 VDI의 목적은 사용자 Desktop 제공이다.

Thin Client = Virtual Desktop?
→ X
Thin Client는 접속 단말이다.

Zero Client = CPU와 OS가 완전히 0?
→ X
최소한의 Hardware/Firmware와 접속 기능은 필요하다.

Zero PC = 새로운 Server 종류?
→ X
제품·사업자 문맥을 확인해야 하는 명칭이다.

VDI를 쓰면 Network가 덜 중요해지는가?
→ X
오히려 Desktop 사용 경험이 중앙 Network와 Infrastructure에 더 직접적으로 의존한다.
```

---

# 13. 기억 흐름

```text
사용자 PC마다 Desktop과 Data가 분산됨
        ↓
관리·보안·표준화 부담
        ↓
Desktop 실행환경을 중앙으로 이동
        ↓
VDI
        ↓
사용자는 Network를 통해 화면과 입력만 주고받음
        ↓
접속 단말의 Local 기능을 얼마나 남길까?
        ↓
일반 PC / Thin Client / Zero Client
        ↓
Local 기능을 줄일수록 중앙 의존성은 커짐
        ↓
Network·Compute·Storage·HA 설계 중요
```

가장 중요한 한 문장:

> **VDI는 Desktop을 중앙에서 실행하는 Architecture이고, Thin Client와 Zero Client는 그 VDI에 접속하는 단말의 Local 기능 수준을 구분하는 개념이다.**

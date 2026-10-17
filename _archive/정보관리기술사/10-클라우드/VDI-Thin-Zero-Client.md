# VDI·Thin Client·Zero Client

이 문서는 VDI, Thin Client, Zero Client를 한 묶음의 제품명처럼 외우지 않고, **어디에서 Desktop이 실행되는지와 접속 단말에 Local 기능을 얼마나 남기는지**를 기준으로 이해하는 데 목적이 있다.

VDI·RDS·CCI·DaaS의 **데스크톱 제공 방식 비교**와 달리, 여기서는 **접속 단말의 역할과 중앙 운영의 제약**을 중심으로 학습을 완결한다. 두 관점은 같은 주제를 연쇄적으로 세분한 것이 아니라 서로 다른 비교축이다.

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

# 2. 접속 단말의 선택 기준

VDI의 제공 구조·Desktop Pool·중앙 운영 고려사항은 [데스크톱 가상화 — VDI·RDS·CCI·DaaS](데스크톱-가상화-VDI-RDS-CCI-DaaS.md)에서 다룬다. 이 문서는 일반 PC·Thin Client·Zero Client의 **로컬 실행 기능과 중앙 의존성**을 비교한다.

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

# 11. 단말 선택 시 고려사항

- 로컬 OS·Storage·Application 및 오프라인 작업 필요성
- Remote Display Protocol과 주변기기 호환성
- 단말 Patch·Firmware·접속 Client 관리 부담
- 인증·MFA·Clipboard·파일 전송 및 로컬 데이터 정책
- 네트워크·중앙 Desktop 장애 시 업무 영향

중앙 VDI의 Compute·Storage 병목과 가용성 설계는 [데스크톱 가상화](데스크톱-가상화-VDI-RDS-CCI-DaaS.md)를 참고한다.

---

# 12. 처음 헷갈리기 쉬운 부분

```text
VDI = Server 가상화?
→ X
Server 가상화는 기반 기술이 될 수 있지만 VDI의 목적은 사용자 Desktop 제공이다.

VDI = 사용자마다 항상 고정 VM 1대?
→ X
전용 Persistent Desktop도 있고, Pool에서 동적으로 배정하는 Non-persistent Desktop도 있다.

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

# 13. 이해 복원

- VDI와 Thin/Zero Client가 서로 다른 분류축인 이유는?
- Thin과 Zero의 로컬 기능·관리 부담·중앙 의존성은 어떻게 다른가?
- Zero PC라는 명칭만으로 구조를 판단하면 안 되는 이유는?

[클라우드 전체 개념지도](00-전체.md)로 돌아가 단말 선택이 어디에 위치하는지 확인한다.

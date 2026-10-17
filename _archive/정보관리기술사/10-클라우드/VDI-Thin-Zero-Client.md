# VDI·Thin·Zero Client — 접속 단말의 선택

> [클라우드 전체 개념지도](00-전체.md) → 데스크톱 제공 → 접속 단말
>
> **목적:** 중앙 Desktop에 접속할 때 일반 PC·Thin Client·Zero Client의 로컬 기능과 운영 부담을 비교한다. VDI는 중앙 Desktop 제공 방식이고 Thin·Zero Client는 그 환경에 접속하는 단말 유형이다.

## 1. 중앙 Desktop과 접속 단말

VDI는 중앙에서 Desktop을 실행하는 구조이고, Thin/Zero Client는 이에 접속하는 **단말 유형**이다. 둘은 경쟁 기술이 아니다.

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

## 2. Thin Client

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

## 3. Zero Client

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

## 4. Thin Client와 Zero Client 경계는 완전히 고정돼 있는가

제품마다 경계가 다를 수 있다.

따라서 이름만 보고 판단하기보다 다음을 확인하는 것이 좋다.

```text
Local OS가 있는가?
Local Storage가 있는가?
Browser나 일반 App을 실행할 수 있는가?
특정 VDI Protocol에 종속되는가?
Offline 작업이 가능한가?
```

| 기준 | 일반 PC | Thin Client | Zero Client |
|---|---|---|---|
| 로컬 기능 | 폭넓음 | 일부 기능 유지 | 최소화 |
| 로컬 관리 | 상대적으로 많음 | OS·Client 관리 필요 | Firmware·접속 기능 중심 |
| 중앙 의존성 | 업무에 따라 다름 | 상대적으로 큼 | 일반적으로 큼 |

실제 구분은 제품별 OS·Storage·Protocol·오프라인 지원을 확인한다.

## 5. Zero PC는 무엇인가

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

## 6. 단말 선택 시 고려사항

- 로컬 OS·Storage·Application 및 오프라인 작업 필요성
- Remote Display Protocol과 주변기기 호환성
- 단말 Patch·Firmware·접속 Client 관리 부담
- 인증·MFA·Clipboard·파일 전송 및 로컬 데이터 정책
- 네트워크·중앙 Desktop 장애 시 업무 영향

중앙 Desktop의 Compute·Storage 병목이나 장애는 접속 단말 종류와 별개로 발생할 수 있다. 단말 선택에서는 네트워크 의존성과 장애 시 업무 영향을 확인한다.

## 7. 이해 복원

- VDI와 Thin/Zero Client가 서로 다른 분류축인 이유는?
- Thin과 Zero의 로컬 기능·관리 부담·중앙 의존성은 어떻게 다른가?
- Zero PC라는 명칭만으로 구조를 판단하면 안 되는 이유는?

[클라우드 전체 개념지도](00-전체.md)로 돌아가 단말 선택이 어디에 위치하는지 확인한다.

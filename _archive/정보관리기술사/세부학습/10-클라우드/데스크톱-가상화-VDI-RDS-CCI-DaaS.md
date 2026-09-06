# 데스크톱 가상화 — VDI, RDS, CCI, DaaS

## 이 문서에서 되짚을 질문

- 데스크톱 가상화는 왜 서버 가상화와 다른 개념인가?
- VDI, RDS, CCI는 무엇을 기준으로 구분하는가?
- DaaS는 VDI와 같은 구현 방식인가, 서비스 제공 방식인가?
- 서버 가상화는 데스크톱 가상화의 하위 개념인가, 기반 기술인가?

## 1. 먼저 분류축을 분리한다

가상화 기술을 볼 때 `어느 계층에서 가상화하는가`와 `무엇을 제공하려는가`를 한 줄에 놓으면 관계가 섞인다.

```text
계층 축
→ Hardware 수준 가상화 / OS 수준 가상화

용도 축
→ 서버 가상화 / 데스크톱 가상화
```

같은 VM 기술을 사용하더라도 서버 업무를 실행하면 서버 가상화이고, 사용자 Desktop 환경을 중앙에서 제공하면 데스크톱 가상화다.

```text
같은 Hypervisor 기반 VM
├─ Web·WAS·DB 실행 → 서버 가상화
└─ 사용자 Windows Desktop 제공 → 데스크톱 가상화
```

따라서 서버 가상화와 데스크톱 가상화는 상위·하위 관계가 아니라 **목적이 다른 용도 분류**다.

## 2. 데스크톱 가상화의 목적

데스크톱 가상화는 사용자 업무환경을 단말과 분리해 중앙에서 제공하려는 구조다.

주요 목적은 다음과 같다.

- 사용자 환경의 중앙 관리
- 데이터와 업무환경의 단말 분리
- 보안 정책과 Patch의 일관된 적용
- 장소·단말 변경 시 동일한 Desktop 제공
- 장애 시 사용자 환경 복구 단순화

대신 중앙 인프라 장애 영향, 네트워크 품질 의존성, 사용자별 자원 요구 편차, 라이선스와 운영 복잡성이 생긴다.

## 3. VDI — 사용자별 Desktop VM

VDI(Virtual Desktop Infrastructure)는 중앙 Hypervisor 위에 사용자별 Desktop VM을 만들고 화면과 입력을 원격 단말로 전달하는 방식이다.

```text
사용자 단말
   ↕ 화면·키보드·마우스
Connection Broker
   ↓
Desktop VM
   ↓
Hypervisor
   ↓
Physical Server
```

사용자마다 독립 VM을 제공하므로 격리와 개인화가 강하지만, VM 수만큼 CPU·Memory·Storage 자원이 필요해 인프라 비용과 운영 부담이 커질 수 있다.

VDI에는 보통 다음 요소가 함께 필요하다.

- Hypervisor
- Desktop VM Pool
- Connection Broker
- 사용자 인증과 정책
- 화면 전송 Protocol
- Profile·Image 관리

즉 **서버 가상화 기술만 있다고 VDI가 완성되는 것은 아니다.** Hypervisor는 VDI의 기반일 뿐이고, 사용자 연결·Desktop 수명주기 관리가 더 필요하다.

## 4. RDS — 하나의 Server OS를 Session 단위로 공유

RDS(Remote Desktop Services)는 사용자마다 VM을 하나씩 만드는 대신 하나의 Server OS를 여러 사용자가 Session 단위로 공유한다.

```text
하나의 Server OS
├─ User A Session
├─ User B Session
└─ User C Session
```

VDI와 비교하면:

| 구분 | VDI | RDS |
|---|---|---|
| 격리 단위 | 사용자별 VM | 사용자 Session |
| OS | 사용자마다 Guest OS | 하나의 Server OS 공유 |
| 자원 효율 | 상대적으로 낮음 | 상대적으로 높음 |
| 사용자 격리 | 강함 | 상대적으로 약함 |
| 개인화 | 높음 | 제약이 더 큼 |
| Hypervisor 필수 | 일반적으로 필요 | 구조상 필수 아님 |

따라서 RDS를 VDI의 한 종류로 단순화하면 안 된다. 둘 다 원격 Desktop 환경을 제공하지만 **격리 단위가 VM과 Session으로 다르다.**

## 5. CCI — 사용자별 물리 자원을 직접 할당

CCI(Consolidated Client Infrastructure)는 사용자에게 중앙의 물리 Blade PC 등 전용 물리 자원을 1:1로 할당하는 방식이다.

```text
사용자 A → 물리 Client 자원 A
사용자 B → 물리 Client 자원 B
```

가상 Machine을 나누어 쓰는 VDI와 달리 사용자별 물리 자원을 직접 사용하므로 강한 격리와 예측 가능한 성능을 제공할 수 있다. 대신 자원 공유 효율과 확장성은 떨어지고, 물리 장비 운영 비용이 커진다.

즉 CCI는 사용자 Desktop을 중앙화한다는 목적은 비슷하지만 **자원 가상화가 핵심인 방식은 아니다.**

## 6. DaaS — 구현 기술보다 서비스 제공 모델

DaaS(Desktop as a Service)는 Desktop 환경을 Cloud 서비스 형태로 제공하는 모델이다.

보통 내부적으로 VDI와 유사한 가상 Desktop 구조를 사용할 수 있지만, 핵심 구분은 구현 방식보다 **누가 Infrastructure를 운영하고 서비스로 제공하는가**에 있다.

```text
VDI
→ Desktop 가상화 구현 구조

DaaS
→ Desktop 환경을 Service로 제공하는 운영·소비 모델
```

따라서 `VDI vs DaaS`를 순수 기술 대안처럼 비교하면 축이 섞인다. DaaS는 내부 구현으로 VDI 기술을 사용할 수 있다.

## 7. 네 방식을 한 축에서 비교한다

| 방식 | 격리·할당 단위 | 자원 형태 | Hypervisor 관계 | 핵심 특징 |
|---|---|---|---|---|
| VDI | 사용자별 VM | 가상 자원 | 일반적으로 기반 필요 | 개인화·격리 강함 |
| RDS | 사용자 Session | 하나의 Server OS 공유 | 필수 아님 | 자원 효율 높음 |
| CCI | 사용자별 물리 자원 | 물리 자원 | 필수 아님 | 성능·격리 강함, 비용 큼 |
| DaaS | 서비스 계약 | 내부 구현에 따라 다름 | 구현에 따라 다름 | 운영 책임을 Cloud Provider에 이전 |

기억할 때는 다음 질문으로 구분한다.

```text
사용자마다 VM인가?
→ VDI

하나의 Server OS를 Session으로 공유하는가?
→ RDS

사용자마다 물리 자원을 직접 주는가?
→ CCI

Desktop을 Cloud Service로 소비하는가?
→ DaaS
```

## 8. 서버 가상화와의 관계

서버 가상화는 VDI의 하위 개념이 아니라 **VDI를 구현할 때 사용할 수 있는 기반 계층**이다.

```text
[위] 사용자 Desktop 서비스
      ├─ VDI
      ├─ RDS
      ├─ CCI
      └─ DaaS

[아래] 실행·자원 기반
      ├─ Hypervisor / VM
      ├─ Server OS Session
      └─ Physical Client 자원
```

특히 VDI는 Hypervisor 위에 Desktop VM을 만들기 때문에 서버 가상화 기술을 기반으로 삼을 수 있다. 하지만 RDS와 CCI는 같은 전제를 요구하지 않는다.

## 9. 기술사 관점의 선택 기준

데스크톱 가상화 방식은 단순히 기능 수로 비교하지 않고 다음 기준으로 본다.

- 사용자 격리 수준
- 자원 효율
- 개인화 요구
- 중앙 관리 수준
- 네트워크 품질
- 보안 정책
- 장애 영향 범위
- 라이선스와 운영 비용
- Cloud 전환 여부

예를 들어 강한 사용자 격리와 개인화가 중요하면 VDI가 적합할 수 있고, 많은 사용자가 표준화된 업무환경을 공유한다면 RDS가 비용 효율적일 수 있다.

## 10. 헷갈리기 쉬운 경계

### VDI = 데스크톱 가상화 전체인가?

아니다. VDI는 대표적인 구현 방식 중 하나다. RDS·CCI·DaaS처럼 다른 방식도 있다.

### RDS는 VDI의 가벼운 버전인가?

아니다. 사용자별 VM과 Session 공유는 격리 단위 자체가 다르다.

### DaaS는 VDI와 경쟁 기술인가?

축이 다르다. DaaS는 서비스 제공 모델이고 내부 구현으로 VDI를 사용할 수 있다.

### 서버 가상화가 있으면 데스크톱 가상화가 완성되는가?

아니다. VDI에서는 Hypervisor가 기반이지만 Connection Broker, 화면 전송, Desktop Pool, 사용자 정책이 추가로 필요하다.

## 기억·인출 장치

```text
VDI  → VM을 사용자별로
RDS  → Session을 사용자별로
CCI  → 물리 자원을 사용자별로
DaaS → Desktop을 서비스로
```

핵심은 네 이름을 외우는 것이 아니라 **무엇을 사용자별로 나누거나 제공하는지**를 복원하는 것이다.

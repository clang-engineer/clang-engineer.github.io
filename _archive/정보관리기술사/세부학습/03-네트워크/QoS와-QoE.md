# QoS와 QoE

이 문서는 QoS를 단순히 `우선순위 기술`로 외우지 않고, **왜 필요한지 → Traffic을 어떻게 구분하는지 → 혼잡 시 어떤 정책을 적용하는지 → 사용자가 실제로 느끼는 QoE와 어떻게 연결되는지**를 이해하는 데 목적이 있다.

## 이 문서에서 되짚을 질문

- QoS 수치가 좋으면 사용자가 느끼는 품질도 반드시 좋은가?
- 우선순위를 주는 것과 대역폭을 늘리는 것은 같은가?
- Policing과 Shaping은 둘 다 속도를 제한하는데 왜 다르게 동작하는가?
- IntServ와 DiffServ는 왜 보장 수준과 확장성에서 차이가 나는가?
- IPv6에 Traffic Class와 Flow Label이 있다고 QoS가 자동으로 보장되는가?

---

# 1. QoS와 QoE의 차이

QoS(Quality of Service)는 네트워크가 제공하는 품질을 기술적인 지표와 정책으로 관리하는 개념이다.

대표적인 품질 지표:

- Bandwidth
- Throughput
- Delay
- Jitter
- Packet Loss

여기서 **Bandwidth와 Throughput은 같은 말이 아니다.**

```text
Bandwidth
= Link가 이론적으로 제공할 수 있는 전송 용량

Throughput
= 실제로 일정 시간 동안 성공적으로 전달된 데이터 양
```

예를 들어 1 Gbps 회선을 사용하더라도 Protocol Overhead, 혼잡, Packet Loss, Server 처리 한계 등으로 실제 Throughput은 그보다 낮을 수 있다.

즉 **Bandwidth는 '얼마나 담을 수 있는가', Throughput은 '실제로 얼마나 흘려보냈는가'**에 가깝다.

QoE(Quality of Experience)는 사용자가 실제로 느끼는 서비스 품질이다.

예:

```text
영상이 끊기는가?
통화가 자연스러운가?
화면 반응이 답답하지 않은가?
업무 Application 응답이 만족스러운가?
```

즉:

```text
QoS
= Network 관점의 품질

QoE
= 사용자 관점의 체감 품질
```

QoS가 좋아도 Application 오류, Server 지연, 단말 성능 문제 때문에 QoE가 나쁠 수 있다.

반대로 Network 상태가 약간 나빠도 Buffering이나 Codec 보정으로 사용자가 문제를 크게 느끼지 않을 수도 있다.

따라서:

> **QoS는 QoE에 영향을 주는 중요한 요소이지만 QoE를 단독으로 결정하지는 않는다.**  
> **QoE는 Network뿐 아니라 Server, Application, Codec, 단말, 사용자 상황까지 함께 영향을 받는다.**

즉 QoS는 QoE를 개선하기 위한 기반이자 수단이지 QoE 그 자체가 아니다.

---

# 2. 왜 QoS가 필요한가

Network 자원은 한정되어 있고 Traffic마다 요구 특성이 다르다.

예를 들어:

```text
음성 통화
- 필요한 Bandwidth는 비교적 작음
- Delay와 Jitter에 매우 민감

Video
- Bandwidth 요구가 큼
- Delay와 Loss에도 민감

업무 Data
- 정확한 전달 중요
- 일부 Delay는 허용 가능

Backup
- 매우 많은 Bandwidth 사용 가능
- 실시간 Delay에는 비교적 둔감
```

모든 Packet을 동일한 Queue에서 동일하게 처리하면 혼잡 시 실시간 Traffic도 함께 지연된다.

예를 들어 음성 Traffic과 대용량 Backup Traffic을 같은 Queue에 넣으면:

```text
Voice Packet
Backup Packet
Backup Packet
Backup Packet
Backup Packet
Voice Packet
...
```

Backup이 Queue를 크게 차지하면서 Voice Packet이 늦게 전송될 수 있다.

QoS는 이런 상황에서:

> **누가 더 중요한가, 얼마나 사용할 수 있는가, 어떤 순서로 보내는가**

를 정책으로 정한다.

중요한 점은 QoS가 없는 Bandwidth를 새로 만들어내는 기술은 아니라는 것이다.

```text
QoS
≠ 회선 용량 증가

QoS
= 한정된 자원을 Traffic 특성에 맞게 관리
```

---

# 3. QoS 전체 처리 흐름

QoS를 개별 기술 이름으로 외우기보다 다음 흐름으로 이해하면 쉽다.

```text
Traffic 유입
   ↓
1. 식별·분류
   ↓
2. 우선순위 / Class 표시
   ↓
3. 속도 정책
   ├─ Policing
   └─ Shaping
   ↓
4. Queue 배치
   ↓
5. Scheduling으로 전송 순서 결정
   ↓
6. Delay / Jitter / Loss 측정
   ↓
7. QoE와 Service 목표를 보고 정책 보정
```

즉 QoS는 하나의 Algorithm이 아니라 **여러 단계의 Traffic 관리 정책을 묶은 개념**이다.

---

# 4. Classification과 Marking

먼저 어떤 Packet이 어떤 Service에 속하는지 구분해야 한다.

예:

```text
음성
영상
업무 Application
일반 Web
Backup
```

이 단계가 Classification이다.

분류한 뒤 Network 장비가 이후에도 해당 Class를 알 수 있도록 Packet에 우선순위 정보를 표시할 수 있다. DiffServ에서는 DSCP를 이용해 Class를 구분한다.

중요한 흐름은:

```text
Packet이 들어옴
→ 어떤 Traffic인지 분류
→ 어떤 우선순위 Class인지 표시
→ 이후 Router/Switch가 그 Class에 맞는 정책 적용
```

이다.

---

# 5. Policing과 Shaping

둘 다 Traffic 속도를 제어하지만 동작 방식이 다르다.

## Policing

약속한 Rate를 넘는 Traffic을 즉시 제한한다.

```text
Traffic 유입
   ↓
약속한 Rate 이하?
   ├─ Yes → 통과
   └─ No  → Drop 또는 낮은 등급으로 표시
```

특징:

- 초과 Traffic을 기다려주지 않음
- 즉각적인 Rate 제한
- Burst Traffic에서 Drop이 발생할 수 있음

## Shaping

초과 Traffic을 바로 버리지 않고 Buffer에 잠시 저장했다가 정해진 Rate에 맞춰 보낸다.

```text
Traffic 유입
   ↓
Rate 초과
   ↓
Buffer에 대기
   ↓
속도를 평탄하게 조절
   ↓
전송
```

특징:

- Traffic을 부드럽게 만듦
- Drop을 줄일 수 있음
- 대신 Queue에서 기다리므로 Delay가 증가할 수 있음

### 둘을 한 문장으로

```text
Policing
= 넘으면 즉시 자른다

Shaping
= 넘으면 잠시 기다렸다가 보낸다
```

즉 둘 다 속도를 조절하지만 **초과 Traffic을 처리하는 방식이 다르다.**

---

# 6. Queue와 Scheduling

Traffic을 분류했다면 실제로 어떤 Packet을 먼저 내보낼지 결정해야 한다.

혼잡이 없으면 모든 Packet을 빠르게 보낼 수 있지만, QoS의 가치가 드러나는 시점은 **출력 Link보다 들어오는 Traffic이 많을 때**다.

```text
여러 Traffic
   ↓
Queue A : Voice
Queue B : Business
Queue C : Backup
   ↓
Scheduling
   ↓
출력 Link
```

Scheduling은 Queue별로 어떤 순서와 비율로 Packet을 보낼지 결정한다.

여기서 중요한 것은 단순히 `Voice가 중요하니까 항상 Voice만 먼저`가 아니라, 특정 Traffic이 전체 자원을 독점하지 않도록 Service 특성에 맞게 정책을 설계해야 한다는 점이다.

즉 QoS 설계에는 항상 Trade-off가 있다.

```text
실시간 Traffic 우선
↔
다른 Traffic의 Starvation 방지
```

---

# 7. IntServ와 DiffServ

두 방식은 모두 QoS를 제공하려 하지만 **상태를 어디까지 세밀하게 관리하느냐**에서 차이가 난다.

## IntServ

IntServ(Integrated Services)는 Flow마다 필요한 자원을 예약한다.

RSVP를 사용해 경로의 Router가 Flow 상태를 유지한다.

```text
Flow A
→ 필요한 자원 예약 요청
→ 경로의 Router들이 상태 유지
→ Flow 단위 Service 제공
```

장점:

- 개별 Flow 요구를 세밀하게 반영 가능
- 상대적으로 강한 품질 보장 가능

한계:

- Flow가 늘어날수록 Router가 유지해야 하는 상태도 증가
- Signaling과 상태 관리 부담 증가

### 왜 확장성이 떨어지는가

핵심은 **Flow별 상태**다.

```text
사용자 10명
→ 관리할 Flow 적음

사용자 수백만 명
→ Flow 상태도 대규모로 증가
```

Network Core에서 모든 Flow를 개별적으로 기억해야 한다면 규모가 커질수록 부담이 커진다.

## DiffServ

DiffServ(Differentiated Services)는 Packet을 개별 Flow가 아니라 Class로 묶어서 처리한다.

```text
수많은 Flow
→ Class A / Class B / Class C로 분류
→ DSCP 표시
→ Router가 Class별 정책 적용
```

Core Router가 각 사용자 Flow 상태를 모두 유지하지 않고 Class 중심으로 처리할 수 있어 대규모 Network에 유리하다.

장점:

- 상태 관리 부담이 작음
- 대규모 Network에 적합

한계:

- 개별 Flow에 대한 절대적인 품질 보장보다는 Class별 상대적 Service 제공에 가까움

### 비유로 이해하기

```text
IntServ
= 승객마다 좌석을 개별 예약

DiffServ
= 일반석 / 우선석 / 특실처럼 Class를 나눠 처리
```

개별 예약은 강한 보장을 줄 수 있지만 사람이 많아질수록 관리가 복잡하다.

등급 방식은 개인별 세밀한 보장은 약하지만 대규모 운영이 쉽다.

### 가장 중요한 Trade-off

```text
IntServ
보장 강도 ↑
확장성    ↓

DiffServ
보장 강도 상대적
확장성    ↑
```

---

# 8. IPv6와 QoS

IPv6에는 QoS와 관련해 Traffic Class와 Flow Label이 있다.

- Traffic Class: Service 구분·우선순위 표현에 활용
- Flow Label: 같은 Flow에 속한 Packet을 식별하는 데 활용 가능

하지만 Header에 해당 Field가 존재한다고 품질이 자동 보장되는 것은 아니다.

```text
IPv6 Header Field
        ↓
Traffic을 구분할 정보 제공
        ↓
Router의 실제 정책 필요
- Classification
- Queue
- Scheduling
- 충분한 Capacity
```

즉 **표시할 수 있는 Field와 실제 QoS 정책은 별개**다.

---

# 9. QoS와 QoE를 연결해서 보기

QoS는 기술 지표만 최적화하면 끝나는 것이 아니다.

예를 들어 Network 지표가 다음과 같이 좋아졌다고 하자.

```text
Delay 감소
Packet Loss 감소
Jitter 감소
```

그런데 사용자는 여전히 영상이 자주 멈춘다고 한다면 Server, Application, Codec, 단말 등 다른 원인이 있을 수 있다.

```text
Network QoS
   ↓ 영향을 줌
사용자 QoE
   ↑ 동시에 영향
Server / Application / Codec / 단말 / 사용자 환경
```

따라서 **QoS 개선은 QoE 개선 가능성을 높이지만, QoS가 좋다는 이유만으로 좋은 QoE가 보장되지는 않는다.**

운영 관점에서는 다음 Loop가 필요하다.

```text
Service 요구
→ QoS 정책 적용
→ Network Metric 측정
→ 실제 사용자 QoE 확인
→ 원인 분석
→ 정책 보정
```

QoS 지표를 목표 자체가 아니라 **사용자 Service 품질을 위한 수단**으로 보는 것이 중요하다.

---

# 10. 처음 헷갈리기 쉬운 부분

```text
QoS = Bandwidth 증가?
→ X
한정된 자원의 우선순위와 사용 정책을 관리한다.

Bandwidth = Throughput?
→ X
Bandwidth는 Link의 전송 용량이고,
Throughput은 실제 전달된 처리량이다.

QoS가 좋으면 QoE도 반드시 좋다?
→ X
Application·Server·단말 등 다른 요소도 영향을 준다.

Policing과 Shaping은 같은가?
→ X
Policing은 초과 Traffic을 즉시 제한하고,
Shaping은 Buffer에 대기시킨 뒤 속도를 맞춘다.

IntServ가 무조건 더 좋은가?
→ X
세밀한 보장은 강하지만 Flow별 상태 관리 때문에 확장성 문제가 있다.

IPv6 Flow Label이 있으면 QoS가 자동 보장되는가?
→ X
실제 Router의 Queue·Scheduling 정책이 필요하다.
```

---

# 11. 기술사 답안 포인트

QoS 답안은 기법 이름을 나열하기보다 다음 흐름으로 쓰는 것이 안정적이다.

```text
Service별 Traffic 특성
→ 품질 지표
→ Classification / Marking
→ Policing / Shaping
→ Queue / Scheduling
→ Monitoring
→ QoE Feedback
```

IntServ와 DiffServ 비교에서는 다음 축을 잡는다.

```text
관리 단위     : Flow vs Class
상태 관리     : 많음 vs 적음
보장 강도     : 강함 vs 상대적
확장성        : 낮음 vs 높음
```

---

# 12. 기억 흐름

```text
Network 자원은 한정됨
        ↓
Traffic마다 요구 특성이 다름
        ↓
Traffic을 먼저 분류
        ↓
Class와 우선순위를 표시
        ↓
속도를 제한·평탄화
Policing / Shaping
        ↓
Queue와 Scheduling으로 전송 순서 결정
        ↓
Delay / Jitter / Loss 측정
        ↓
실제 사용자 QoE 확인
        ↓
정책 보정
```

그리고 Architecture 선택은:

```text
Flow마다 강하게 보장
→ IntServ
→ 상태 관리 부담 큼

Class 단위로 대규모 운영
→ DiffServ
→ 확장성 좋음
```

가장 중요한 한 문장:

> **QoS는 대역폭을 새로 만드는 기술이 아니라, 한정된 Network 자원을 Traffic 특성에 맞게 차등 관리하여 최종적으로 QoE를 개선하려는 체계다.**
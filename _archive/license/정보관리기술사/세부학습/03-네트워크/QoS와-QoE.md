# QoS와 QoE

## 차이

QoS(Quality of Service)는 네트워크가 제공하는 대역폭·지연·지터·손실 등의 품질을 관리한다. QoE(Quality of Experience)는 사용자가 실제로 느끼는 영상 끊김, 통화 품질, 응답 만족도 등을 평가한다.

QoS가 좋아도 애플리케이션 오류나 단말 성능 문제 때문에 QoE가 나쁠 수 있다. 반대로 Buffering이나 Codec 보정으로 일부 네트워크 저하를 사용자가 덜 느낄 수도 있다.

## 왜 필요한가

망의 용량은 한정되어 있고 음성·영상·업무 Data·Backup Traffic의 요구가 다르다. 모든 Packet을 동일하게 처리하면 혼잡 시 중요한 실시간 Traffic도 함께 지연되거나 손실된다.

QoS는 보통 다음 흐름으로 적용한다.

Traffic 식별·분류
→ 우선순위 표시
→ Policing·Shaping으로 속도 조절
→ Queue와 Scheduling으로 전송 순서 결정
→ 지연·손실·지터 측정
→ 서비스 목표와 사용자 체감으로 보정

## IntServ와 DiffServ

### IntServ

IntServ(Integrated Services)는 Flow마다 필요한 자원을 예약한다. RSVP를 이용해 경로의 Router가 상태를 유지한다.

- 장점: 개별 Flow의 품질을 강하게 보장할 수 있다.
- 한계: Flow 수가 늘수록 상태 관리와 Signal 부담이 커진다.

### DiffServ

DiffServ(Differentiated Services)는 Packet을 Class로 분류하고 DSCP로 표시한 뒤 Class별 정책을 적용한다.

- 장점: Core Router가 개별 Flow 상태를 모두 유지하지 않아 규모 확장에 유리하다.
- 한계: 종단 간 절대 품질보다 Class별 상대 우선순위를 제공한다.

## IPv6와 QoS

IPv6의 Traffic Class는 우선순위·서비스 구분에 사용하고, Flow Label은 같은 Flow의 Packet을 식별하는 데 활용할 수 있다. 이 필드가 있다고 품질이 자동 보장되는 것은 아니다. Router의 분류·Queue·Scheduling 정책과 충분한 용량이 함께 필요하다.

## 기술사 답안 포인트

QoS 답안은 기법 목록보다 대상 Traffic, 품질 지표, 정책, 측정, QoE 환류 순서로 작성한다. IntServ와 DiffServ는 보장 강도와 확장성의 Trade-off로 비교한다.

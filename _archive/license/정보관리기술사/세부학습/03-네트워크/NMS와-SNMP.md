# NMS와 SNMP

## 이 문서에서 되짚을 질문

- Agent가 상태를 먼저 보내는 편이 효율적인데 왜 Manager가 계속 묻는가?
- NMS는 Web Server이고 장비 Agent가 접속하는 구조인가?
- Polling과 Trap 중 하나만 사용하면 안 되는가?

## 기본 구조

NMS(Network Management System)는 여러 네트워크 장비의 상태·성능·장애·구성을 통합 관리한다. SNMP(Simple Network Management Protocol)는 NMS Manager와 장비의 Agent가 관리 정보를 주고받는 대표 프로토콜이다.

- Manager: 조회·설정·수집·경보 처리를 담당
- Agent: 장비 내부 상태를 MIB 형태로 제공
- MIB: 관리 객체의 이름·형식·계층을 정의한 정보 구조
- OID: MIB 객체를 식별하는 계층형 번호

Web 서비스에 비유하면 Manager가 상태를 조회하는 Client 역할에 가깝고, 장비의 Agent가 요청에 응답하는 Server 역할에 가깝다. 다만 NMS는 단순 화면이 아니라 수집 일정, 지표 저장, 임계치 판단, 경보와 보고까지 담당하는 관리 시스템이다. MIB는 장비가 어떤 관리 항목을 제공하는지 정한 목록이고, OID는 그 항목을 찾아가는 주소다.

## Polling과 Trap

### Polling

Manager가 일정 주기로 Agent에 값을 요청한다.

장점:
- 중앙에서 수집 주기와 대상을 통제한다.
- 장비별 상태를 같은 기준으로 비교하기 쉽다.
- Agent가 임의로 많은 정보를 보내는 것을 제한한다.

한계:
- 장비와 항목이 많으면 요청 Traffic과 NMS 부하가 커진다.
- Polling 사이에 발생하고 사라진 짧은 장애를 놓칠 수 있다.

### Trap·Inform

Agent가 장애나 임계치 초과 같은 Event를 Manager에 알린다.

- Trap: 응답 확인 없이 전송하므로 빠르지만 유실될 수 있다.
- Inform: 수신 확인을 받아 신뢰성을 높이지만 부담이 증가한다.

실제 운영에서는 정기 Polling으로 기준 상태를 수집하고 Trap·Inform으로 긴급 Event를 보완한다.

## 왜 Agent가 항상 먼저 보내지 않는가

Agent Push만 사용하면 많은 장비가 동시에 전송해 NMS가 폭주할 수 있고, 장비마다 전송 주기와 기준이 달라 일관된 수집이 어렵다. 또한 Agent 장애나 Network 단절 시 아무 메시지가 오지 않는 상태와 정상 상태를 구분하기 어렵다.

Manager Polling은 응답 없음 자체를 장애 신호로 사용할 수 있다. 중앙 정책에 따라 수집 대상과 주기를 바꾸기도 쉽다.

예를 들어 장비가 정상일 때만 1분마다 “정상” 메시지를 보내도록 만들면, 메시지가 안 왔을 때 장비 장애인지 Network 장애인지 Agent 장애인지 바로 알기 어렵다. 반대로 Manager가 직접 물으면 “응답이 없다”는 사실 자체가 관측 결과가 된다. 그래서 **정상 상태와 추세는 Polling**, 즉시 알려야 할 사건은 **Trap·Inform**으로 나누는 혼합 방식이 일반적이다.

Push가 나쁜 방식이라는 뜻은 아니다. 최근 Streaming Telemetry처럼 장비가 지속적으로 측정값을 보내는 방식도 사용한다. 중요한 것은 Push와 Pull의 우열이 아니라 장비 수, 수집 주기, 유실 허용 여부와 중앙 통제 필요성을 보고 선택하는 것이다.

## SNMP 운영 고려사항

- 수집 주기와 장비 수에 따른 부하
- Counter의 누적값·단위·Wraparound 해석
- 임계치와 오탐·미탐
- 시간 동기화
- 접근권한과 암호화
- SNMPv3의 인증·무결성·기밀성
- 장애 시 Polling·Trap·Log·Telemetry의 상호 검증

## 기억 흐름

장비 상태를 중앙에서 알아야 함
→ NMS Manager가 Agent의 MIB 조회
→ Polling으로 정기 상태 확인
→ Trap·Inform으로 긴급 Event 보완
→ 지표·임계치·알림을 운영 절차와 연결

# TCP 연결·종료·흐름·혼잡 제어

## TCP가 해결하는 문제

IP는 Packet을 전달하지만 도착·순서·중복 제거를 보장하지 않는다. TCP는 Sequence Number, Acknowledgment, 재전송, Window를 이용해 애플리케이션 사이에 신뢰성 있는 Byte Stream을 제공한다.

## 연결 설정

3-Way Handshake는 양쪽이 송수신 가능하고 초기 Sequence Number를 확인하는 과정이다.

1. Client가 SYN 전송
2. Server가 SYN+ACK 응답
3. Client가 ACK 전송

연결 정보에는 출발지·목적지 IP와 Port, Sequence·ACK 번호, Window, 상태, Timer 등이 포함된다. 운영체제 Kernel이 이를 Socket 상태로 관리한다.

## 연결 종료

TCP는 양방향 전송을 각각 닫기 때문에 일반적으로 4개의 Segment를 사용한다.

1. 한쪽이 FIN
2. 상대가 ACK
3. 상대도 FIN
4. 처음 종료한 쪽이 ACK

먼저 종료한 쪽은 TIME_WAIT 상태에서 지연된 Segment가 새 연결에 섞이지 않도록 기다리고, 마지막 ACK가 유실되면 다시 응답할 수 있게 한다.

## HTTP Keep-Alive와 TCP Keepalive

이름이 비슷하지만 목적이 다르다.

- HTTP Keep-Alive: 여러 HTTP 요청이 하나의 TCP 연결을 재사용해 Handshake 비용을 줄인다.
- TCP Keepalive: 오랫동안 Traffic이 없는 연결의 상대가 살아 있는지 Probe로 확인한다.

Connection Pool은 애플리케이션이 여러 연결을 미리 유지·재사용하는 관리 방식이다. HTTP Keep-Alive와 관련되지만 동일한 개념은 아니다.

## 오류·흐름·혼잡 제어

- 오류 제어: 손실·중복·순서 오류를 ACK·Timer·재전송으로 처리
- 흐름 제어: 수신자가 감당할 수 있는 범위로 송신량 제한. Receiver Window 사용
- 혼잡 제어: 네트워크 전체가 감당할 수 있는 범위로 송신량 조절. Congestion Window 사용

실제 전송 Window는 대체로 Receiver Window와 Congestion Window 중 작은 값의 제약을 받는다.

Slow Start는 작은 Window에서 빠르게 증가시키고, Congestion Avoidance는 혼잡에 가까워지면 완만하게 증가시킨다. 손실 신호가 나타나면 Window를 줄인다.

## 기억 흐름

IP의 비신뢰 전달
→ TCP 연결 상태 생성
→ Sequence·ACK·재전송으로 신뢰성 제공
→ 수신 측 한계는 흐름 제어
→ 네트워크 한계는 혼잡 제어
→ FIN 교환과 TIME_WAIT로 안전하게 종료

# 학습 가이드

## 권장 흐름

`통신과 OSI/TCP-IP 계층 → 물리·데이터링크 → IP 주소와 라우팅 → TCP/UDP와 혼잡제어 → 응용 프로토콜 → 네트워크 가상화와 서비스`

## 학습 깊이

- **핵심**: OSI/TCP-IP, Ethernet, IP/IPv6, 라우팅, TCP/UDP, 혼잡제어, QoS, VLAN/VPN, 네트워크 보안의 기반
- **연결**: 무선 LAN, 이동통신, MPLS, CDN, SDN/NFV, IoT. 구조와 적용 목적 중심으로 본다.
- **조회**: 과거 무선·이동통신 규격, 개별 인터페이스와 세부 프레임 값은 비교나 기출이 필요할 때 확인한다.

## 회독 종료 기준

- 데이터가 응용 계층에서 링크를 거쳐 상대 호스트에 도달하는 과정을 계층별로 설명할 수 있다.
- IP 주소·라우팅과 TCP 신뢰성·혼잡제어의 역할을 구분할 수 있다.
- 개별 프로토콜의 모든 필드보다 계층, 목적, 동작, 비교 기준을 재현할 수 있으면 멈춘다.

# 목차
PART 1. 데이터통신
01. 캐스팅 모드
02. 단방향, 반이중 및 전이중 통신
03. 패킷교환방식, 가상회선교환, 데이터그램 방식
04. OSI(Open Systems Interconnection) 7 모델의 각 계층별 특징, Data Type, 장비 및 프로토콜
05. TCP/IP 모델의 설명 및 각 계층별 프로토콜 종류
06. SAP, SDU 및 PDU
07. L3, L4, L7 스위치
08. All IP
09. 네트워크 성능 산출방법
10. 디지털 변조방식(ASK, FSK, PSK, QAM)
11. FHSS(Frequency Hopping Spread Spectrum)와 DSSS(Direct Sequence SS) 확산방식
12. 샤논(Shannon)의 통신모형
13. SDM(Space Division Multiplexing)과 TDM(Time Division Multiplexing)
14. 베이스밴드(Base Band)의 유형과 맨체스터(Manchester) 방식
15. OFDM(Orthogonal Frequency Division Multiplexing)과 OFDMA 동작원리, 특징비교, 활용 및 적용분야
16. RS(Recommended Standard)-232c
17. CRC(Cyclic Redundancy Check)
18. ARP(Address Resolution Protocol), RARP(Reverse ARP)
19. IEEE 802.3의 동작원리 및 프레임 구조
20. CSMA(Carrier Sense Multiple Access)
21. CSMA/CA(Collision Avoidance)와 CSMA/CD(Collision Detection)
22. VLAN(Virtual Local Area Network)
23. IP주소 부족문제 해결방안
24. IPv6(Internet Protocol version 6)
25. IPv6 주소의 구성 및 분류
26. Multicast
27. IP Multicast
28. NAT(Network Address Translation)
29. Mobile IPv4의 삼각라우팅 개념, 필요성, 보완방안
30. Mobile IPv6 동작방식
31. Proxy Mobile IPv6 구성과 동작과정
32. 라우팅(Routing) 알고리즘의 종류
33. 유니캐스트(Unicast) 라우팅 프로토콜 구성과 대표 프로토콜 설명
34. 멀티캐스트(Multicast) 라우팅 프로토콜 유형과 적용 방안
35. 에드훅(Ad-Hoc) 라우팅 프로토콜
36. 슬라이딩 윈도우(Sliding Window)의 동작방식과 사례
37. TCP와 UDP의 특징 비교
38. TCP의 혼잡제어의 동작원리와 핵심기술
39. SCTP(Stream Control Transmission Protocol)의 패킷구조와 동작방식
40. 네트워크 상의 QoS(Quality of Service) 기술
41. Internet QoS
42. NP, QoS, QoE의 비교 및 품질측정 방법
43. IntServ, DiffServ 정의, 구성 및 비교
44. NMS(Network Management System)
45. SNMP(Simple Network Management Protocol)의 동작원리와 연산자
46. Active FTP와 Passive FTP의 차이점
47. HTTP 및 HTTP의 keep alive
48. RTSP(Real-Time Streaming Protocol)의 세션수립과정과 주요기능
49. RTP(Real-time Transport Protocol)의 개념과 헤더구조
50. RTCP(Real-Time Control Protocol)의 개념과 동작방식
51. DHCP(Dynamic Host Configuration Protocol)

PART 2. 무선통신
52. WLAN(Wireless Local Area Network)
53. ISM(Industrial, Science, Medical) Band
54. IEEE 802.11ac
55. IEEE 802.11ad(WiGig)의 프로토콜 구조와 경쟁기술 비교
56. IEEE 802.11af(Super Wi-Fi)의 동작원리
57. IEEE 802.11i의 개념, 보안과정 및 주요기술
58. Miracast
59. Wi-Fi Direct
60. WPAN(Wireless Personal Area Network)의 Bluetooth, UWB 및 Zigbee 비교
61. Bluetooth의 구성방법과 연결동작
62. Bluetooth의 4.0 LE(Low Energy)
63. Zigbee 통신
64. UWB기술, MB-OFDM 및 DS-CDMA UWB 비교
65. 6LoWPAN의 등장배경과 프로토콜 구조
66. WiBEEM(Wireless Beacon-enabled Energy Efficient N/W)의 개념과 구성
67. Binary CDMA
68. NFC의 개념, 특징 및 RFID와 비교
69. D2D(Device to Device) 통신
70. IEEE 802.15.3c의 프레임 구조
71. WBAN(Wireless Body Area Network)의 서비스 구조, 핵심기술 및 활용사례

PART 3. 이동통신
72. MIMO(Multiple Input Multiple Output)의 개념, 구조 및 핵심기술
73. AMC(Adaptive Modulation and Coding)의 개념과 동작방식
74. Array Antenna의 개념과 종류
75. 핸드오버(Handover)의 유형과 비교
76. 핸드오버(Handover)와 로밍(Roaming) 비교
77. LTE-Advanced의 핵심기술
78. FMC(Fixed Mobile Convergence)와 FMS(Fixed Mobile Substitution)
79. 펨토셀(Femto Cell)
80. mVoIP의 등장배경, 서비스유형 및 제공유형
81. IMS(IP Multimedia Subsystem)의 구조와 계층별 기능
82. 5G 이동통신의 필요성과 관련 기술

PART 4. 정보통신망
83. CDN(Contents Delivery Network)
84. ADN(Application Delivery Network)의 개념과 주요 기능
85. MPLS(Multi-Protocol Label Switching)의 개요, 특징 및 FEC 구성
86. VPLS(Virtual Private LAN Service)의 구조와 주요 기술
87. 무선 메쉬네트워크(Wireless Mesh Network)
88. VPN(Virtual Private Network)
89. Internet Exchange의 구축 유형과 운영 방식
90. VoIP(Voice over IP)의 개념, 구성도 및 관련 프로토콜
91. BCN(Broadband Convergence Network)의 구조와 계층별 주요기술
92. WDM(Wavelength Division Multiplexing)
93. FTTH 개념, AON/PON 특징 및 구축 시 고려사항
94. SONET과 SDH의 통신방식과 프레임구조
95. 가시광 통신의 원리와 요소 기술
96. MVNO(Mobile Virtual Network Operators)의 개념, 유형 및 기대효과
97. 망중립성
98. Giga Korea

PART 5. 응용서비스
99. 재난안전무선통신망의 요구기능과 후보기술
100. Smart Grid(스마트 그리드) Networking 기술
101. DNP(Distributed Network Protocol)의 개념과 동작원리
102. DTN(Delay Tolerant Network)
103. SDN(Software Defined Network)의 특징, 구조, 동작방식 및 표준화 동향
104. NFV(Network Function Virtualization)의 구성과 SDN과 비교
105. CAN(Controller Area Network)의 특징, 핵심기술과 동작과정
106. DSRC(Dedicated Short Range Communication)
107. WAVE(Wireless Access Vehicular Environment)
108. BACnet(Building Automation Control Network)의 구조와 요소기술
109. DLNA(Digital Living Network Alliance)
110. uPnP(Universal Plug and Play)
111. 센서네트워크(Sensor Network)
112. 사물통신의 핵심기술
113. IoT(Internet of Things)
114. IoE(Internet of Everything)의 구성과 구성요소

# 학습 가이드

## 권장 흐름

`보안 목표와 거버넌스 → 위험관리 → 암호와 인증 → 공격과 대응 → 접근통제/IAM → 네트워크·시스템·애플리케이션 보안 → 개인정보와 제도`

## 학습 깊이

- **핵심**: CIA, 위험관리, 대칭키/공개키/해시/전자서명, 인증과 접근통제, 주요 공격과 방어, 보안 거버넌스
- **연결**: 네트워크·시스템·DB·클라우드 보안, 개인정보보호, 포렌식. 계층별 통제와 적용 사례를 연결한다.
- **조회**: 반복 암호 계산, 폐지·통합된 인증제도, 개별 공격 도구는 기출이나 현행 제도 확인이 필요할 때 본다.

## 회독 종료 기준

- 자산·위협·취약점·위험·통제의 관계와 관리 절차를 설명할 수 있다.
- 예방·탐지·대응·복구 관점에서 관리적·기술적·물리적 대책을 구성할 수 있다.
- 알고리즘 내부 계산보다 선택 기준과 키 관리, 적용 시 주의점을 답안으로 만들 수 있으면 멈춘다.

# 목차
PART 1. 정보보호
1. 정보보호의 목표
2. 정보기술의 구성요소와 정보화 사회의 특성, 정보화의 역기능
3. 정보보호의 필요성
4. 정보보호(Information Security)의 위험요소
5. 정보보호 대책
6. OSI 보안구조인 X. 800 정의
7. NIST(미국 국립표준기술연구소)에서 제시한 정보 보안의 핵심 원칙
8. 보안 순환 사이클(Cycle)
9. 보안 프레임워크(Framework), 위협 대응 절차
10. 보안 거버넌스(Security Governance)

PART 2. 암호학
11. 암호 방식의 발전 과정(고대, 근대, 현대)
12. 현재 암호학의 수학적 이론들 - 약수&배수, 최대공약수, 서로소, 유클리드 호제법, 소수(소인수분해), 모듈러 연산, 잉여계, 오일러의 정리, 페르마의 정리
13. mod 89에서 27의 승산 역원
14. mod 65에서 27원 승산 역원
15. 암호학에 적용되는 유클리드 호제법(Euclidean Algorithms)의 원리를 증명, 이 원리를 이용하여 (252, 198)의 최대 공약수를 구하시오.
16. 페르마 소정리를 이용하여 아래 연산이 성립함을 보이시오.
5^28 = 4(mod 11)
17. 암호 기법 ? 치환, 전치, 적(product) 암호방식
18. 블록(Block)암호기법과 스트림 암호(Stream Cipher)기법
19. 대칭키와 비대칭 Key 암호 방식
20. 현대 암호학의 기초, Feistel 암호의 구조와 암호화와 복호화 과정
21. Feistel 암호 구조에서 f함수와 S-Box
22. 블록암호, Feistel 암호구조와 SPN(Substitution Permutation Network) 비교
23. AES(Advanced Encryption Standard) 암호화 알고리즘
24. 국산 암호화 알고리즘, SEED
25. 국산 암호화 알고리즘, ARIA(Academy Research Institute Agency)
26. DES 와 AES 암호의 장단점
27. 블록(Block)암호화 기법에서 ECB 모드와 CBC 운용모드의 동작 및 장?단점
28. 공개키 암호화 방식 (암호기법 분류)
29. RSA공개키 암호방식에서 송신자 비밀키(p=7, q=11)이고 송신자의 공개키(Ke)값이 13일 때 수신자의 개인키(Kd)를 구하라
30. 공개키 암호화 방식을 설명하고 비밀키(p=3, q=11)이고 평문 M=5일 때 RSA 암호화 복호화 과정을 설명하시오.
31. 해쉬함수(Hash Function)의 특징
32. 비 대칭키 (공개키 암호방식)방식의 전자서명 방법
33. RSA 암호방식을 이용한 전자서명방식에 대해 2가지 이상 설명

PART 3. 보안 위협
34. 해커(Hacker) 공격 유형
35. 피싱(Phishing)과 파밍(Pharming)
36. 피싱(Phishing)의 공격유형과 대응방법
37. 파밍(Pharming)의 공격유형과 대응방안, Phishing과 비교
38. 램섬웨어(Randsom-ware)와 파밍(Pharming)
39. DDoS(2교시형)
40. DDoS의 공격 대응 방안(1교시형)
41. DrDOS
42. Sniffing과 Spoofing
43 인터넷 Protocol 에서 4단계 주소체계(Specific/Port/Logical/Physical Address)를 설명하고 각 주소체계에서 발생될 수 있는 Spoofing의 위협
44. ARP Spoofing에 대해 설명하고 공격탐지 방법과 대응 방안
45. Malware
46. Rootkit(루트킷)
47. 봇 넷(Bot Net)
48. Session Hijacking(납치) Attack
49. APT(Advanced Persistent Threat) 공격기법과 대응방안
50. DNS(Domain Name System) Sinkhole
51. SQL Injection 공격기법
52. XSS(Cross Site Scripting), CSRF와 비교
53. CSRF(Cross-Site Request Forgery)
54. TCP와 UDP 차이점, 3 Way Handshaking, SYN Attack,해결방안
55. Buffer Overflow (Sample Code 작성) 취약점 및 대응 방안
56. 기관 내부자에 의해 행해지는 보안 위협의 주요 행동적 특성

PART 4. 기업 및 개인의 정보보호, 인증
57. ISO 27000 Family
58. ISO 27001 (ISMS-Information Security Management System)
59. 기업 정보보안
60. 정보보호 관리 및 정책
61. 정보보호의 필요성과 기업의 정보보호시의 장점
62. 정보보안관리에서의 중요 용어
63. CC평가 인증 절차 및 각 단계별 업무
64. 정보보호 시스템 보안성 평가 인증 시 필요한 문서
65. CC(Common Criteria)
66. 개인정보영향평가(PIA: Privacy Impact Assessment) 의 목적, 평가대상, 평가단계 및 평가 절차
67. PIMS(Personal Information management System)의 구성요소와 인증체계
68. 개인정보인증(PIPL-Personal Information Protection Level)
69. PMS (Patch Management System)
70. 기업 정보 보호 차원에서 위험 관리(Risk Management)방안
71. 전사 보안 감독 위원회(Enterprise Wide Security Oversight Committee) 구성과 역할
72. 개인정보관리책임자(CPO: Chief Privacy Officer)
73. OECD 개인 정보보호 8대 원칙
74. ISMS, PIMS 등 정보보호·개인정보보호 관리체계의 통합 이력과 현행 ISMS-P의 효율성 및 실효성 향상 방안
75. 개인정보의 개념과 국내 개인정보법률을 설명하고, 빅데이터(Big Data)등 신 산업 육성 시 규제 측면의 고려 사항
76. CCL(Creative Commons License)
77. SSO(Single Sign On)(1교시형)
78. SSO(Single Sign On)(2교시형)
79. 접근통제(Access Control)의 물리적, 관리적, 기술적 통제 방안
80. 접근통제(Access Control)의 절차
81. 정보보안의 접근 통제 유형
82. 커베로스(Kerberos) 인증 프로토콜
83. AAA(Authentication, Authorization, Accounting)
84. 생체인식기법의 특징과 다중 생체 인식 기술
85. I-PIN 2.0
86. PKI (Public Key Infrastructure)

PART 5. 네트워크 보안
87. 방화벽(Firewall)
88. 침입차단시스템(Firewall)의 구성 형태
89. 침입탐지 시스템(IDS: Intrusion Detection System)의 실행 단계
90. 침입탐지 시스템(IDS)를 사용하여 Suspicious Packet(자료)를 수집 방법
91. 비정상 침입 탐지(Anomaly Detection)와 오용침입탐지(Misuse Detection)
92. 침입차단 시스템과 침입탐지 시스템을 비교
93. VPN(Virtual Private N/W)의 적용 기술
94. IPSec의 AH및 ESP의 상세구조와 각 필드의 보안상 용도
95. SET(Secure Electronic Transaction)과 SSL(Secure Socket Layer)
96. EAM(Enterprise Access Management)
97. ESM(Enterprise Security Management)
98. UTMS(Unified Threat Management System)
99. RSM(Risk Management System)
100. Honey Pot의 동작원리, 구성, 주요기능
101. TCP의 정상적인 3-Way Handshaking 과 TCP SYN Attack 방법과 해결 방안
102. TCP SYN Attack에서 L7 스위치로 대응할 수 있는 방법

PART 6. System 보안
103. TEE/SEE(Trusted Execution Environment/Secure)
104. TPM(Trusted Platform Module)
105. Trust Zone
106. 무선 LAN(Local Area Network)의 보안 위협
107. 무선 LAN 보안(2교시형)
108. IEEE 802.11i
109. Gray Hacker
110. Smart Work 의 보안이슈(Issue)와 이슈 대처 방안
111. 클라우드 컴퓨팅(Cloud Computing)
112. DB(Data Base)보안
113. Software 보안 테스트 방법론
114. 운영체제에서 보안 커널(Kernel)구현 전략 및 개발방법
115. Smart Grid 보안
116. 디지털 포렌식(Digital Forensics)
117. 컴퓨터(Computer) 포렌식(Forensic)
118. 스마트 폰(Smart hone) 포렌식(Forensic).
1) 스마트 폰(Smart hone) 포렌식 Data와 절차
2) 스마트폰내의 Data 추출 방법
119. 안티포렌식(Anti- Forensics)
120. OWASP(Open Web Application Security Project)-Web App. 보안

PART 7. 전송 데이터 무결성 확보 방안
121. 해밍코드(Hamming Code)의 오류 검색과 수정방법, 활용방안
122. 순방향 에러 발견(Forward Error Detection) 절차를 다이어그램, CRC(Cyclic Redundancy Check) 값을 구하는 과정
123. 2차원 짝수 패리티를 사용, 단일 비트 오류 발견(Detection)과 정정(Correction) 과정
124. Internet Checksum 생성 및 검증 과정

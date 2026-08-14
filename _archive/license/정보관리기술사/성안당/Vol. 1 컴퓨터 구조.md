# 학습 가이드

## 권장 흐름

`컴퓨터 구성과 ISA → CPU 명령어 처리 → 메모리 계층과 캐시 → 파이프라인과 병렬처리 → 성능평가 → I/O와 저장장치`

## 학습 깊이

- **핵심**: CPU/ISA, 명령어 사이클, 메모리 계층, 캐시, MMU/TLB, 파이프라인, 인터럽트/DMA, 성능평가
- **연결**: RAID/Flash/SSD, 멀티코어, GPU, 병렬성. 운영체제와 클라우드의 기반 개념까지만 연결한다.
- **조회**: 논리회로 계산, 개별 인터페이스와 디스플레이 규격, 특정 세대 제품은 기출이나 비교가 필요할 때 확인한다.

## 회독 종료 기준

- 프로그램이 명령어로 실행되고 메모리와 I/O를 거치는 과정을 한 장으로 설명할 수 있다.
- 캐시, 가상메모리, 파이프라인의 목적과 병목 해결 방식을 비교할 수 있다.
- CPI와 Amdahl의 법칙을 이용한 대표 성능 문제를 풀 수 있으면 세부 회로로 더 들어가지 않는다.

# 목차
Part 1. CPU(Central Processing Unit)
1. Computer의 5대 구성요소
2. Computer System의 구성요소와 발전 방향
3. Stored Program Computer 개념을 제시한 폰노이만 컴퓨터(Von Neumann Computer) 구조의 특징과 문제점, 해결방안(Harvard 구조와 비교)
4. 폰노이만(Von Neumann)과 하버드(Harvard) 컴퓨터 구조
5. CPU(Central Processing Unit)
6. 컴퓨터 명령어 집합인 CISC와 RISC
7. 아래 연산을 CISC와 RISC 명령어 구조로 연산하는 예를 들고 CISC와 RISC에 대해 비교

X=(A＋B)×(C＋D)

8. CPU 명령어 형식의 유형에 대해 설명하고 산술식 Y＝A×(B＋C)에 대해 0 주소, 1 주소, 2 주소, 3 주소 명령 방식을 아래 명령어를 선택하여 기술하시오. (PUSH, POP, MUL, ADD, LOAD, STORE, MOV 명령)
9. 컴퓨터 시스템에서 System Bus
10. CPI(Cycles Per Instruction) 개념을 설명하고 Processor 성능 향상 방안
11. CPU명령어 사이클(Cycle)
12. CPU Major State
13. CPU의 Major State를 Flowchart화 하여 설명하시오.
14. 명령어 집합구조(ISA)
15. 아래 ADD(덧셈) 명령어의 CPU 실행 사이클(Execution Cycle)동작에 대해 설명하시오.

ADD addr(주소) 명령어

16. CPU의 명령어 인출 사이클(Fetch Cycle)동작에 대해 설명하시오(IF: Instruction Fetch) 17. 인터럽트(Interrupt) Cycle이 추가된 명령어 사이클에 대해 설명하시오.
18. ALU(Arithmetic Logic Unit)
19. 제어유니트(Control Unit)의 구성과 구현방법
20. 고정 배선(Hard wired)방식과 Micro-Programming 방식
21. 제어 신호 생성을 위한 수직적, 수평적 마이크로 프로그래밍
22. 컴퓨터 메인보드(Main Board)에서의 North Bridge와 South Bridge
23. Multi-Core 간의 인터페이스 기술 발전과 CPU와 주변장치 간의 인터페이스의 필요성 24. CPU Register의 종류를 들고 기능을 설명

Part 2. Memory
25. 메모리 계층구조(Memory Hierarchy)
26. 메모리 계층구조에서 캐시(Cache)메모리(Memory)의 주요 개념을 설명하시오.
27. 메모리 계층구조(Memory Hierarchy)에 대해 기술하고 Cache Memory와 Virtual(가상) Memory 비교
28. Cache Flush, Cache Clean, Cache Invalidate
29. 메모리(Memory) 병목(Bottleneck)현상 최소화 방안에 대해 설명하시오.
30. Flash Memory를 RAM과 EEPROM과 비교
31. PRAM(Phase Change Memory RAM)
32. MMU(Memory Management Unit)
33. TLB(Translation Look Aside Buffer)
34. Memory 인터리빙(Interleaving)
35. RAID(Redundant Array of Independent Disks)
36. SRAM과 DRAM를 비교하고 DDR SDRAM의 핵심기술
37. NAND Flash에서 Write(쓰기), Read(읽기), Erase(삭제) 과정을 상세히 설명하시오.
38. Flash ROM의 프로그래밍, Read, Erase동작을 설명, NOR와 NAND Flash의 차이점
39. ROM의 종류 및 특징
40. FTL(Flash Translation Layer)의 개념 필요성 동작방법, Mapping 방법
41. Flash Memory 타입(Type)에는 SLC, MLC, TLC, QLC 타입으로 구분할 수 있다. 각각에 대해 설명하고 특징을 비교하시오.
42. FTL(Flash Translation Layer)구조에 대해 상세하게 설명하시오.
43. FTL(Flash Translation Layer)의 핵심기술인 Wear Leveling, Garbage Collection, Over Provisioning과 SSD 관련 기술인 NCQ(Native Command Queuing), TRIM 동작에 대해 각각 설명하시오. 44. SSD(Solid-State Drive)
45. SSD(Solid-State Drive)와 HDD(Hard Disk Drive) 차이점
46. CPU 관점에서 주기억장치 Access Time이 400ns이고 Cache Access Time이 50ns일 때 캐쉬의 적중률이 90%라면 평균기억장치 Access Time은 몇 ns인가?
47. 두 계층으로 이루어진 기억장치시스템에서 첫 번째 계층의 기억장치 액세스 시간이 40ns이고 두 번째 계층의 기억장치 액세스 시간은 400ns이다. 아래 2가지 질문에 답하시오.
문1) 첫 번째 계층의 기억장치에 대한 적중률이 90%일 때 평균기억장치 액세스 시간을 구하시오.
문2) 첫 번째 계층의 기억장치에 대한 적중률이 0%부터 20% 간격으로 100%까지 변할 때의 평균기억장치 액세스 시간들을 구하여 그래프를 그리고 결과에 대해 설명하시오. 단, 그래프의 x축은 적중률, y축은 액세스 시간으로 한다.
48. 아래 3개 문제에 대해 답변하시오.
문1) 컴퓨터시스템에 디스크 캐쉬를 도입함으로써 평균 디스크 액세스 시간이 20ms에서 8.3ms로 감소되었다. 디스크 캐쉬의 적중률(Hit Ratio)이 60%라면 디스크 캐쉬의 Access Time은 얼마인가?
문2) 주기억장치 Access Time이 300ns, 캐쉬(Cache) 액세스 타입이 60ns인 시스템에서 기억장치 Access가 1000번 수행되었다. 그 중의 60%는 읽기동작이고 40%는 쓰기동작이였으며 평균적중률은 80%였다. Cache Write 정책인 Write-Through와 Write-Back 방식에서 각각의 평균기억장치 Access Time을 구하시오.
문3) 두 계층의 Cache를 가진 시스템에서 첫 번째 계층의 Cache인 L1의 Access Time은 25ns, 두 번째 계층의 캐쉬인 L2의 Access Time은 80ns이고 주기억장치 Access Time은 250ns이다. L1 적중률이 75%이고 L2의 적중률은 90%일 때 평균기억장치 Access Time을 구하시오.

Part 3. 병렬 컴퓨터
49. 명령어 파이프라이닝(Pipelining)
50. Superscalar와 VLIW(very Long Instruct
51. EPIC(Explicitly Parallel Instruction Computing)
52. 명령어 수준 병렬성(ILP)차원에서 슈퍼스칼라(Superscalar), VLIW(Very Long Instruction Word), 슈퍼파이프라인(Superpipeline)의 개념과 특징에 대해 설명하시오.
53. 병렬컴퓨터의 파이프라이닝과 벡터 프로세싱(1교시)
54. 4단계 명령어 파이프라이닝(Pipelining)
55. 병렬컴퓨터의 파이프라이닝과 벡터 프로세싱에 대해 비교 분석(2교시)
56. 명령어 파이프라인의 해저드(Hazard) 발생 유형 3가지의 원인, 해결책
57. 2단계, 4단계 6단계 명령어 파이프라인, Data 해저드(Hazard)의 발생 원인과 해결 방안
58. 병렬컴퓨터를 위한 SMP, MPP, NUMA
59. 병렬처리(Parallel Processing), 그레인(Grain)

Part 4. DMA와 Interrupt 및 I/O Interface
60. DMA(Direct Memory Access)
61. Locality(지역성) 원리와 활용사례
62. Interrupt 구동 I/O.
63. Interrupt의 처리과정과 종류, Interrupt 중첩(Nesting)
64. Interrupt를 처리하고 있는 프로세서에 또 다른 인터럽트가 발생되었을 때 조건에 따른 그 처리 방법
65. I/O(입출력)방식인 다중 Interrupt, Daisy chain 방식, SW(Software) Polling 방식
66. RS-232C
67. 직렬(Serial) 인터페이스인 RS-232C, SPI(Serial Peripheral Interface), I2C(Inter Integrated Circuit), IrDA(Infrared Data Association)에 대해 각각 설명하시오.
68. I2C Interface의 특징과 동작 순서
69. SPI(Serial Peripheral Interface)의 신호구성과 동작 예, 그리고 장단점에 대해 기술하시오.
70. IEEE 1394와 USB 인터페이스
71. DVI와 HDMI 규격
72. MHL 3.0(Mobile High Definition Link 3.0)
73. SATA(Serial Advanced Technology Attachment)
74. IEEE 1394와 USB
75. USB(Universal Serial Bus) 3.0의 Protocol Stack, 핵심 기술, USB2.0과 비교
76. USB3.0의 핵심기술과 USB2.0과 비교
77. USB(Universal Serial Bus) 3.1
78. Thunderbolt 인터페이스(1교시)
79. Thunderbolt 인터페이스 설명(2교시)
80. PCI-Express 인터페이스
81. PCI(Peripheral Component Interface)-Express의 등장배경, Protocol Stack, PCI와 비교, 복수링크 전송방법에 대해 기술하시오.
82. I/O 주소 지정(I/O Addressing) 방식
83. 아래는 프린트 I/O제어기 내부 구조의 일부이다. 데이터레지스터(Printer_Data_Register)와 상태제어레지스터(Printer_Status_Register)가 있고, 각각 8Bit 레지스터이며 상태제어레지스터의 제어정보는 아래와 같다. 사용자 프로그램에서 ‘ABCDEF’라는 6개 문자열을 프린트하고자 한다. Programmed I/O방식에 대한 설명과 아래 Programmed I/O방식으로 프린터에 문자열 쓰기 Program 예시에 대한 구체적인 동작 과정을 기술하시오.
84. 아래 조건에서 기억장치-사상 I/O(Memory Mapped I/O)방식으로 프린터에 출력하는 프로그램을 작성하시오.

〈조건〉
1. Data Register 주소 : 412번지
2. 상태/제어 Register 주소 : 413번지
3. 상태 Register 최하위 Bit(b0) : Ready 비트로 사용
4. 제어 Register 최상위 Bit(b7) : 프린트 시작 비트로 사용

85. 아래조건에서 분리형 I/O(Isolated I/O)방식으로 프린터에 출력하는 프로그램을 작성하시오.

〈조건〉
1. Data Register 주소 : 412번지
2. 상태/제어 Register 주소 : 413번지
3. 상태 Register 최하위 Bit(b0) : Ready 비트로 사용
4. 제어 Register 최상위 Bit(b7) : 프린트 시작 비트로 사용


Part 5. 신기술
86. SPEC(Standard Performance Evaluation Cooperative)
87. 정보기술 측면에서 UI(User Interface)와 UI의 시대적 요구 변화 내용
88. 증강현실과 가상현실 비교, 모바일 증강현실 구현하기 위한 Hardware 설명하시오.
89. MR(Mixed Reality)에 대해 설명하시오.
90. 가상현실(Virtual Reality)은 ICT 및 인프라의 발달로 지속 확산되고 있다. 가상현실의 개념, 확산요인, 생태계 현황 및 시사점에 대하여 설명하시오.
91. 스마트 더스트(Smart Dust)에 대해 설명하시오.
92. HDTV의 특성
93. SMART TV의 기술 요소
94. SCM(Storage Class Memory)
95. 인 메모리(In Memory) Computing에 대해 설명하시오.
96. PM-OLED와 AM-OLED
97. UHDTV(Ultra HDTV)
98. UHDTV의 방송시스템 개발 방안(미디어 획득부터 디스플레이까지의 과정)
99. BYOD(Bring Own Your Device)
100. 통합스토리지(Unified Storage)
101. VDI(Virtual Desktop Infrastructure)의 구성과 핵심 기술 요소
102. OSHW(Open Source Hardware)
103. BD(Blu-ray Disc)에 적용된 Contents 보호 기술 3가지
104. 3D프린터의 제약사항과 해결방안, 3D 프린터의 활용 분야
105. Wearable 기기의 구현기술과 Smart Watch Device의 기능
106. Flexible Display 유형과 핵심 기술
107. 무선전력전송(WPT: Wireless Power Transfer) 기술
108. Wearable Device에 적용되는 방수 및 방진의 등급
109. Wearable Device 중 방수 제품의 방수 방법에 대한 적용 기술
110. RFID(Radio Frequency Identification)
111. COS(Chip Operating System)
112. Smart Phone Sensor
113. Simultaneous Multi-Threading
114. UI(User Interface)의 시대적 변화
115. SoC(System On Chip)
116. SIP(System In Package)
117. Touch Screen의 방식 및 동작 원리
118. Barcode와 RFID의 장단점
119. Touch Panel
120. MEMS(Micro Electro Mechanical System)
121. VTL(Virtual tape Library)
122. BCI(Brain Computer Interface)
123. 디지털 홀로그래픽 디스플레이(Digital Holographic Display)
124. 홀로그래피(Holography), 홀로그램(Hologram)
125. DVFS(Dynamic Voltage and Frequency Scaling)
126. CPU의 동작을 감시하는 워치독 타이머(Watchdog Timer)에 대하여 기술하고 하드웨어 구현 방법을 설명하시오.
127. 아래 System과 같이 메인(Main) CPU에서는 주 프로그램이 운용 중이고 보조 CPU에서는 Watchdog이 운용 중이라고 가정한다. 보조 CPU에서 동작될 수 있는 Watchdog Timer의 동작과정을 기술하시오.

Part 6. 논리회로
128. 논리 Gate의 종류
129. MUX(Multiplexer)와 DEMUX에 대해 설명하시오.
130. 밀리머신(Mealy Machine)과 무어머신(Moore Machine)
131. 카노프 맵(Karnaugh Map)
132. 세 변수맵을 이용하여 다음 부울식 간소화
133. 주어진 부울함수에 대해 카노프맵을 사용하여 간소화
134. 논리회로(소자)에서 Setup Time과 Hold Time
135. 논리회로에서 Fan-in, Fan-out 개념
136. Open Collector와 Open Drain
137. 논리회로에서 풀업(Pull-Up)과 풀다운(Pull-Down) 레지스터
138. CMOS와 TTL에 대해 설명하고 비교하시오.
139. CMOS와 TTL의 잡음여유도에 대해 설명하시오.
140. 조합논리회로와 순차논리회로에 대해 설명 및 비교
141. 논리회로에서 Latch와 Flip-Flop
142. 논리회로에서 래치(Latch)와 플립플롭(Flip-Flop)에 대해 설명하시오.
143. 플립플롭(Flip-Flop)의 4가지 종류에 대해 도식화 한 후 설명
144. RS Flip-Flop에서 R=1, S=1일 때 불확실 또는 부정이 발생되는 원인
145. 3상태 버퍼(Three State Buffer)의 활용방안
146. 3상태 버퍼를 이용하여 2-to-1 MUX 설계
147. 정적-1 해저드(Hazard)의 발생 예, 설명, 제거하기 위한 방법
148. RS, JK, D, T 플립플롭의 여기표와 특성 방정식
149. 16x4 RAM Chip 두 개를 활용하여 16×8Bit 회로를 구성
150. 입력변수 X,Y,X에 대한 조합 논리 회로 설계 (문제 참조)
151. 부울대수(Boolean Algebra)의 규칙을 활용하여 아래의 부울함수를 간략화하고 구현된 회로를 작성하시오.

F(A, B, C, D)＝A′B′CD＋A′BCD＋AB′CD＋ABC′D＋ABCD

152. 부울대수(Boolean Algebra)의 규칙을 활용하여 아래의 부울함수를 간략화 하시오.

F(A, B, C, D)＝A′B′CD＋A′BCD＋AB′CD＋ABC′D＋ABCD

153. F(A, B, C)=Σ(1, 2, 3, 4, 5, 7)에 대하여 NAND Gate를 이용한 Logic Diagram을 도식하시오.
154. 8bit 데이터 버스와 14bit 주소 버스로 구성된 Micro-System 회로 구현(문제 참조) 155. Positive Edge Triggered J-K Flip-Flop을 사용하여 상태 순차 000, 001, 011, 100을 반복하는 동기식 Counter를 설계하시오. (단, 3상태 101, 110, 111이 발생하는 경우에는 다음 상태에서 000이 된다.)
156. J-K Flip Flop을 사용하여 아래 3-Bit 2진 Counter를 설계하시오.
157. JK Flip Flop을 사용하여 아래와 같이 주어지는 상태도에 대해 Counter 회로를 설계하시오(미사용 상태인 010,100상태에 대해서는 Don’t Care 상태로 처리하시오).
158. 8Bit 데이터(Data) Bus와 16Bit Address Bus로 구성되는 마이크로컴퓨터 시스템에서 아래와 같은 조건으로 기억장치를 설계하고자 한다. 회로를 설계하시오.

메모리 용량 : 1K Byte RAM, 1K Byte ROM
주소영역은 RAM은 0번지부터 ROM은 800H 번지부터 사용가능한 Chip(칩)들은 256Bx8Bit RAM, 1KBx8Bit ROM
RAM의 제어신호는 RD, WR, CS(Chip Select)이고 ROM의 제어신호는 RD, /CS이다.
(“ / ”는 Active Low 신호이고 표기가 없으면 Active High임)

159. Programmable Switch(프로그래머블 스위치)인 PLA, PAL, CPLD, FPGA에 대해 설명하시오.
160. FPGA의 개념, 구성 그리고 CPLD와 비교
161. ASIC(Application Specific Integrated Circuit)의 종류와 설계과정, 설계방법론
162. 하드웨어(Hardware) 설계 방법 중에 하나인 VHDL에 대해 설명
163. PLL(Phase Locked Loop)
164. Ripple Carry Adder보다 빠른 가산기 3가지
165. Clock Skew
166. Crosstalk 현상의 개념, 원인, 해결책, 사례 그리고 최근 이슈

Part 7. 컴퓨팅(Computing)
167. MTBF, MTTF, MTTR, MTFF에 대해 설명하시오.
168. 암달(Amdahl’s) 법칙(Law)
169. 암달(Amdahl’s)공식을 활용한 시스템 성능향상도이다.

시스템 성능 향상도=1/((1-P)+(P/S))
* P = 속도 향상 가능 부분, S = 속도향상배수

시스템 속도 향상 가능 부분은 아래와 같을 때 각각의 질문에 답하시오.
1) CPU Clock Speed를 2배로 가속했을 때 성능향상은?
2) 부동소수연산 가속기를 2배로 했을 때 성능향상은?
3) 입출력(I/O)속도를 2배(즉, BUS 구조, 캐쉬, 디스크 등 시스템 아키텍처를 최적화)로 했을 때 성능 향상은?
4) Network 속도를 2배로 증가했을 때 성능향상은?
170. Grid Computing
171. Wearable Computing의 주요기술과 해결과제
172. 자가적응형 컴퓨팅(Self-Adaptive Computing)에 대해 기술하시오.
173. 자율컴퓨팅(Autonomic Computing)
174. 클라우드 컴퓨팅(Cloud Computing)
175. 엣지 컴퓨팅(Edge Computing)
176. 상황인식 컴퓨팅(Context Aware Computing)
177. 양자컴퓨터의 특징과 양자컴퓨터와 기존컴퓨터 간 비교 설명하시오.
178. 컴퓨터시스템의 성능평가 방법에 대해 설명하시오.
179. CPU 성능측정(CPU Utilization, Throughput, Turnaround Time, Waiting Time, Response Time)
180. CPU의 병행성(Concurrency)과 병렬성(Parallelism)
181. GPGPU(General Purpose computing on Graphics Processing Unit)

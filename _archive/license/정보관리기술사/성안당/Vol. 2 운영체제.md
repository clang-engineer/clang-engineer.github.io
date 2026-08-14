# 학습 가이드

## 권장 흐름

`커널과 시스템 콜 → 프로세스와 스레드 → CPU 스케줄링 → 동기화와 교착상태 → 메모리 관리 → 파일과 I/O`

## 학습 깊이

- **핵심**: 프로세스/스레드, 문맥 교환, 스케줄링, 임계구역과 동기화, 교착상태, 가상메모리, 파일시스템, I/O
- **연결**: 실시간/임베디드 OS, 가상화, 고가용성, 시스템 튜닝. 컴퓨터 구조 및 클라우드와의 관계까지만 이해한다.
- **조회**: C 언어 문법, 모바일 앱 개발, 특정 운영체제와 제품은 관련 문제가 나올 때 확인한다.

## 회독 종료 기준

- 프로세스 생성부터 CPU 배정, 동기화, 메모리 할당, I/O 완료까지의 흐름을 설명할 수 있다.
- 대표 스케줄링과 페이지 교체 문제를 풀고, 교착상태의 조건과 대응책을 비교할 수 있다.
- 세부 커널 구현보다 자원관리의 목적과 선택 기준이 보이면 다음 과목으로 이동한다.

# 목차
PART 1 OS(Operating System)

1. 운영체제
2. 운영체제의 기능과 역할
3. Windows OS의 Booting 순서
4. Process
5. Thread
6. Multi-Thread
7. 내부 단편화와 외부 단편화
8. Context Switching
9. Unix System에서 파일이나 디렉토리 접근제한 기능인 umask
10. Unix System Call 동작 과정
11. Unix File System의 개념, 구조, 특징 및 inode 설명
12. Application과 Kernel 통신방법에서 Non-blocking I/O와 Blocking I/O에 대해 비교
13. Application과 Kernel 간 비동기 I/O(Asynchronous I/O) 제어 방식
14. 마이크로 커널(Microkernel)과 Monolithic 커널
15. 클라우드 인프라 관리 플랫폼 OpenStack
16. Embedded OS의 특징과 기능
17. 실시간(Realtime) 운영체제
18. Tiny OS(운영체제) 구조와 Tiny OS에 적용되는 Kernel Scheduler 동작
19. Embedded System 개발을 위한 Cross development(교차 개발)환경과 Debugger의 종류
20. Embedded System과 Embedded Software의 특성
21. Embedded System의 메모리 최적화 방안
22. 자동차용 Embedded System 기술
23. Buffer와 Buffering 그리고 Cache와 Caching의 개념, 시스템에서의 활용 예, 활용시의 주의사항

PART 2 스케줄링(Scheduling)

24. CPU Scheduling
25. CPU 스케줄러의 종류
26. 선점형 스케줄링과 비선점형 스케줄링
27. Round Robin 스케줄링 기법(Process 도착 시간을 고려하시오)
28. Fixed Time Slice 알고리즘
29. 아래 주어진 표에서 Job의 종류를 J1 J2 J3 순으로 실행 시 39초가 소요되는 원인과 Job 실행순서를 변경 했을 때의 시간을 각각 구하고 적절한 스케줄링 시 몇 초까지 실행시간을 단축할 수 있는지 논리적으로 설명하시오
30. 비선점 스케줄링 방식인 FCFS와 SJF의 동작 원리
31. 아래 Table 상황에서 SRT(Shortest Remaining Time) 스케줄링 알고리즘을 사용하여 평균 대기 시간과 평균 반환 시간을 구하시오
32. MLQ(Multi-Level Queue)와 MLFQ(Multi-Level Feedback Queue)
33. SJF(Shortest Job First) 방식에서 기아현상(Starvation) 현상을 HRRN(Highest Response Ratio Next) 방식으로 완화하는 원리를 설명하시오
34. Round Robin(도착시간 고려하지 않아도 됨) 스케줄링
35. 우선 순위 역전(Priority Inversion) 발생 원인
36. 우선 순위 역전(Priority Inversion) 방지 방법
37. Hard real time 스케줄링 방식인 RM(Rate Monotonic)과 EDF(Earliest Deadline First)
38. HDD(Hard Disk Drive)의 Disk Access Time
39. NCQ에 대해 설명하고 HDD의 Disk 스케줄링 기법 6가지

PART 3 동기화, C-언어 기출 외

40. 세마포어(Semaphore) 연산
41. 은행가 알고리즘(Banker’s Algorithm)
42. 교착상태(Dead Lock)의 발생 원인과 해결 방안
43. C언어에서의 지역변수
44. C언어 Extern, Auto, Static, register 변수, Coding 각 변수 비교
45. C언어 Macro, Function, Inline의 Coding, 공통점, 차이점, 장·단점을 기술
46. Module화 기법인 Macro, Function, Inline 각각의 개념을 공통점, 차이점, 장단점 위주로 설명하고 Embedded S/W 개발 환경에서의 활용 지침을 제안
47. Processor의 주소 지정 방식의 유형 분류, 이를 이용하여 C 언어 등 Programming 언어의 지역(자동)변수 개념
48. 제작된 Mobile App.을 신규로 App. Store에 등록하기 위한 절차와 Code 서명 인증서 발급 방법
49. Mobile App.(Native, Web, Hybrid App.)의 분류 및 특징
50. Android OS 적용, 개발 방법에서 SDK, NDK, PDK개발 방법
51. OSS(Open Source S/W) 거버넌스(Governance)
52. ISP(In System Programming)

PART 병렬 프로세서, Memory 제어 기술

53. 병렬 프로세서 Cache 일관성 유지를 위한 방법인 MESI와 Cache Directory 기술
54. 병렬컴퓨터 프로세서 동기화와 상호배타 방식
55. Process 간 Data통신 IPC(Inter Process Communication)의 4가지 유형 및 비교
56. Cache Memory
57. Cache Write Policy(정책)
58. Cache 일관성(Coherency) 문제 원인, 해결책, 처리과정, 사례
59. 가상메모리(Virtual Memory)
60. 메모리 할당 기법인 First-Fit, Best-Fit, Worst-Fit 기법
61. Memory 할당 기법인 Paging 기법
62. 가상메모리(Virtual Memory)의 사용 이유
63. 가상메모리의 Paging 및 Segmentation 기법
64. Thrashing의 발생원인, 발견방법, 해결 및 회피 방안

PART 5 I/O 제어 및 신기술

65. 버스 중재 개념, 신호, 직렬식, 병렬식, 점대점 방식에 대해 비교
66. 버스 중재 기법인 데이지체인(Daisy Chain)
67. Interrupt 구동 IO 방식과 Programmed IO 방식에 대해 설명하고 비교
68. 운영체제에서 I/O 디바이스를 위한 Polling 방식과 Interrupt 방식을 설명하고 장단점을 비교
(Interrupt는 데이지체인 방식을 고려하시오)
69. 그린 운영체제(Green Operating System)
70. Clustering과 HA(High Availability)에 대해 설명하고 비교
71. 파레토(Pareto)법칙이 소프트웨어 공학과 운영체제에서 어떻게 활용되고 있는지 설명
72. 가상화(Virtualization)
73. UEFI(Unified Extensible Firmware Interface)
74. System Tuning 절차와 방법
75. XIP(eXecution In Place)
76. Cloud Computing 표준화 동향 및 전략
77. Cloud Computing의 스토리지 가상화
78. Mobile Cloud
79. Linux OS의 Journaling File System
80. System(SMP 서버 및 저장장치) 증설이 필요할 경우 성능분석과 용량 산정시의 고려사항
81. UI(User Interface)와 UX(User Experience)를 비교하고 UX의 기술적인 요소
82. Computer의 성능을 측정하기 위한 Throughput, Turnaround Time, Response Time을 설명
83. Computer 시스템의 신뢰도 향상을 위해 사용되는 방법 중의 하나인 체크포인팅(Check Pointing) 전략(Strategy)

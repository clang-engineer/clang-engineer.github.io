# 학습 가이드

## 권장 흐름

`요구공학 → SDLC와 개발방법론 → 분석·설계와 UML → 아키텍처와 패턴 → 구현·형상관리 → 테스트·품질 → 프로젝트 관리와 EVM`

## 학습 깊이

- **핵심**: 요구사항, SDLC, Agile, UML 핵심 다이어그램, 아키텍처, 테스트/V&V, 품질, 형상관리, 프로젝트 관리
- **연결**: 객체지향, 디자인 패턴, 재사용, 프로세스 개선, EVM. 산출물과 생명주기 간 관계를 중심으로 본다.
- **조회**: 언어별 코딩 세부사항, 개별 라이선스, 폐지된 표준번호는 비교나 기출이 필요할 때 확인한다.

## 회독 종료 기준

- 요구사항이 설계·구현·시험·운영 산출물로 추적되는 전체 생명주기를 설명할 수 있다.
- 방법론, 아키텍처, 테스트 기법을 상황과 품질속성에 따라 선택·비교할 수 있다.
- 표준번호 암기보다 목적, 구성, 산출물, 적용 기준을 답안 목차로 재현하면 다음으로 이동한다.

# 목차
PART 1. Software 공학
1. Software의 정의, 분류, 특성
2. Software의 개념, SW의 유형
3. Software 위기와 이를 해결하기 위한 방안
4. Software 공학이란 무엇이며 S/W 공학의 구성요소와 원리
5. IEEE 산하 S/W 공학 표준 위원회에서 S/W 공학의 근본 지식을 규정한 SWEBOK(SW Engineering Body Of Knowledge)
6. S/W 산업 육성 전략
7. S/W의 설계 원리 중 모듈(Module)화에 대해 설명하시오.
8. S/W 설계 원리에서 분할과 정복(Divide & Conquer)
9. Software 난독화(Obfuscation)
10. Software의 재사용(Reuse)의 활용, 목적, 구현 방법
11. Software 관리를 위한 기준선(Baseline)
12. Module, Component, Service에 대해 각각 설명하고 비교하시오.
13. 임베디드(Embedded) Software
14. S/W의 생산성 향상 기법인 역공학(Reverse Engineering)과 재공학(Re-Engineering).

PART 2. Software 개발 모형(모델)
15. SDLC(S/W Development Life Cycle)
16. 폭포수(Waterfall) 모델(Model)
17. 프로토타이핑(Prototyping) 모델(Model)
18. 나선형(Sprial) 개발 모델(Model)
19. 증분형(Incremental)과 진화형(Evolutional) 모델(Model)
20. RAD(Rapid Application Development) 모델
21. Clean Room 개발 모형(모델)에서 3가지 Box 구조
22. SDLC 모델 선정기준과 각 모델의 상관 관계
23. SDLC(Software Development Life Cycle)과정에서 구현 단계에서의 Action Item(Activity)과 일정 지연이 발생되었을 때 PM(Project Manager) 입장에서의 대처 방안
24. SDLC 과정에서 필요한 Review, Inspection, Walkthrough
25. 전통적인 S/W 개발 Model과 OSS(Open Source Software)개발 Model의 차이점

PART 3. S/W 개발 방법론
26. S/W 개발 방법론(구조적, 정보공학, 객체지향, CBD 개발 방법론)
27. Agile Process
28. S/W 개발 방법론인 Agile Methodology의 정의, 특성, 장단점
29. 모바일(Mobile) App. 개발의 특성과 이슈에 대해여 설명하고 애자일(Agile)을 활용하여 모바일 개발 환경에 적합한 개발 방법을 제시
30. TDD(Test Driven Development)
31. SPL(Software Product Line)
32. XP(eXtreme Programming)
33. RUP(Rational Unified Process)
34. XP(eXtreme Programming)와 RUP 비교
35. SCRUM
36. MDD(Model Driven Development)
37. 모델 기반의 S/W 개발 방식, MDA(Model Driven Architecture)
38. DevOps(Development + Operation)
39. Kanban S/W 개발 방법론에 대해 설명하고 SCRUM 방법과 비교
40. CASE(Computer Aided Software Engineering)
41. 린(Lean) 개발 방법론

PART 4. UML(Unified Modeling Language)
42. Modeling를 정의하고 목적과 Software에서 Modeling 이 필요한 이유
43. UML(Unified Modeling Language)에 대해 정의하고 특징과 개발 방법론과의 관계
44. S/W 공학에서 모델링(Modeling)의 개념과 모델링언어로 UML이 필요 이유
45. UML(Unified Modeling Language)에 대해 구성요소
46. UML의 구성요소 중 사물(Thing)의 세부 내용
47. 모델링(Modeling)과 프로그래밍(Programming)을 비교하고 개발과정에서 적용되는 UML Diagram의 종류
48. UML의 4+1 View 모형(Model).
49. UML의 4+1 View Model을 설명하고 SDLC 과정 적용
50. UML에서 관계(Relationship)표시는 6가지(연관, 의존, 일반화, 실체화, 집합연관, 합성연관)관계로 표시된다. 각각 설명하고 실생활에서 사용되는 예를 Notation(도식화)
51. 다음의 Class Diagram를 자바 Code로 작성하고 정보은닉에 사용된 접근 제어자에
대해 설명하시오.
52. 다음 Class Diagram을 자바(JAVA) Code로 변환하시오.
53. 다음 UML 시퀀스(Sequence) 다이어그램(Diagram)을 설명하고 JAVA Code로 구현하시오.
54. 다음의 구성 객체를 이용하여 Sequence Diagram으로 표시하시오(내용을 상세히).
55. 아래와 같은 전자계산기를 객체 지향 언어를 사용하여 생성하고자 한다. Class Diagram 으로 표기하는 방법에 대해 설명하시오.
56. UML2.0(4계층과 4가지 영역위주로)
57. SW 제품이 시장에 출시된 후 사용자로부터 예기치 않은 문제점이 있다고 Service Desk에 접수되었다. SLA(Service Level Management)에는 3일 이내에 개선 대응해야 한다고 명시되어 있다. 3일 이내에 Issue를 개선(Clear)하는 과정을 UML의 Timing Diagram 으로 기술하시오(개선은 개발 담당자, 검증은 품질 담당자가 진행하며 각각 1일씩 소요된다고 가정한다).
58. 아래 Code에 대해 Class Diagram으로 표현하고 설명하시오.
59. UML의 확장 메커니즘(Extensibility Mechanism) (Stereotype 사용에 대해 예를 들어 설명하시오)
60. 아래 UML의 스테레오(Stereotype)를 JAVA 언어로 Coding 하고 많이 사용되는 Stereotype 3가지 이상 나열해서 설명하시오.
61. UML의 State Machine Diagram 에 대해 설명하고 엘리베이터(Elevator)의 예를 들어 State Machine Diagram으로 표시하시오.
62. UML의 연관(Association)관계와 방향성이 있는 연관(Directed Association)에 대해 예를 들어 설명하고 Directed Association에 대해서는 예제 상황을 들어 Coding 하시오.
63. UML의 일반화(Generalization) 관계에 대해 예제 상황을 들어 설명하고 Coding하시오
64. UML의 실체화(Realization) 관계에 대해 예제 상황을 들어 설명하고 Coding하시오.
65. UML의 의존(Dependency) 관계에 대해 예제 상황을 들어 설명하고 Coding하시오.

PART 5. 디자인 패턴(Design Pattern)
66. 디자인패턴(Design Pattern)
67. 디자인패턴의 종류를 기술하고 각 패턴 별 간단한 설명과 활용예
68. Prototype 패턴(Pattern)
69. Singleton Pattern
70. 객체지향 개념에서 추상화(Abstract)에 대해 정의하고 추상 클래스(Class)를 생성한 후 이를 활용한 Code를 구현하고 설명하시오.
71. Abstract Factory Pattern에 대해 설명하고 아래 Code를 Class Diagram으로 표현한 후 Abstract Factory Pattern를 적용하여 Coding 하시오( Starcraft에 나오는 Teran Unit 임).
72. Iterator Pattern에 대해 설명하고 Java 언어에 적용된 예제를 기술하시오.
73. Iterator Pattern을 사용하여 Factory Method Pattern를 구현하시오.
74. Class Diagram에서 TextView Class를 Adapter Pattern 을 적용하여 구현하시오.

PART 6. 객체 지향 언어
75. 객체지향 개념과 구성요소, 객체(Object), 클래스(Class), 기능(Method, Message), 속성
(Attribute)에 대해 설명하고 JAVA 언어로 실제 Code 예를 보이시오.
76. 객체지향 개념에서 상속(Inheritance)에 대해 정의하고 상속방법과 실제 Code 구현
77. 객체지향 개념에서 추상화(Abstract)에 대해 정의하고 예를 들어 설명하시오.
78. JAVA 언어
79. JAVA의 주요 구현 분야와 개발 환경
80. JAVA 언어의 특징과 JAVA Program 실행 순서
81. JVM(Java Virtual Machine) 구조 설명
82. API(Application Program Interface)와 JAPI( Java API)
83. 객체지향 설계원칙에 대해 실생활과 연계하여 설명하시오.
84. 객체지향 언어의 특징과 설계원칙을 기술하고, 구조적 기법과 차별화되는 개념을 설명하시오. 또한 Private, Public 접근제어자(Access Modifier)를 사용하여 외부로부터 데이터를 보호하기 위한 정보 은닉방법을 실제 객체 지향언어(JAVA)로 간단히 구현하시오.
85. 객체지향언어의 특징(Code 예를 제시하시오).
86. 객체지향언어의 오버라이딩(Overriding)과 오버로딩(Overloading)
87. 아래 파일 IO 계층 구조에서 각 계층에서 추상화하는 부분에 대해 설명하시오.
88. Static Linking와 Dynamic Linking
89. AOP(Aspect Oriented Programming) 방법

PART 7. 아키텍처(Architecture) 스타일
90. ISO/IEC/IEEE 42010(구 IEEE 1471, SW 아키텍처 기술에 관한 국제 표준)
91. MVC(Model, View, Controller)
92. Repository(저장소)
93. 계층형(Layered)
94. 파이프 필터(Pipe Filter)
95. PHP(Personal Home Page, Hypertext Pre-processor)의 개요와 동작원리, 특징, 유사 Program 인 ASP, JSP와 비교
96. P2P(Peer-to-Peer) 아키텍처 스타일의 개념을 Network 개념을 적용하여 Client-Server와의 차이점, 특징 및 요구사항에 대해 설명하시오.
97. P2P(Peer-to-Peer) System의 운영형태에 따라 Pure P2P, Super P2P, Hybrid P2P로 분류할 수 있다. 각각에 대해 설명하고 장단점을 기술하시오.
98. 아래와 같은 간단한 응용에 대한 SW 아키텍처를 작성하고자 한다. 다음 질문에 답하시오. 영문 문자열을 입력하여 각 문자 별 대소문자를 체크하여 대소문자를 바꾸어 출력하는
프로그램이다.
입력:ToDayIsHoIiDay 출력:tOdAYiShoLIdAY
1) C&C(Component & Connector:프로세스 뷰)를 작성할 때 가장 적당한 아키텍쳐 스타일을 제시하고 필요한 컴포넌트 커넥터를 제시하시오.
2) 위에서 제시한 아키텍처 스타일에 따라 아키텍처를 작성하시오
3) 위 응용에 대한 모듈(논리 View) 작성을 위한 컴포넌트를 제시하고 아키텍처를 작성하시오.

PART 8. OSS(Open Source Software)와 License의 종류
99. OSS(Open Source Software)의 장단점
100. OSS 개발 Process와 특징
101. OSS(Open Source Software)에서 Hidden Patent
102. IP(Intellectual Property) Rights
103. Open API(Application Programming Interface)
104. Apache License 2.0
105. OSS License에서 LGPL 2.1
106. BSD(Berkley Software Distribution) License
107. Free Software와 Open Software에 대해 설명하고 Open Source Software의 지적 재산권과 License에 대해 설명하시오.
108. 기업에서 오픈 소스 소프트웨어(OSS, Open Source Software)를 활용하여 비즈니스를 수행하고자 한다. 다음에 대해 설명하시오.
가. Open Source 정의와 GPL2.0 의 내용을 기술하시오.
나. GPL 2.0의 의무사항과 GPL 3.0에서 추가된 내용을 설명하시오.

PART 9. Project 관리
109. PMBOK의 5 단계 Project 관리 Process
110. PMBOK에서 제시하는 10개 관리 활동 영역
111. Project와 Program, Portfolio
112. Project 생명주기에 따른 Project 관리 업무의 제약 사항
113. PM(Project Manager)이 Project을 관리하는 Process
114. Project의 특징과 PM과 PMO 역할을 비교
115. PMO(Project Management Office)의 기능에 대해 5개 이상 설명하시오.
116. PMO의 Framework
117. PMO의 주요 Model과 R&R(Role & Responsibility )에 따른 유형 비교
118. PMO(Project Management Office)의 기능 중 범위관리, 일정관리, 인적자원관리, 위험관리, 의사소통관리 기능에 대하여 각 기능의 정의, 주요단계, 관리상의 주의사항에 대해 설명하시오.
119. Project 진행 시 발생될 수 있는 이해 관계자 간의 갈등 해결 방안
120. Project 10 관리 영역 중 (PMBOK 기준) 위험 관리 방안
121. Project 관리 영역 중 범위 관리를 위한 Process
122. Project 일정 단축 기법 중 Fast Tracking과 Crashing 기법
123. Project 진행 과정에서 이해관계자 관리 방안(이해관계자 분석 Model)
124. 지연되는 Project 에 인력을 더 충원해도 오히려 일정이 지연된다는 Brook’s Law
125. WBS(Work Breakdown Structure)의 특징, 유형, Activity의 선행 후행 의존 관계 설정 방법
126. Project 일정관리에서 임계경로(Critical Path)이 의미를 설명하고 다음의 CPM(Critical Path Method) Network에서 임계 경로를 찾으시오(방법 1).
127. Project 일정관리에서 임계경로(Critical Path)이 의미를 설명하고 다음의 CPM(Critical Path Method) Network에서 임계 경로를 찾으시오(방법 2).

PART 10. Process와 Product 검증에 대한 국제표준
128. Software 생명 주기 모형, SW 개발 방법론과 SW Process 평가 및 개선 모델간의 관계
129. Software 품질 향상을 위한 국제 표준의 상호 관계도
130. Software의 개발과 양산 그리고 유지 보수 과정에서 사용되는 품질 향상을 위한 국제 표준
131. ISO/IEC 14598-1에 정의한 Software 제품 평가(Software Product Evaluation)
132. ISO/IEC 25010 품질 모델(구 ISO/IEC 9126, SQuaRE 계열)
133. ISO 21500 프로젝트 관리 지침
134. ISO 12207의 구성과 구성에 따른 세부 내용
135. Software Product 평가를 위한 ISO/IEC 12119
136. ISO/IEC 25000
137. ISO 26262(Functional Safety)
138. e-SCM(e-Sourcing Capability Model) 품질 모델
139. ISO 20000에 대해서 기술하고, eSCM과 비교
140. ISO/IEC 15504(SPICE)
141. CMM(Capability Maturity Model) 성숙도 단계 및 평가 기준
142. GS(Good Software) 인증


PART 11. 품질관리
143. Software의 품질 관리(Quality Management)
144. Software 품질 향상을 위한 Test의 일반적인 원리와 유형, S/W Test의 문제점과 해결방안
145. Software Test의 전략과 어려움
146. Software의 Test Case
147. Software 검증에서 Verification과 Validation 방법과 절차 그리고 비교
148. Refactoring(리펙토링). (실제 사례도 포함하시오)
149. 아래 논리회로를 부울(Boolean)대수 법칙을 적용하여 간소화 (팩터링-Factoring)
150. Software 품질 개선을 위한 Inspection
151. 품질보증방안, review
152. Software 관리를 위한 형상통제위원회 활동
153. Software Test 방법 중 명세기반과 구조기반 Test 설계 기법
154. Daily Build
155. Test Oracle
156. Risk 기반 Test
157. 회귀테스트(Regression Test)
158. 이벤트(Event) 기반의 시스템 Testing을 위한 Record and Replay
159. Software 검증을 위한 테스트 자동화(Test Automation)
160. System의 오류(Error), 결함(Fault), 고장(Failure)를 방지하기 위한 일반적인 Test 과정
161. 아래 코드에 대한 테스트 케이스(test case)를 작성하는 과정
162. 시스템의 테스트 완전성을 확보하기 위한 소스코드 커버리지(source code coverage)의 종류
163. IEEE-SRS 830(Software 요구사항 명세서)
164. 요구사항을 만족하기 위해서는 요구공학적 개념이 필요하다. 요구공학을 위한 Process 와 이를 개발하기 위한 절차
165. Software 요구 사항 분석이 어려운 이유
166. Software의 분리발주와 분할발주
167. 소프트웨어 정의(SDx)
168. SP(Software Process) 인증
169. PSP(Personal Software Process)
170. TSP(Team Software Process)

PART 12. 기성고 관리
171. Project 기성고 관리 (EVM: Earned value Management) 기법
172. Project 일정 계획에 대해 다음 물음에 대해 설명하시오.
1) EVM(Earned Value Management) 에 대해 설명하시오.
2) 1월 1일부터 6월 1일 까지 진행되는 Project에 관한 진행 기록이 다음과 같을 때 EV(Earned Value), SPI(Schedule Performance Index), SV(Schedule Variance), CPI(Cost Performance Index) 그리고 CV(Cost Variance)를 각각 구하시오.
단, 현재일은 3월 1일이라고 가정한다.

173. 사업예산은 1,600,000천원, 사업기간은 16개월인 프로젝트가 4개월 경과되어 Project 관리는 수행업체에게 400,000천원을 지급하였다. 그러나 확인 결과 작업 수행률은 20%이었다. 이 문제에 대한 기성고 분석(EVA : Earned Value Analysis)을 수행하였다.
가. 프로젝트 비용의 계획대비 실적의 차이(CV), 실제 예상 원가 효율(CPI)을 각각 구하고 값의 의미를 설명하시오.
나. Project 일정 진척사항 파악(SV), 일정에 대한 효율(SPI)을 각각 구하고 값의 의미를 설명하시오.
다. 완료시점 원가 예상치(EAC)를 구해 보고, Project 관리자 입장에서 신뢰성 있는 원가 또는 일정 준수를 위해 현장에서 실현 가능한 고려사항을 제시하시오.
174. 새로운 IT 프로젝트를 수행 중에 있다. 각 단계의 일정은 한 달씩 걸리고, 각 단계 마다 10,000천원의 예산이 할당되었다. 각 단계는 해당 단계가 끝난 후에 다음 단계를 수행하도록 되어 있다. 오늘은 3월의 마지막 날이다. 아래 프로젝트 진척 상황표를 이용하여 Earned Value Analysis 측면에서 다음 질문에 대하여 설명하시오.
가. PV(Planned value), EV(Earned Value), AC(Actual Cost), BAC(Budget At Completion), CV(Cost Variance), CPI(Cost Performance Index), SVS(Schedule variance),SPI(Schedule Performance Index)의 계산식과 답을 구하시오.
나. EAC(Estimate At Completion), ETC(Estimate To Complete), VAC(Variance At Completion)의 계산식과 답을 구하시오(단, EAC는 향후에도 CPI의 비율로 지출됨).
다. 상기 결과를 바탕으로 현재 진행중인 IT 프로젝트의 상태를 진단하시오.

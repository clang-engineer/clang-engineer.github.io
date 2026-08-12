목차
Part 1. DB 기초 및 특징
1. 정보, 지식, 지혜
2. DB의 정의와 특성(구조)
3. DB의 특징과 장·단점
4. DB의 생성 목적과 구성 요소
5. ANSI/SPARC 구조
6. 기존 File System의 문제점과 DBMS의 장점
7. DBMS(Data Base Management System)의 정의, 역할, 필수 기능, 장·단점
8. 스키마(Schema)와 인스턴스(Instance), DDL(Data Definition Language), DML(Data Manipulation Language), DCL(Data Control Language)
9. DB의 절차 언어(Procedural language)와 비 절차 언어(Non-Procedural)
10. DB의 생명주기(Life Cycle)와 설계 과정
11. DB의 설계 과정인 기획, 분석, 설계, 구현 과정에서의 Activity와 산출물
12. DB의 3-Schema(스키마) 구조의 정의와 실제 사용 예 (장·단점)
13. DB의 Data 독립성
14. DB의 속성(Attribute)
15. DB의 속성(Attribute)의 종류

Part 2. DB 모델링(Modeling)
2-1) ER(Entity Relationship) 다이어그램 및 관계 대수
16. Data Modeling의 절차
17. ER(Entity Relationship) 다이어그램 표기법
18. ER Model의 작성 절차
19. ER Model의 연결 함정
20. 야구 선수와 야구팀이라는 두 개의 Entity Type에 대해 다음의 요구 사항을 참조하여 ER Schema를 그리시오. (단 Total/Partial 참여, 몇 대 몇인지의 관계, Key등을 명시할 것)
21. EER(Enhanced ER) Model
22. 다음 TRUCK과 CAR에 대해 일반화(Generalization) 완성
23. Database에서 사용되는 관계 대수(Relational Algebra)의 연산자와 연산자 실행 예
24. Relation T1과 T2에 대해 각 연산을 수행한 결과를 보이시오
25. 다음 ER Diagram을 참조하여 질문에 답하시오.
26. 다음 relation들과 제약 조건을 참조하라.
27. 다음 SQL DDL 문을 참조하라.
28. 아래 ER schema의 지점 entity type을 SQL CREATE TABLE 명령어를 이용하여 변환하라. (지점은 여기서 weak entity type 이다.)

2-2) 정규화(Normalization)
29. DB에서 정규화(Normalization)의 수행 절차
30. DB에서 사용되는 Super Key, Primary Key, Alternate Key, Foreign(외래) Key
31. 외래키(Foreign Key)의 정의(목적), 다음 ERD(ER-Diagram)로 Relation을 생성한 후 사원의 부서를 외래키를 사용하여 알 수 있는 방법
32. Database에서 Key의 본질적 제약과 내재적 제약 설명
33. DB에서 함수적 종속성(Function Dependency)(암스토롱 공리)
34. DB에서 이상 현상(Anomaly)의 유형과 사례, 해결 방안
35. 아래의 Table과 주어진 속성간의 관계에서 발생되는 데이터의 입력, 삭제, 갱신 이상(Anomaly) 현상의 예를 기술하시오.
36. 아래 수강 Relation의 종속관계를 도식화하고 함수적 종속성의 유형에 대해 설명하시오.
37. 관계형 DB 설계 시 테이블 스키마(R)와 함수 종속성(FD)이 아래와 같이 주어졌을 때 다음 질문에 답하시오.
38. 아래 수강 과목 Relation은 제 3 정규형이다. BCNF(Boyce/Codd Normal Form) 정규형으로 변환하고 제 3정규형에서 삽입/갱신/삭제 이상에 대해서 설명하시오.
39. 아래 수강신청 Relation은 제 3 정규형이지만 BCNF 정규형이 아니다. 발생할 수 있는 이상 현상에 대해 설명하고 BCNF 정규형 Table로 설계하시오.
40. 제4정규형의 개념과 제약 조건, 제4차 정규형의 사례 설명
41. Database에서 비 정규화
42. 데이터 모델링 과정에서 반 정규화를 수행하는 이유와 각각의 유형
43. Database에서 반 정규화(역정규화, De-Normalization)

Part 3. SQL(Structured Query Language)
44. SQL(Structured Query Language)의 3가지 언어
45. 다음 ER Diagram에서 Relation과 SQL Table을 작성
46. 다음 대학(University) 관계 Database에서 각 Query에 대해 SQL 검색문을 작성하고 결과를 도출하시오.
47. 앞 질문(대학 RDBMS)에서 다음 질문에 답하시오.
1) 등록 Table에서 중간 성적이 90점 이상인 학생의 학번과 과목번호(ORDER BY 이용)
2) 등록 테이블에서 과목번호가 “C312”인 중간성적에 5점을 더한 점수를 “학번”, “중간성적=”이란 Text 내용을 “시험”, 그리고 “점수”라는 열 이름으로 검색(새로운 열 이름이 명세된 검색)
3) 과목번호 “C413”에 등록한 학생의 이름, 학과, 성적을 검색(복수 Table 사용)

48. 앞 질문(대학 RDBMS)에서 다음 질문에 답하시오.
1) 같은 학과 학생들의 학번을 쌍으로 검색
단, 첫 번째 학번은 두 번째 학번보다 적게 하시오.(자기 자신의 Table에 조인하는 검색임)
2) 학생 Table에 학생수 검색(집계 함수를 이용)

49. 질문(대학 RDBMS)에서 다음 질문에 답하시오.
1) 학번이 300인 학생이 등록한 과목수
2) 과목 “C413”에 대한 중간 성적의 평균
3) 과목별 기발 성적(Final)의 평균을 검색(GROUP BY 이용)
4) 3명 이상 등록한 과목의 기말 평균 성적을 검색(HAVING 사용)

50. 질문(대학 RDBMS) 에서 다음 질문에 답하시오.
1) 과목번호 “C413”등록한 학생 이름 검색(부속 질의문 및 IN 이용)
2) 과목번호 “C413”에 등록하지 않은 학생의 이름 검색(부속 질의문을 사용하고 NOT IN을 이용)
3) 학생 “기사 1”과 같은 학과에 속하는 학생의 이름과 학과(Dept) 검색

51. 질문(대학 RDBMS) 에서 다음 질문에 답하시오.
1) 중간 성적이 90에서 95 사이의 행의 Sno, Cno, Midterm 출력(BETWEEN을 이용 검색)
2) 등록 Table에서 학번이 500인 학생의 모든 기말성적보다 좋은 학생의 학번과 과목 번호 검색(ALL 키워드 사용)
3) 과목 번호가 C로 시작하는 과목번호와 과목 이름 검색(LIKE를 이용한 검색 실시)

52. 질문(대학 RDBMS)에서 다음 질문에 답하시오.
1) 과목 “C413”에 등록한 학생의 이름 검색(EXISTS 검색을 사용)
2) 과목 “C413”에 등록하지 않은 학생의 이름 검색
3) 3학년이거나 또는 과목 “C324”에 등록한 학생의 학번 검색(UNION 사용)

53. 질문(대학 RDBMS)에서 다음 질문에 대해 SQL문을 생성하시오. (UPDATE문 사용)
1) 학번이 300인 학생의 학년을 2로 변경
2) “CA”과목의 학점(Credit)을 2학점 증가
3) “CA”와 학생의 기말 성적을 5점씩 가산
4) 모든 4학년 학생의 학과를 “보안”과목을 개설한 학과로 갱신

54. DB에서 SQL View에 대해서 설명하시오.

Part 4. 회복 기법 및 Backup 기법
55. 회복(Recovery) 기법의 종류
56. 즉시 갱신 기법(Immediate Update)과 지연 갱신 기법(Deferred Update)
57. Checkpoint 회복 기법
58. 그림자(Shadow) Paging 회복 기법과 Media 회복 기법
59. CDP(Continuous Data Protection)
60. Backup 방법
- 전체 백업(Full Backup)
- 증분 백업(Incremental Backup)
- 차등 백업(Differential Backup)
- 합성 백업(Synthetic Full Backup)

Part 5. 병행 제어
61. Transaction 의 상태 전이도와 4가지 특성(ACID)
62. DBMS에서 동시성(Concurrent, 병행성) 제어 방법의 종류와 장·단점
63. DBMS 병행처리와 병행제어 정의, 병행처리시의 문제점들과 대책
64. Transaction 스케줄링(Scheduling)의 종류
65. 프로그램 병행성에 대해 다음 물음에 답하시오.
(1) 병행 프로그래밍에서 인터리빙(Interleaving) 동작 방식
(2) 아래와 같이 두 개의 Process P1과 P2가 병행 실행되는 경우 모든 가능한 인터리빙을 보이시오.

66. 다음 각 T1과 T2는 A에 1을 더하는 연산(Task)이다. Transaction 들에서 아래 질문에 답하시오.
문1) 위의 Transaction들로부터 발생할 수 있는 충돌 직렬
불가능(Conflict Non-Serializable)한 스케줄링 작성
문2) 문1)에서 작성된 스케줄링에서 발생할 수 있는 문제점을 설명

67. 다음 Schedule은 직렬 불가능(Non-Serializable)하다. 각 Task의 수행 결과 원하는 값과 실제 수행 값을 표기하고 문제점과 직렬화하기 위한 방안은 무엇인지 설명하시오.(R은 Read, W는 Write를 의미)
68. 아래 두 개의 Task T1과 T2가 하나의 DB에 동시 수행 시(Concurrency) 발생할 수 있는 문제로 갱신 유실 문제(Lost Update Problem), 오류 읽기 문제(Temporary Update(Dirty Read) Problem), 잘못된 요약 문제(Incorrect Summary Problem)가 발생할 수 있다. 각각의 경우에 대해 예를 들어 설명하시오.
69. 아래 두 개 Task에서 Serial(직렬) 스케줄의 예와 Non-Serial 스케줄의 예를 각각 2가지 이상 표현하시오.
70. 로킹(Locking Protocol)에 대해 설명하고 아래 T1과 T2가 동시에 수행 시 직렬화(Serializability) 스케줄이 불가능한 경우의 예제를 들어 설명하시오.
71. (1) 2PL(Two Phase Locking)에 대해 설명하고 2PL의 장·단점 설명
(2) 아래의 T1, T2의 Transaction에 대해 2PL을 적용한 스케줄과 2PL 적용 결과

72. Transaction 동시성 제어 방법인 2PL(Two Phase Locking)기법에 대해 설명하고 2PL 기법의 유형에 대해 설명하시오.
73. DB에서 Transaction 시 동시성 제어 방법인 Time Stamp Ordering 기법
74. DB에서 Transaction 시 동시성 제어 방법인 낙관적(Validation) 검증 기법
75. DB에서 교착 상태(Deadlock) 발생 원인과 해결 방안
76. 교착 상태 회피 기법인 Wait-Die & Wound-Wait 기법에 대해 설명하고 아래 4개 Transaction 에 대해 Wait-Die 와 Wound-Wait 기법 적용시의 수행 과정 최초 수행은 T2가 Data Item X를 Lock 하고 있는 상태라고 가정한다.
77. 다음 4개의 Transaction의 직렬화(Serializability) 방법 표기와 교착 상태(Deadlock)를 탐지할 수 있는 대기 그래프(Wait-for Graph)를 작성하시오. 또한 직렬화를 보장하기 위한 Transaction의 순서를 설명하시오.

Part 6. 해싱(Hashing)
78. 해쉬 함수(Hash Function)의 4가지 특징(필수 요건)
79. UNDO, REDO, ACID, DBMS, SQL, INDEX, HASH, BTREE, ERR의 데이터에서 해싱(Hashing)을 이용하여 ACID와 FDA가 존재하는지를 검색해 보는 과정을 기술하시오.
Hash 함수는 Division(나누기) 방법인 f(h) = x mod m (x: 나머지, m: 버킷(Bucket)을 사용하시오.(아래 EDCDIC Code Table을 활용하여 Hash 함수를 구하고 Bucket 수는 10개 이고 한 개의 Bucket에는 2개의 Data를 저장할 수 있음)
80. 해싱(Hashing) 함수의 종류와 Hashing 의 장·단점
81. Hashing, Hash Table, Hash Function에 대해 각각 정의하고 Hashing 충돌과 해결방법
82. Hashing 충돌 해결 방법인 선형 탐색(Linear Probing) 기법과 예를 제시하고 설명
83. Hashing 충돌 해결 방법인 체인닝(Chaining) 기법과 예를 제시하고 설명

Part 7. DB 응용
84. DW(Data Warehouse)의 구성요소와 구축 방법
85. DW(Data Warehouse)의 구성요소와 구축 절차(2교시형)
86. 데이터 마이닝(Mining) (1교시형)
87. 데이터 마이닝(Mining) (2교시형)
88. Data Mining 기법 중 연속(Sequence ) 규칙, 분류(Classification) 규칙, 데이터 군집화(Clustering) 규칙에 대해 정의하고 각각의 사례를 들어 설명하시오.
89. Data Mining 기법 중 연관 규칙의 지지도(Support), 신뢰도(Confidence), 향상도(Lift)에 대해 예를 들어 설명하시오.
90. Data Mining의 단계별 Activity에 대해 설명하고 OLAP와 비교
91. Web Mining (1교시형)
92. Web Mining 의 유형, 구조, 절차
93. ETL (Extraction, Transformation, Loading)
94. 오피니언(Opinion) Mining
95. Stream Data Mining

Part 8. DB의 종류
96. DBMS의 기능과 발전단계, RDBMS, OODBMS, ORDBMS 비교
97. MMDB
98. Hybrid MMDB
99. 생체 인식 Database
100. 생체 인식 DB의 적용분야와 문제점, 요구사항, 전망
101. 생체 인식(Biometrics)에 대해 설명하시오.
102. 멀티미디어(Multi-Media) Database
103. XML Database
104. Tiny DB
105. NoSQL Database
106. Streaming DBMS
107. Embedded DB (1교시형)
108. Embedded DB (2교시형)
109. 분산(Distributed) Database의 종류와 일반 Database와 비교 설명
110. 분산 DB에서 Data의 분할(Partition)과 할당(Allocation) 전략
111. 분산 데이터베이스의 3가지 설계 전략을 비교하고, 분산 Database가 갖추어야 할 4가지 특성
112. 분산 DB의 Issue와 해결방안에 대해 설명하고 분산 DB 구축시의 고려사항
113. 2PC(Phase Commit)

Part 9. DB 품질 관리
114. Data 표준화의 필요성과 원칙
115. 메타데이터(MetaData)
116. 데이터 품질 기준으로 유효성과 활용성으로 분류할 수 있다. 완전성, 정확성, 일관성에 대해 예를 들어 설명하시오.
117. DRM(Data Reference Model)
118. DQM(Data Quality Management)
119. DQM3(Data Quality Management Maturity Model)
120. DB System 개발 과정 시 무결성 확보 방안(개체/참조/영역/업무 무결성)
121. Database에서 Data 프로파일링(Profiling)

Part 10. DB 성능 향상
122. DB 성능 개선을 위한 평가 항목과 성능 개선 절차
123. DB 성능 개선을 위해 Hardware와 Software 측면에서 개선 가능한 항목
124. DB Table Partition의 유형과 특징
125. DB 성능 향상을 위한 Partition의 정의, 장점, 필요성, 유형, 적용 시 고려할 사항
126. 샤딩(Sharding)-대용량 데이터 처리
127. DB 튜닝(Tuning)의 3단계와 튜닝의 기대 효과
128. AVL Tree 불균형, 균형 유지 이유
129. m-원 탐색 Tree 특징
130. B-Tree
131. B -Tree 삽입
132. B -Tree 삭제
133. B+ -Tree
134. B+ -Tree 삽입
135. B* -Tree Key 분리
136. B* -Tree 키 값 분배
137. R-Tree
138. T-Tree
139. Tree 발전 과정 및 비교

Part 11. DB 감리, 보안, Service
140. DB 보안(Security)
141. BigData 어플라이언스(Appliance)
142. DB 구축 사업에 대한 정보시스템 감리 Framework를 제시하고 감리 점검 사항
143. DB에서 사용되는 래퍼(Wrapper)와 미디에이터(Mediator)
144. DB에서 CDC(Change Data Capture)
145. Data Masking
146. 중복 제거(De-Duplication)
147. 서버 가상화(Server Virtualization)에서 하이퍼바이저(Hypervisor)와 전 가상화(Full-Virtualization)와 반 가상화(Para-Virtualization)
148. SAN(Storage Area Network)과 NAS(Network Attached Storage)를 비교
149. Cloud Computing에서 개인 사용자와 기업 사용자는 보안 요구 사항이 다르다. 개인 사용자와 기업 사용자 관점에서 우려되는 보안 문제를 각각 열거하고 대책을 설명하시오.
150. Crowd Sourcing
151. Paas(Platform as a Service)
152. 문서 중앙화
153. 서비스 제공 측면에서의 개인화(Personalization)

Part 12. 정규화, 논리모델링, 데이터 품질
154. 전사 아키텍처(EA, Enterprise Architecture) 정의, 개념 설명
155. 정보요구사항에 대한 생명주기(Life Cycle)와 정보요구사항의 유형
156. 정보요구사항 관리 프로세스
157. 정보요구사항 우선순위 결정 방법 : 화폐가치 산출 방법과 상대적 중요도 산정방법
158. 데이터 표준을 위한 표준단어, 표준도메인, 표준코드, 표준용어
159. 기본키, 외래키, 대체키, 슈퍼키, 후보키 식별
160. 주식별자의 유일성, 최소성, 불변성, 존재성, 대표성
161. 식별자와 비식별자 관계
162. 식별자 유형, 식별자 및 비식별자로만 관계 설정 시 문제점 및 비교
163. 사원과 부서 엔터티 타입에서 관계차수(Cardinality)와 필수 및 선택사양
164. 엔터티(Entity) 타입의 특징 및 분류
165. 슈퍼타입(Super-type)과 서브타입(Sub-type)
166. 약(Weak) 엔터티, 슈퍼-서브타입 엔터티, 행위 엔터티
167. 정규화 위배사항을 식별하여 정규화(Normalization) 수행
168. M:M 관계 해소
169. 데이터 모델링의 필요성, 모델링 단계, 모델링 기본원칙, 좋은 데이터 모델의 요소
170. 아래 지문에 대해 논리 데이터 모델을 작성하시오.
171. 아래 지문에 대해 논리 데이터 모델을 작성하시오.
172. 아래 지문에 대해 논리 데이터 모델을 작성하시오.
173. 아래 지문에 대해 논리 데이터 모델을 작성하시오
174. 반정규화의 수평분할과 수직분할
175. 데이터관리를 위한 업무 규칙(Business Rule)의 현업 경험 사례, 문제점, 개선방안
176. 데이터관리를 위한 요구사항관리의 현업 경험 사례, 문제점, 개선방안
177. 데이터관리를 위한 품질특성의 한계성과 개선방안
178. 빅데이터(BigData) 큐레이션(Curation)
179. 빅데이터(BigData) 거버넌스(Governance)
180. 디지털 큐레이션(Curation)
181. 차세대 분석(Next Generation Anaysis)
182. 중복제거(De-Duplication)
183. 순환관계(Recursive Relationship) 엔터티와 Arc(Mutually Exclusive-배타적) 엔터티

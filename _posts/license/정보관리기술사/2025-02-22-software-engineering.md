---
title       : Software Engineering
description : >-
date        : 2025-02-22 00:00:00 +0900
updated     : 2025-03-02 23:09:59 +0900
categories  : [license, 정보관리기술사]
tags        : [정보관리기술사, 소프트웨어공학]
pin         : false
hidden      : true
---

## PART 1. Software 공학
### 1. SW 정의, 분류, 특성
정의
> 컴퓨터를 이용, 문제 해결 용이한 컴퓨터 활용 및 운용 기술

분류
> 응용 SW, 시스템 SW, 주문형 SW, 패키지 SW, 임베디드 SW

특성
> 비기시성, 비마모성, 복잡성, 복제성, 변경성, 순응성, 무형성, 개발성

### 2. SW 개념, SW 유형
SW 개념
> 사용자로 하여금 컴퓨터를 숩고 효율적으로 사용하도록 도와주거나, 컴퓨터를 사용하여 주어진 문제를 용이하게 해결하기 위해 사용되는 컴퓨터 활용 및 운용 기술

SW 유형
> -

### 3. SW 위기와 해결방안
SW 위기의 배경
> 전문가 부족, SW 개발 방식의 비효율성, SW 개발 비용 증가, SW 품질 저하

SW 위기 해결 방안
> - 공학적 접근: 객체지향 방법론, CBD(Component Based Development), 프로젝트 관리 기법
> - 자동화 도구 활용: CASE, Git
> - 표준화: Data 표준화, Reuse 체제 구축
> - 품질 보증 체제: ISO, CMMI, SPICE

### 4. SW 공학 정의, 구성요소, 원리
정의
> 과학적 지식(공학, 과학, 수학)을 이용하여 SW를 개발하는 방법론

구성요소
> - 도구: SW 개발에 필요한 도구
> - 언어

SW공학 원리
> 정형성과 엄격, 관심사의 분리, 모듈화, 추상화, 변화예측, 일반화, 점진화

### 5. IEEE 산하 SW공학 표준 위원회에서 SW 공학의 근본 지식을 규정한 SWEBOK(Software Engineering Body of Knowledge)

### 6. SW산업 육성 전략
> R&D 투자 확대, SW 인력 양성, SW 생태계 개선, 국제 협력 강화, 선택과 집중

### 7. 모듈화
개요
> 시스템을 분해하고 추상화를 통해 S/W 제품 성능을 향상시키는 기법

결합도의 종류 (낮->높)
> 자료 결합도: 모듈 간에 순수한 데이터만 전달
> 스탬프 결합도: 구조체나 객체 전체를 전달하지만 실제로는 일부 필드만 사용
> 제어 결합도: 모듈 간에 논리적인 제어 정보(flag, bool 등)를 주고받음
> 외부 결합도: 모듈이 외부 환경 (파일, DB, 디바이스 등)을 공유
> 공유 결합도: 공통 데이터 영역 (Global 변수 등)을 여러 모듈이 공유
> 내용 결합도: 한 모듈이 다른 모듈의 내부 로직에 직접 접근

응집도의 종류 (높->낮)
> 기능적: 하나의 기능을 완전히 수행하기 위한 작업들만 포함
> 순차적: 하나의 기능 결과가 다음 기능의 입력이 되는 경우
> 통신적: 동일한 데이터를 사용하거나 동일한 입출력 형식을 사용하는 기능들을 묶음
> 절차적: 순서에 따라 수행되어야 하는 기능들을 묶음
> 시간적: 특정 시간에 동시에 실행되어야 할 기능을 묶음
> 논리적: 비슷한 범주의 기능들을 하나의 모듈로 묶되, 제어 변수에 따라 분기 처리
> 우연적: 관련 없는 기능들이 하나의 모듈에 우연히 묶여 있음

> [결합도와 응집도의 각 단계와 특징](https://inpa.tistory.com/entry/OOP-%F0%9F%92%A0-%EA%B0%9D%EC%B2%B4%EC%9D%98-%EA%B2%B0%ED%95%A9%EB%8F%84-%EC%9D%91%EC%A7%91%EB%8F%84-%EC%9D%98%EB%AF%B8%EC%99%80-%EB%8B%A8%EA%B3%84-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0-%EC%89%BD%EA%B2%8C-%EC%A0%95%EB%A6%AC#%EC%9D%91%EC%A7%91%EB%8F%84_%EB%8B%A8%EA%B3%84_%EC%A2%85%EB%A5%98)

### 8. Software 설계 원리에서 분할과 정복(Divide and Conquer) 에 대해 설명
개요
> 문제를 작은 단위로 나누어 해결하는 기법

### 9. 소프트웨어의 난독화(Obfuscation)에 대해 설명
정의
> 소스코드, 바이너리 코드를 분석하기 어렵게 만드는 소프트웨어 보안 기법

필요성
> 역공학 방지, 해킹 방지, 국가 자산 보호

역공학이란
> 어셈블리언어를 디스어셈블러나 디컴파일러를 이용하여 원래 소스코드로 복원하는 과정

난독화 방안
> NOP(No Operation) 삽입, 압축, 캡슐화, 암호화
> *성능이 저하되거나 디버깅이 어려워질 수 있음

### 10. SW 재사용(Reuse)의 활용, 목적, 구현방법에 대해 설명
> 개발관련 자산을 표준화하여 반복사용, 생산성을 향상시키고 품질을 높임

### 11. SW 관리를 위한 기준선(Baseline)에 대해 설명
> 

### 12. Module, Component, Service에 대해 각각 설명하고 비교
>

### 13. 임베디드(Embedded) Software에 대해 설명하시오
개요
> 특정 기능을 수행하기 위해 하드웨어에 내장되어 동작하는 소프트웨어

특징
> 소형/경량, 하드웨어 의존성, 실시간성

패키지 소프트웨어 vs 임베디드 소프트웨어
> 패키지 소프트웨어는 범용 하드웨어에서 동작하는 반면, 임베디드 소프트웨어는 특정 하드웨어에 맞춰 설계됨

### 14. 역공학(Reverse Engineering)과 재공학(Reengineering) 에 대해 설명
역공학 vs 재공학
> 역공학은 기존 시스템을 분석하여 설계 및 구현을 이해하는 과정이며, 재공학은 기존 시스템을 개선하거나 새로운 시스템으로 변환하는 과정

---

## PART 2. Software 개발 모형
15. SDLC(Software Development Life Cycle)
- 개요
- SW 생명주기의 단계
- SW 생명주기 대표 모델

16. 폭포수(Waterfall) 모델
- 정의, 절차, 장점, 단점 
17. 프로토타입(Prototype) 모델
- 정의, 절차, 장점, 단점 
18. 나선형(Spiral) 모델
- 정의, 절차, 장점, 단점 
19. 증분형(Incremental)과 진화형(Evolutionary) 모델
- 각각의 정의, 절차, 장점, 단점
20. RAD(Rapid Application Development) 모델
- 정의, 절차, 장점, 단점
21. Clean Room 모델
- 정의, 절차, 장점, 단점
- Clean Room Box 구조 분석 기법

22. SDLC 모델 선정기준과 각 모델의 상관관계
- SDLC 모델 선정기준
- SDLC 모델간의 상관관계
23. SDLC(Software Development Life Cycle)과정에서 구현 단계에서의 Action Item(Activity)과 일정 지연이 발생되었을 때 PM(Project Manager)입장에서의 대처방안
24. SDLC 과정에서 필요한 Review, Inspection, Walkthrough
- 각 정의와 관계
- Inspection과 Walkthrough의 차이점

25. 전통적인 SW 개발 Model vs OSS(Open Source Software) 개발 Model
- 각각의 특징과 장단점

---

## PART 3. Software 개발 방법방
26. SW 개발 방법론
- 정의
- 구성요소
| 구성요소 | 설명 | 특징 |
|---|---|---|
| ? | ? | ? |

- 종류
| 구분 | 설명 | 특징 |
|---|---|---|
| ? | ? | ? |

27. Agile 방법론
- 정의, 특징, 종류

28. Agile 방법론의 정의, 특징, 장단징

29. 모바일 앱 개발
- 특징과 개발이슈
- 애자일 기반 모바일 앱 개발 프로세스

30. TDD(Test Driven Development)
- 정의, 특징, 장단점

31. SPL(Software Product Line) 개발 방법론
- 정의, 특징, 장단점

32. XP(eXtreme Programming)
- 개념, 특징
- XP의 4가지 핵심 가치
- XP의 12가지 실천 방법

33. RUP(Rational Unified Process)
- 정의, 특징

34. XP(eXtreme Programming) vs RUP(Rational Unified Process) 비교

35. Scrum
- 정의, 특징

36. MDD(Model Driven Development)
- 정의, 특징

37. MDA(Model Driven Architecture)
- 정의, 특징

38. DevOps (Development + Operations)

39. Kanban SW 개발 방법론
- 정의, 특징
- vs Scrum

40. CASE(Computer Aided Software Engineering)
- 정의 
41. 린(Lean) SW 개발 방법론
- 정의

---

## PART 4. UML(Unified Modeling Language)
42. Modeling
- 정의, 목적, 필요한 이유
> 구축할 시스템의 모습, 사양, 행동을 명세화하고 시각화, 문서화하는 과정

43. UML(Unified Modeling Language)
- 정의, 특징, 개발 방법론과의 관계

> 개발과정에서 생성되는 산출물을 명세화하고 시각화, 문서화하기 위하여 사용되는 표준화된 언어
> 플랫폼 독립적인 모델링 언어로 (방법론  x) 개발과정에서 의사소통을 위한 표준화된 언어
> 생각과 행위를 구조화하는 명시적인 방법

44. SW공학에서 모델링의 개념과 UML이 필요한 이필
> 이해 당사자들 사이의 원활한 의사소통
> 구조와 행위를 명시적으로 표명, 분석/설계의 문서화.

45. UML(Unified Modeling Language)의 구성요소
> 사물, 관계, 다이어그램으로 구성

46. UML의 각 구성요소의 세부 내용

47. 모델링 vs 프로그래밍

48. UML의 4+1 모형
- 개요
- 4+1 view 적용 과정

49. 4+1 모형이 SDLC(Software Development Life Cycle)과 어떻게 연관되는지 설명

50. UML 관계 종류
- 종류 + 예시

51. UML 다이어그램
52. -
53. -
54. 시퀀스 다이어그램
- 정의, 구성
55. -

56. UML2.0
- 정의

57. -
58. -

59. UML 의 확장 메커니즘

60. UML의 스테레오 타입
- 정의, 종류

61. -

62. UML 연관(Association) 관계, 방향성이 있는 연관(Directed Association) 관계

63. UML 일반화 관계
- 예시 및 설명, coding
64. UML 실제화 관화
- 예시 및 설명, coding
65. UML 의존 관계
- 예시 및 설명, coding

---

## PART 5. 디자인 패턴(Design Pattern)
66. 디자인 패턴(Design Pattern)
- 정의
- 특징
- 유형

67. 디자인 패턴의 종류와 각 패턴 설명, 활용 예
| 구분 | 종류 | 설명 | 예시 |
|---|---|---|---|
| ? | ? | ? | ? |

68. Prototype 패턴
- 개념, class diagram, 예시

69. Singleton 패턴
- 개념, class diagram, 예시

70. 객체 지향 - 추상화
- 추상화의 정의
- 구체화의 정의
- 추상 class 사용한 코드 작성

71. Abstract Factory 패턴
- 개념, class diagram, 예시

72. Iterator 패턴
- 개념, 예시

73. Iterator 패턴을 사용해 Factory Method 패턴을 구현.

74. Adapter 패턴

---

## PART 6. 객체 지향 언어
75. 객체지향 
- 개념
- 구성요소
- 객체(Object), 클래스(Class), 기능(Method, Message), 속성(Attribute) 에 대해 각각 설명
76. 상속 (Inheritance)에 대한 정의, 예시
77. 추상화 (Abstraction)에 대한 정의, 예시
78. JAVA 언어
- 개요, 특징
79. JAVA 주요 구현 분야와 개발 환경
- 주요 구현 분야
| 구분 | 분야 | 설명 |
|---|---|---|
| ? | ? | ? |

- 개발 환경

80. JAVA 특징, 실행순서
- java 언어의 특징
- java 프로그램의 실행순서

81. JVM(Java Virtual Machine)
- 개요
- Jvm의 내부 구조

82. API(Application Programming Interface)와 JAPI(Java API)
- API 정의, 특징
- JAPI 정의, 특징
- JAPI의 종류

83. 객체지향 설계원칙
- 객체지향 특징
- 객체지향 설계원칙 종류 및 실생활 예시

84. 객체지향 언어
- 특징
- 설계원칙
- vs 구조적 프로그래밍 
- 접근제어자

85. 객체지향언어의 특징

86. 오버라이딩, 오버로딩
- 각각의 정의, 예시

87. -
88. Static Linking vs Dynamic Linking
| 구분 | Static Linking | Dynamic Linking |
|---|---|---|
| 특징 | ? | ? |
| 장단점 | ? | ? |

89. AOP(Aspect Oriented Programming)
- 개요, 특징

---

## 7. 아케텍처 스타일
90. IEEE 1471
- 개요
91. MVC(Model-View-Controller) 아키텍처
- 개요, 특징
92. 저장소(Repository) 아키텍처
- 개요, 특징
93. 계층형 (Layered) 아키텍처
- 개요, 특징
94. 파이트 필터 (Pipe and Filter) 아키텍처
- 개요, 특징

95. PHP(Personal Home Page, Hypertext Preprocessor)
- 개요
- 동작원리
- 특징
- vs ASP, JSP
96. P2P(Peer to Peer)
- 개요

97. -
98. -

---

## PART 8. OSS(Open Source Software)와 License의 종류

## PART 9. Project Management

## PART 10. Process와 Product 검증에 대한 국제 표제

## PART 11. 품질관리

## PART 12. 기성고 관리
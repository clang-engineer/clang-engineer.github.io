---
layout  : wiki
title   : Spring Frame Work 면접 질문
summary : 
date    : 2023-04-30 19:02:20 +0900
updated : 2023-04-30 19:02:50 +0900
tags    : 
toc     : true
public  : false
parent  : [[interview/index]]
latex   : false
---
* TOC
{:toc}

# Spring Framework란 무엇인가요? 어떤 기능을 제공하나요?
```
Spring Framework는 Java 언어로 개발된 오픈소스 애플리케이션 프레임워크입니다. Java 개발에 필요한 다양한 기능을 제공하며, 개발자들이 빠르고 효율적으로 애플리케이션을 개발할 수 있도록 도와줍니다.

Spring Framework가 제공하는 주요 기능으로는 다음과 같은 것들이 있습니다:

- Inversion of Control (IoC) : 객체를 생성하고 의존성을 주입하는 작업을 Spring Framework가 대신 처리해주는 기능입니다. 개발자는 객체 생성 및 의존성 주입과 같은 작업에 집중하지 않고 비즈니스 로직 구현에 더 집중할 수 있습니다.
- Aspect-Oriented Programming (AOP) : 애플리케이션에서 반복적으로 사용되는 코드를 모듈화하여 관리할 수 있도록 지원합니다. 이를 통해 코드의 재사용성을 높이고 유지보수성을 개선할 수 있습니다.
- Spring MVC : 웹 애플리케이션 개발을 위한 모듈로, Model-View-Controller 아키텍처를 지원합니다.
- Data Access : 데이터베이스 액세스를 위한 다양한 방식을 지원합니다. JDBC, ORM(Object-Relational Mapping), JPA(Java Persistence API) 등 다양한 데이터베이스 액세스 기술을 지원합니다.
- Transaction Management : 트랜잭션 관리를 지원합니다. 일관된 데이터 처리를 보장하고, 예외 처리 및 롤백 등의 작업을 수행할 수 있습니다.
- Testing : 단위 테스트, 통합 테스트 등의 다양한 테스트 모듈을 제공합니다. 개발자들은 테스트를 통해 코드의 신뢰성을 보장할 수 있습니다.
이 외에도 Spring Framework는 다양한 기능을 제공하며, 개발자들이 애플리케이션을 개발할 때 필요한 다양한 도구를 제공합니다.
```

# Spring Framework의 장단점은 무엇인가요?
```
장점:

1. 개발 생산성 향상: Spring Framework는 반복적인 작업을 자동화하여 개발자들이 빠르게 개발할 수 있도록 도와줍니다. 예를 들어, 객체 생성과 의존성 주입과 같은 작업을 Spring이 대신 처리해주기 때문에 개발자들은 더 많은 비즈니스 로직 구현에 집중할 수 있습니다.

2. 모듈화: Spring Framework는 여러 모듈로 구성되어 있습니다. 이러한 모듈들은 독립적으로 사용될 수 있으며, 필요한 모듈만 선택하여 사용할 수 있습니다.

3. AOP(Aspect-Oriented Programming) 지원: AOP를 사용하면 반복적인 코드를 모듈화하여 코드의 재사용성을 높일 수 있습니다.

4. 테스트 지원: Spring Framework는 단위 테스트, 통합 테스트 등의 다양한 테스트 모듈을 제공하여 코드의 신뢰성을 높일 수 있습니다.

5. 유연성: Spring Framework는 다양한 개발 환경에서 사용할 수 있습니다. Java SE, Java EE, 그리고 Spring Boot를 사용하여 마이크로서비스 애플리케이션을 개발할 수도 있습니다.

단점:

1. 학습 곡선: Spring Framework는 다양한 기능을 제공하기 때문에 학습 곡선이 높습니다. 또한, Spring Framework를 사용하면서 발생하는 예외 처리와 디버깅 등의 작업도 어렵고 복잡할 수 있습니다.

2. 성능 이슈: Spring Framework는 많은 기능을 제공하기 때문에 사용하지 않는 기능들도 함께 로딩됩니다. 이로 인해 애플리케이션의 성능이 저하될 수 있습니다.

3. XML 설정: Spring Framework의 초기 버전에서는 XML을 사용한 설정이 주로 사용되었습니다. 이러한 XML 설정은 가독성이 떨어지고, 오타 등의 문제가 발생할 수 있습니다. 최신 버전에서는 자바 기반의 설정 방식을 지원하고 있어 이러한 문제는 해결되었습니다.
```

# Spring Framework에서 제공하는 핵심 모듈은 어떤 것이 있나요?
```
Spring Core: IoC(Inversion of Control)와 DI(Dependency Injection)를 제공하는 모듈로, 객체 간의 의존성을 제어합니다.

Spring Context: Spring Core를 확장하여 Application Context와 라이프사이클, 이벤트, 국제화 등의 기능을 제공합니다.

Spring AOP: AOP(Aspect-Oriented Programming) 구현을 제공하여 애플리케이션의 핵심 로직과 부가적인 기능을 분리하여 개발할 수 있습니다.

Spring JDBC: JDBC를 간소화하여 데이터베이스와의 연동을 지원하는 모듈입니다.

Spring ORM: 다양한 ORM 프레임워크(예: Hibernate, JPA)와 연동하여 데이터베이스와 객체를 매핑할 수 있도록 지원합니다.

Spring Web: 웹 애플리케이션 개발을 위한 모듈로, 웹 MVC 프레임워크, RESTful 웹 서비스, WebSocket 등을 제공합니다.

Spring Test: 단위 테스트와 통합 테스트를 위한 모듈로, JUnit과 TestNG와 연동하여 테스트를 지원합니다.
```

# Spring Bean이란 무엇인가요? Bean의 생명주기는 어떻게 되나요?
```
Spring에서 Bean은 IoC(Inversion of Control) 컨테이너에 의해 관리되는 객체입니다. Spring Bean은 스프링 애플리케이션에서 사용되는 객체로, 애플리케이션의 핵심 기능을 담당하는 객체부터 데이터베이스와의 상호작용을 위한 객체까지 다양한 객체를 의미합니다.

Bean의 생명주기는 다음과 같이 표현할 수 있습니다:

1. Bean Definition: Bean의 정의를 생성합니다. 정의란, 해당 Bean의 클래스와 속성, 의존성 등의 정보를 담은 메타데이터를 의미합니다.

2. Instantiation: Bean의 인스턴스를 생성합니다. 이 단계에서는 Bean의 생성자가 호출되어 객체가 생성됩니다.

3. Populate Properties: Bean의 속성을 설정합니다. 이 단계에서는 DI(Dependency Injection)가 발생하여 의존성이 주입됩니다.

4. BeanNameAware: Bean의 이름을 설정합니다. Bean의 이름이 정해지면, 컨테이너는 해당 Bean을 식별할 수 있습니다.

5. BeanFactoryAware/ApplicationContextAware: Bean이 생성된 컨테이너의 참조를 설정합니다.

6. PreInitialization: Bean이 초기화되기 전에 커스텀 초기화 로직을 실행할 수 있습니다.

7. Initialization: Bean이 초기화됩니다. 이 단계에서는 InitializingBean 인터페이스나 @PostConstruct 애노테이션을 사용하여 초기화 로직을 실행합니다.

8. Initialization after properties set: Bean의 속성이 모두 설정된 후에 초기화되는 로직을 실행할 수 있습니다.

9. PostInitialization: Bean이 초기화된 후에 커스텀 로직을 실행할 수 있습니다.

10. Disposable: Bean이 소멸됩니다. 이 단계에서는 DisposableBean 인터페이스나 @PreDestroy 애노테이션을 사용하여 종료 로직을 실행합니다.

Spring Bean의 생명주기는 이와 같이 관리되며, Bean의 생명주기 동안 컨테이너에서 다양한 작업을 수행할 수 있습니다.
```

# Spring의 AOP(Aspect-Oriented Programming)는 무엇인가요? 어떤 장점이 있나요?
```
Spring의 AOP(Aspect-Oriented Programming)는 OOP(Object-Oriented Programming)의 보완 개념으로서, 관점 지향 프로그래밍입니다. AOP는 어플리케이션의 핵심 로직과 별개로, 로깅, 트랜잭션, 보안 등과 같은 공통적인 관심사(Concern)를 모듈화하여 관리하는 기술입니다.

AOP는 핵심 로직과 관심사를 분리함으로써, 코드의 재사용성과 모듈화, 유지보수성을 높여줍니다. 예를 들어, 모든 데이터베이스 연동 로직에서 공통으로 사용되는 트랜잭션 처리 로직은 AOP를 사용하여 별도의 클래스로 분리하고, 필요한 클래스에서 해당 모듈을 쉽게 사용할 수 있도록 해줍니다.

Spring에서 AOP는 다양한 기능을 제공합니다. 대표적으로는 다음과 같은 기능이 있습니다:

1. Advice: 공통 기능을 수행하는 로직을 정의합니다. Before, After, Around 등 다양한 종류의 Advice가 있습니다.

2. Join point: Advice가 적용될 수 있는 지점을 지정합니다. 메서드 호출, 필드 접근 등 다양한 종류의 Join point가 있습니다.

3. Pointcut: Advice를 적용할 Join point를 선택합니다. 여러 개의 Join point를 묶어서 Pointcut을 정의할 수 있습니다.

4. Aspect: Advice와 Pointcut을 결합한 것으로, 실제로 로직을 적용하는 대상입니다.

Spring AOP의 장점은 다음과 같습니다:

1. 로직의 재사용성: AOP를 사용하여 공통적으로 사용되는 로직을 별도의 모듈로 분리함으로써, 코드의 재사용성을 높여줍니다.

2. 코드의 모듈화: AOP를 사용하여 로직을 분리함으로써, 코드의 모듈화를 쉽게 할 수 있습니다. 이를 통해 유지보수성을 높일 수 있습니다.

3. 핵심 로직과 관심사의 분리: AOP를 사용하여 핵심 로직과 관심사를 분리함으로써, 코드의 가독성과 유지보수성을 높일 수 있습니다.

4. 코드의 간결성: AOP를 사용하여 로직을 분리함으로써, 핵심 로직 코드가 더욱 간결해질 수 있습니다.
```

# Spring MVC(Model-View-Controller) 프레임워크는 무엇인가요? 어떤 특징이 있나요?
```
Spring MVC(Model-View-Controller) 프레임워크는 Spring Framework에서 제공하는 웹 어플리케이션 개발을 위한 프레임워크입니다. Spring MVC는 클라이언트 요청을 처리하고, 응답을 생성하는데 필요한 기능을 제공합니다.

Spring MVC의 특징은 다음과 같습니다.

1. Model-View-Controller 패턴: Spring MVC는 Model-View-Controller 패턴을 기반으로 구현되어 있습니다. 이 패턴은 어플리케이션을 3가지 구성요소로 분리하여 개발합니다. 데이터와 비즈니스 로직을 처리하는 Model, 화면을 생성하는 View, 클라이언트 요청과 응답을 처리하는 Controller입니다.

2. 유연성과 확장성: Spring MVC는 다양한 View 기술과 연동이 가능합니다. 예를 들어, JSP, Thymeleaf, Freemarker, Velocity 등 다양한 View 기술을 사용할 수 있습니다. 이렇게 유연한 구성이 가능하기 때문에 확장성이 높아집니다.

3. 인터셉터(Interceptor): Spring MVC는 인터셉터를 제공합니다. 인터셉터는 Controller의 요청 처리 전후에 수행되는 기능을 구현할 수 있습니다. 인터셉터를 사용하여 로깅, 보안 등의 기능을 구현할 수 있습니다.

4. 테스트 용이성: Spring MVC는 JUnit과 같은 테스트 프레임워크를 지원합니다. 이를 통해 테스트 용이성이 높아집니다.

5. RESTful 웹 서비스 지원: Spring MVC는 RESTful 웹 서비스를 쉽게 개발할 수 있는 기능을 제공합니다.

6. 검증(Validation) 기능: Spring MVC는 사용자 입력 데이터의 검증을 지원합니다. 이를 통해 사용자 입력 데이터의 유효성 검사를 간편하게 할 수 있습니다.

Spring MVC는 이러한 특징을 통해 개발자가 웹 어플리케이션을 보다 쉽게 개발할 수 있도록 도와줍니다.
```

# Spring Boot와 Spring Framework의 차이점은 무엇인가요?
```
Spring Boot와 Spring Framework는 모두 Java 기반의 웹 어플리케이션 개발을 지원하는 프레임워크이지만, 몇 가지 차이점이 있습니다.

1. 설정의 간편화
- Spring Framework는 XML, Java Config 등을 사용하여 설정을 관리하지만, Spring Boot는 자동 설정(auto configuration) 기능을 제공하여 설정의 간편화를 지원합니다.
- Spring Boot는 starter 모듈을 제공하여 필요한 의존성을 추가하고 설정 파일을 생성하는 등의 작업을 자동화합니다.

2. 내장 서버
- Spring Framework는 서버를 구축하기 위해 Tomcat, Jetty, Undertow 등의 외부 서버를 사용해야 합니다.
- Spring Boot는 내장 서버(embedded server)를 제공하여 애플리케이션 실행에 필요한 서버를 자체적으로 포함하고 있습니다.

3. 개발 생산성
- Spring Boot는 개발 생산성을 높이기 위해 여러 기능을 제공합니다. 예를 들어, 빠른 애플리케이션 개발을 위한 DevTools, 애플리케이션 모니터링을 위한 Actuator, 테스트 환경을 지원하는 Test 모듈 등이 있습니다.

요약하면, Spring Boot는 Spring Framework를 기반으로 한 더 나은 생산성과 간편한 설정, 내장 서버 등의 기능을 제공하는 프레임워크입니다. Spring Framework는 개발자가 직접 설정을 관리하고 외부 서버를 사용해야 하지만, Spring Boot는 자동 설정과 내장 서버를 제공하여 개발 생산성과 개발 환경의 간편화를 지원합니다.
```

# Spring Security란 무엇인가요? 어떤 보안 기능을 제공하나요?
```
Spring Security는 웹 애플리케이션과 서비스의 보안을 담당하는 Spring Framework의 모듈 중 하나로, 인증과 인가를 담당합니다. Spring Security는 다양한 인증 및 인가 메커니즘을 지원하여 다양한 보안 요구 사항에 대응할 수 있습니다.

Spring Security가 제공하는 주요 보안 기능으로는 다음과 같은 것이 있습니다.

1. 인증(Authentication): 사용자가 시스템에 접근할 때, 사용자의 ID와 비밀번호 등의 정보를 검증하는 기능
2. 인가(Authorization): 인증된 사용자가 시스템의 특정한 자원에 접근할 수 있는 권한을 부여하는 기능
3. 보안 설정(Security Configuration): Spring Security에서 제공하는 보안 설정을 통해, URL 패턴, HTTP 메서드, 세션 관리 등의 보안 요소를 구성할 수 있습니다.
4. CSRF(Cross-Site Request Forgery) 방어: 웹 어플리케이션에서 CSRF 공격을 방어하기 위해, Spring Security는 CSRF 토큰을 사용합니다.
5. XSS(Cross-Site Scripting) 방어: 웹 어플리케이션에서 XSS 공격을 방어하기 위해, Spring Security는 입력값을 필터링하거나 이스케이프하여 보호합니다.

이 외에도 Spring Security는 다양한 인증 방식(OAuth, LDAP 등)을 지원하고, 커스터마이징이 가능하여 보다 복잡한 보안 요구 사항에 대응할 수 있습니다.
```

# Spring Framework에서 사용되는 DI(Dependency Injection)란 무엇인가요? 어떤 장점이 있나요?
```
DI(Dependency Injection)는 객체 간의 의존 관계를 설정하는 방식 중 하나로, 객체를 생성하는 시점에 해당 객체가 의존하는 다른 객체를 외부에서 전달받아 의존성을 주입하는 방식입니다.

Spring Framework에서 DI는 IoC(Inversion of Control)라는 개념과 함께 사용되며, IoC는 객체 생성과 의존 관계 설정 등의 제어 권한을 프레임워크에 위임하여 객체의 생명주기를 관리하는 방식입니다.

DI의 장점으로는 다음과 같은 것이 있습니다.

1. 유연성: DI를 사용하면 의존성을 주입하는 구현체를 변경하거나 확장하는 작업이 간단해집니다. 이로 인해 애플리케이션의 유연성과 확장성이 높아집니다.
2. 모듈성: DI를 사용하면 의존하는 객체 간의 결합도를 낮출 수 있습니다. 이는 애플리케이션의 모듈성을 높이고, 코드의 재사용성을 높입니다.
3. 테스트 용이성: DI를 사용하면 테스트를 보다 쉽게 작성할 수 있습니다. 의존하는 객체를 모의 객체(mock object)로 대체하여 테스트를 수행할 수 있기 때문입니다.
4. 중복 코드 제거: DI를 사용하면 의존성 주입을 위한 중복 코드를 제거할 수 있습니다. 이는 코드의 가독성과 유지보수성을 높입니다.

Spring Framework에서는 XML, 어노테이션, 자바 설정 클래스 등 다양한 방식으로 DI를 구현할 수 있습니다.
```

# Spring Framework에서 제공하는 테스트 모듈은 어떤 것이 있나요? 어떻게 사용하나요?
```
Spring Framework에서는 다양한 테스트 모듈을 제공합니다. 대표적인 모듈은 다음과 같습니다.

1. spring-test: Spring 기반의 테스트를 지원하는 모듈입니다. JUnit과 함께 사용하여 Spring 애플리케이션 컨텍스트를 로드하고 테스트를 수행할 수 있습니다.
2. spring-mock: Spring Framework에서 사용되는 다양한 모듈에 대한 mock 객체를 생성하는 기능을 제공합니다. Mockito, EasyMock 등과 같은 다른 mock 라이브러리와 함께 사용할 수 있습니다.
3. spring-test-dbunit: DBUnit을 이용하여 데이터베이스 테스트를 수행할 수 있는 모듈입니다.
4. spring-test-mvc: Spring MVC를 사용하는 웹 애플리케이션의 테스트를 지원하는 모듈입니다. MockMvc 객체를 이용하여 컨트롤러를 테스트할 수 있습니다.
이러한 모듈들은 JUnit과 함께 사용되어 Spring 애플리케이션을 단위 테스트하고, 모듈 간의 통합 테스트를 수행할 수 있습니다. Spring Framework에서는 테스트를 위한 여러가지 어노테이션을 제공하며, 테스트 수행 시 애플리케이션 컨텍스트를 로드하고 자동으로 트랜잭션을 관리하는 등의 기능을 제공합니다.

일반적으로 테스트를 작성할 때에는 Mock 객체를 이용하여 각각의 모듈을 분리하고, 모듈 간의 의존성을 최소화하여 독립적으로 테스트를 수행하며, 테스트가 가능한 모듈 설계를 고려하는 것이 좋습니다.
```

## Spring Framework 필터, 인터셉터, AOP의 차이점은 무엇인가요?
```

필터(Filter), 인터셉터(Interceptor), AOP(Aspect-Oriented Programming)는 모두 웹 어플리케이션에서 요청과 응답을 가로채서 처리하는 기능을 제공하지만, 그 목적과 사용 방법에서 차이가 있습니다.

1. 필터(Filter)
- 서블릿 컨테이너에서 요청과 응답을 가로채서 처리하는 기능을 제공하는 컴포넌트입니다.
- 일반적으로 URL 패턴, MIME 타입 등과 같은 요청 정보를 기반으로 요청과 응답을 필터링하고 처리합니다.
- 요청과 응답의 모든 처리 과정을 가로채서 처리할 수 있기 때문에, 세션 관리, 인코딩, 보안 등과 같은 공통 기능을 처리할 수 있습니다.

2. 인터셉터(Interceptor)
- Spring MVC에서 제공하는 기능으로, 컨트롤러에서 요청을 처리하기 전과 후에 처리하는 기능을 제공합니다.
- 일반적으로 로그인 인증, 권한 체크 등과 같은 공통 기능을 처리하는데 사용됩니다.
- 컨트롤러와 밀접한 관련이 있는 요청 처리 전/후의 기능을 구현할 수 있습니다.

3. AOP(Aspect-Oriented Programming)
- 여러 모듈에서 공통으로 사용하는 기능을 분리하여 재사용성을 높이는 기법입니다.
- 일반적으로 로깅, 보안, 트랜잭션 처리 등과 같은 공통 기능을 모듈에서 분리하여 처리합니다.
- 스프링 AOP는 프록시 패턴을 사용하여 여러 객체에 대한 공통 기능을 처리하는 방법을 제공합니다.

요약하면, 필터는 서블릿 컨테이너에서 요청과 응답을 가로채서 처리하는 기능을 제공하고, 인터셉터는 컨트롤러에서 요청을 처리하기 전과 후에 처리하는 기능을 제공합니다. AOP는 여러 모듈에서 공통으로 사용하는 기능을 분리하여 재사용성을 높이는 기법입니다.

+ Interceptor와 Filter는 주소로 대상을 구분해서 걸러내야하는 반면, AOP는 주소, 파라미터, 애노테이션 등 다양한 방법으로 대상을 지정할 수 있다.
```

> 참조: https://goddaehee.tistory.com/154
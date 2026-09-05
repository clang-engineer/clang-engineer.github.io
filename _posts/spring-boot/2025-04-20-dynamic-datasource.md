---
title       : "Spring 동적 DataSource — Routing Key가 Connection 선택으로 이어지는 구조"
description : "AbstractRoutingDataSource가 Connection 획득 시 Routing Key를 읽어 실제 DataSource를 선택하는 구조와 ThreadLocal Context, AOP 경계, Transaction 시작 시점의 주의점을 정리한다."
date        : 2025-04-20 09:01:11 +0900
updated     : 2026-09-05 21:35:00 +0900
categories  : [spring-boot, "설정·아키텍처"]
tags        : [datasource, routing, transaction]
pin         : false
hidden      : false
---

여러 DB 중 하나를 요청이나 업무 맥락에 따라 선택해야 할 때 Spring의 `AbstractRoutingDataSource`를 사용할 수 있다. 핵심은 DataSource를 호출할 때마다 갈아끼우는 것이 아니라, **Application이 Routing Key를 Context에 넣고 실제 Connection을 얻는 순간 Spring이 그 Key에 해당하는 DataSource를 선택하게 만드는 것**이다.

```text
Service 호출
   ↓
Routing Key 설정
   ↓
Transaction / JDBC가 Connection 요청
   ↓
AbstractRoutingDataSource
   ↓ determineCurrentLookupKey()
Routing Key 조회
   ↓
실제 DataSource 선택
   ↓
Connection 획득
```

이 흐름을 먼저 이해하면 `ThreadLocal`, AOP, `@Transactional`의 순서가 왜 중요한지 자연스럽게 보인다.

## 구성요소의 역할

```text
@UseDataSource("db2")
        ↓
AOP
        ↓
DataSourceContextHolder
        ↓
RoutingDataSource
        ↓
Map<RoutingKey, DataSource>
        ↓
실제 DB
```

각 구성요소는 책임이 다르다.

| 구성요소 | 역할 |
|---|---|
| `@UseDataSource` | 호출 지점에서 어떤 DB를 원하는지 선언 |
| AOP / Interceptor | 메서드 실행 경계에서 Routing Key 설정·해제 |
| `DataSourceContextHolder` | 현재 실행 흐름의 Routing Key 보관 |
| `RoutingDataSource` | 현재 Key를 Spring에 반환 |
| `targetDataSources` | Key와 실제 DataSource의 매핑 |

## 1. Routing Key를 보관한다

동기 Servlet 요청처럼 한 Thread에서 실행 흐름이 유지되는 구조에서는 `ThreadLocal`을 사용할 수 있다.

```java
public final class DataSourceContextHolder {
    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();

    public static void set(String key) {
        CONTEXT.set(key);
    }

    public static String get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
```

Thread Pool은 Thread를 재사용하므로 `clear()`가 빠지면 다음 요청이 이전 요청의 Routing Key를 물려받을 수 있다. 따라서 설정과 해제는 반드시 한 실행 경계에서 묶는다.

> `ThreadLocal`은 Thread와 실행 Context가 일치하는 동기 모델을 전제로 한다. Reactor/WebFlux나 실행 Thread가 바뀌는 비동기 흐름에서는 Reactor Context 등 해당 실행 모델에 맞는 Context 전달 방식을 사용해야 한다.

## 2. AbstractRoutingDataSource는 Key만 결정한다

```java
public class RoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceContextHolder.get();
    }
}
```

`determineCurrentLookupKey()`가 직접 Connection을 만들거나 DB 설정을 바꾸는 것은 아니다. 현재 Key를 반환하면 `AbstractRoutingDataSource`가 등록된 Target Map에서 실제 DataSource를 찾는다.

```text
"db2"
  ↓
targetDataSources.get("db2")
  ↓
HikariDataSource(db2)
  ↓
Connection
```

## 3. 실제 DataSource들을 등록한다

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource routingDataSource() {
        Map<Object, Object> targets = new HashMap<>();
        targets.put("db1", createDataSource("jdbc:mysql://localhost:3306/db1", "user", "pass"));
        targets.put("db2", createDataSource("jdbc:mysql://localhost:3306/db2", "user", "pass"));

        RoutingDataSource routing = new RoutingDataSource();
        routing.setTargetDataSources(targets);
        routing.setDefaultTargetDataSource(targets.get("db1"));
        return routing;
    }

    private DataSource createDataSource(String url, String username, String password) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(url);
        ds.setUsername(username);
        ds.setPassword(password);
        return ds;
    }
}
```

Application의 `JdbcTemplate`, JPA, Transaction Manager는 개별 DataSource가 아니라 이 Routing DataSource를 바라보게 한다.

## 4. 호출 경계에서 Key를 설정하고 반드시 해제한다

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface UseDataSource {
    String value();
}
```

AOP에서는 `@Before` + `@After`를 따로 두기보다 `try/finally`가 있는 `@Around` 형태가 해제 보장을 이해하기 쉽다.

```java
@Aspect
@Component
public class DataSourceRoutingAspect {

    @Around("@annotation(useDataSource)")
    public Object route(ProceedingJoinPoint pjp,
                        UseDataSource useDataSource) throws Throwable {
        DataSourceContextHolder.set(useDataSource.value());
        try {
            return pjp.proceed();
        } finally {
            DataSourceContextHolder.clear();
        }
    }
}
```

사용 코드는 Routing 구현을 알 필요가 없다.

```java
@Service
public class UserService {

    @UseDataSource("db2")
    public List<User> getUsersFromDb2() {
        return repository.findAll();
    }
}
```

## 가장 중요한 경계 — Transaction보다 먼저 Key가 정해져야 한다

Routing DataSource가 실제 DB를 선택하는 시점은 보통 **Connection을 처음 획득하는 시점**이다. Transaction이 먼저 시작되어 Connection이 이미 특정 DataSource에서 확보됐다면, 그 뒤 Routing Key를 바꿔도 현재 Transaction의 Connection이 다른 DB로 순간 이동하지 않는다.

```text
올바른 개념 순서

Routing Key 결정
      ↓
Transaction 시작
      ↓
Connection 획득
      ↓
Query
```

따라서 `@UseDataSource`와 `@Transactional`을 함께 쓸 때는 두 Advice의 순서를 명시적으로 관리해야 한다. AOP Order나 별도의 상위 Routing 경계를 사용해 **Routing Advice가 Transaction Advice보다 먼저 적용되는지** 확인한다.

이 부분을 놓치면 코드상 Key는 `db2`인데 실제 Query는 기존 `db1` Connection에서 실행되는 것처럼 보이는 문제가 생길 수 있다.

## Routing Key는 어디서 올 수 있나

Annotation은 하나의 입력 방식일 뿐이다.

```text
Routing Key
├─ Tenant ID
├─ Read / Write 역할
├─ Request Header
├─ 인증 사용자·조직
└─ 업무 Domain
```

예를 들어 Multi-Tenant 구조에서는 Tenant ID를 Key로 사용할 수 있고, Read Replica 구조에서는 `primary` / `replica`처럼 역할을 Key로 둘 수 있다.

다만 사용자가 임의로 보낸 Header 값을 검증 없이 DataSource Key로 사용하지 않는다. 허용된 Tenant나 DB Mapping을 Application에서 검증한 뒤 Context에 넣는다.

## 런타임에 DataSource를 추가하는 경우

`AbstractRoutingDataSource`는 초기화 시 Target DataSource Map을 내부에서 해석한다. 런타임에 `setTargetDataSources()`로 Map을 바꾼다면 초기화 동작과 동시성까지 고려해야 한다.

단순히 `afterPropertiesSet()`을 다시 호출하는 패턴은 운영 중 요청과 동시에 Map이 바뀌는 구조에서 안전성을 자동으로 보장하지 않는다. DataSource가 자주 추가·삭제되는 시스템이라면 고정 Map을 재초기화하는 방식보다 **동적 Registry와 명시적인 동시성 설계**를 별도 계층으로 두는 편이 낫다.

## 언제 이 패턴이 맞나

잘 맞는 경우:

- Tenant별 DB가 분리되어 있고 요청마다 Tenant가 결정됨
- Primary / Read Replica를 업무 규칙에 따라 선택함
- 같은 Repository 구조로 여러 물리 DB를 접근해야 함

주의할 경우:

- 하나의 Transaction 안에서 여러 DB를 자유롭게 오가야 함
- Reactive 실행 모델이라 ThreadLocal Context가 유지되지 않음
- Routing 대상이 매우 자주 동적으로 추가·삭제됨

`AbstractRoutingDataSource`는 **Connection을 얻기 전에 하나의 대상 DB를 고르는 Router**다. 여러 DB를 하나의 원자적 Transaction으로 묶어주는 기능은 아니다.

## 정리

Spring 동적 DataSource의 핵심 흐름은 다음 하나다.

```text
Context에 Routing Key 설정
        ↓
Connection 요청
        ↓
AbstractRoutingDataSource가 Key 조회
        ↓
Target DataSource 선택
        ↓
Connection 반환
        ↓
실행 후 Context 정리
```

따라서 구현에서 가장 중요한 것은 클래스 개수가 아니라 세 가지 경계다.

1. Routing Key가 **Connection 획득 전에** 정해지는가
2. ThreadLocal Context가 **항상 해제**되는가
3. Transaction·비동기 실행 모델과 **Context의 수명**이 일치하는가

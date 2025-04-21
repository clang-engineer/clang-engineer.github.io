---
title       : 동적 데이터 소스 설정
description : >-
    Spring Boot에서 AbstractRoutingDataSource 를 사용하여 동적 데이터 소스를 설정하는 방법을 기록
date        : 2025-04-20 09:01:11 +0900
updated     : 2025-04-20 09:01:11 +0900
categories  : [dev, java]
tags        : [spring, datasource]
pin         : false
hidden      : false
---

## 기본 개념
- AbstractRoutingDataSource: 요청에 따라 사용할 DataSource를 동적으로 결정하는 기능을 제공하는 추상 클래스.
- determineCurrentLookupKey(): 현재 요청에서 사용할 데이터소스를 결정하기 위한 키(예: 테넌트 ID)를 반환.

## 구성 단계
1. DataSourceContextHolder 생성
어떤 데이터소스를 사용할지 ThreadLocal로 저장하는 static 클래스를 생성.
```java
public class DataSourceContextHolder {
    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();

    public static void setDataSourceKey(String key) {
        CONTEXT.set(key);
    }

    public static String getDataSourceKey() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
```
2. RoutingDataSource 구현
AbstractRoutingDataSource를 상속하여 어떻게 데이터소스를 결정할지 구현.
```java
public class RoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceContextHolder.getDataSourceKey();
    }
}
```
> 트랜잭션을 시작하거나 jdbcTemplate 또는 EntityManager 등을 통해 DB에 접근할 때 내부적으로 DataSource.getConnection()이 호출되고, <br>
이 때 Spring이 AbstractRoutingDataSource의 determineTargetDataSource()를 호출하며, <br>
거기서 determineCurrentLookupKey()를 호출해서 어떤 데이터소스를 쓸지 결정함.

3. DataSource Bean 설정
Spring Boot에서 사용할 수 있는 다중 데이터소스를 설정.
```java
@Configuration
public class DataSourceConfig {
    @Bean
    @Primary
    public DataSource routingDataSource() {
        Map<Object, Object> targetDataSources = new HashMap<>();

        // 예시: datasource1, datasource2
        targetDataSources.put("db1", createDataSource("jdbc:mysql://localhost:3306/db1", "user", "pass"));
        targetDataSources.put("db2", createDataSource("jdbc:mysql://localhost:3306/db2", "user", "pass"));

        RoutingDataSource routingDataSource = new RoutingDataSource();
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(targetDataSources.get("db1"));

        return routingDataSource;
    }

    private DataSource createDataSource(String url, String username, String password) {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource routingDataSource) {
        return new JdbcTemplate(routingDataSource);
    }
}
```
4. AOP 또는 인터셉터로 데이터소스 설정
요청에 따라 사용할 데이터소스를 지정해주기 위한 AOP 설정.
```java
@Aspect
@Component
public class DataSourceRoutingAspect {
    @Before("@annotation(UseDataSource)")
    public void switchDataSource(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        UseDataSource annotation = method.getAnnotation(UseDataSource.class);

        if (annotation != null) {
            DataSourceContextHolder.setDataSourceKey(annotation.value());
        }
    }
    @After("@annotation(UseDataSource)")
    public void clearDataSource() {
        DataSourceContextHolder.clear();
    }
}
//
@Target({ ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
public @interface UseDataSource {
    String value();
}
```

5. 사용 예시
```java
@Service
public class UserService {

    @UseDataSource("db2")
    public void getUsersFromDb2() {
        // 이 메서드는 db2를 통해 실행됨
    }

    @UseDataSource("db1")
    public void getUsersFromDb1() {
        // 이 메서드는 db1을 통해 실행됨
    }
}
```

## 추가 팁
- 데이터소스를 동적으로 추가하고 싶다면 setTargetDataSources() 호출 후 afterPropertiesSet()도 다시 호출해야 반영됨.
- 트랜잭션 사용 시에도 데이터소스 결정이 determineCurrentLookupKey() 안에서 일어나야 제대로 작동함.
- 필요하다면 request header, session, 인증정보 기반으로도 데이터소스를 정할 수 있음.

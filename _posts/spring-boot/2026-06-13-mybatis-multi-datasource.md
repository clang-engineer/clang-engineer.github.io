---
title       : "Spring Boot + MyBatis로 두 개의 데이터소스 쓰기"
description : "Primary/Secondary 두 DataSource를 분리하고 MapperScan으로 패키지별로 매핑"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [spring-boot, "설정·아키텍처"]
tags        : [spring-boot, mybatis, datasource, hikari]
pin         : false
hidden      : false
---

여러 DB를 한 애플리케이션에서 다룰 때, MyBatis의 `MapperScan`을 패키지 단위로 나누고 각 패키지에 별도 `SqlSessionFactory`를 매핑한다.

## yaml

```yaml
spring:
  datasource:
    hikari:
      primary:
        driver-class-name: org.h2.Driver
        jdbc-url: jdbc:h2:file:./build/h2db/db/primary;DB_CLOSE_DELAY=-1
        username: primary_user
        password:
      secondary:
        driver-class-name: org.h2.Driver
        jdbc-url: jdbc:h2:file:./build/h2db/db/secondary;DB_CLOSE_DELAY=-1
        username: secondary_user
        password:
```

## Primary DataSource

`@Primary`가 붙은 빈이 기본 주입 대상이 된다.

```java
@Configuration
@EnableTransactionManagement
@MapperScan(value = "com.test.dao.primary", sqlSessionFactoryRef = "primarySqlSessionFactory")
public class PrimaryDatasourceConfiguration {

    @Bean @Primary
    @ConfigurationProperties("spring.datasource.hikari.primary")
    public HikariConfig primaryHikariConfig() {
        return new HikariConfig();
    }

    @Bean @Primary
    public DataSource primaryDataSource() {
        return new HikariDataSource(primaryHikariConfig());
    }

    @Bean(name = "primarySqlSessionFactory") @Primary
    public SqlSessionFactory sqlSessionFactory(
            @Qualifier("primaryDataSource") DataSource dataSource,
            ApplicationContext applicationContext) throws Exception {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        factory.setMapperLocations(applicationContext.getResources("classpath:mapper/primary/*.xml"));
        factory.setTypeAliasesPackage("com.test.service.dto");
        return factory.getObject();
    }

    @Bean(name = "primarySqlSessionTemplate") @Primary
    public SqlSessionTemplate sqlSessionTemplate(
            @Qualifier("primarySqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
```

## Secondary DataSource

`@Primary`만 빠진 같은 구조.

```java
@Configuration
@EnableTransactionManagement
@MapperScan(value = "com.test.dao.secondary", sqlSessionFactoryRef = "secondarySqlSessionFactory")
public class SecondaryDatasourceConfiguration {

    @Bean
    @ConfigurationProperties("spring.datasource.hikari.secondary")
    public HikariConfig secondaryHikariConfig() {
        return new HikariConfig();
    }

    @Bean
    public DataSource secondaryDataSource() {
        return new HikariDataSource(secondaryHikariConfig());
    }

    @Bean(name = "secondarySqlSessionFactory")
    public SqlSessionFactory sqlSessionFactory(
            @Qualifier("secondaryDataSource") DataSource dataSource,
            ApplicationContext applicationContext) throws Exception {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        factory.setMapperLocations(applicationContext.getResources("classpath:mapper/secondary/*.xml"));
        factory.setTypeAliasesPackage("com.test.service.dto");
        return factory.getObject();
    }

    @Bean(name = "secondarySqlSessionTemplate")
    public SqlSessionTemplate sqlSessionTemplate(
            @Qualifier("secondarySqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
```

## 패키지 분리 규칙

- DAO/Mapper 인터페이스는 `com.test.dao.primary`, `com.test.dao.secondary`로 분리
- XML mapper도 `classpath:mapper/primary/*.xml`, `classpath:mapper/secondary/*.xml`로 분리
- 트랜잭션은 보통 Primary 기준. Secondary 쪽에 별도 트랜잭션이 필요하면 `@Transactional("secondaryTransactionManager")`로 명시 주입

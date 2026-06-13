---
title       : "Spring Boot Undertow에서 HTTP·HTTPS 듀얼 포트 + 강제 리다이렉트"
description : "UndertowServletWebServerFactory에 HTTP 리스너를 추가하고 보안 제약으로 HTTPS 포트로 보내는 설정"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [spring-boot, "설정·아키텍처"]
tags        : [spring-boot, undertow, https, redirect]
pin         : false
hidden      : false
---

Spring Boot는 기본적으로 한 포트만 노출한다. Undertow에서 HTTP와 HTTPS를 동시에 열고 HTTP 요청을 자동으로 HTTPS로 보내려면, 팩토리 빈에서 리스너를 추가하고 servlet 보안 제약을 건다.

## 설정

```java
@Configuration
public class UndertowConfig {

    @Value("${http.port:0}")
    private int httpPort;

    @Value("${server.port:0}")
    private int sslPort;

    @Bean
    @Profile(JHipsterConstants.SPRING_PROFILE_PRODUCTION)
    public ServletWebServerFactory serverFactory() {
        UndertowServletWebServerFactory factory = new UndertowServletWebServerFactory();

        factory.addBuilderCustomizers(builder ->
            builder.addHttpListener(httpPort, "0.0.0.0")
        );

        factory.addDeploymentInfoCustomizers(deploymentInfo ->
            deploymentInfo.addSecurityConstraint(
                new SecurityConstraint()
                    .addWebResourceCollection(new WebResourceCollection().addUrlPattern("/*"))
                    .setTransportGuaranteeType(TransportGuaranteeType.CONFIDENTIAL)
                    .setEmptyRoleSemantic(SecurityInfo.EmptyRoleSemantic.PERMIT))
                .setConfidentialPortManager(exchange -> sslPort)
        );

        return factory;
    }
}
```

## 동작 흐름

1. `addHttpListener`로 HTTPS 기본 포트(`server.port`)와 별개로 HTTP 포트를 하나 더 연다.
2. `TransportGuaranteeType.CONFIDENTIAL`은 "이 URL은 보안 채널로 와야 한다"는 servlet 스펙 보안 제약이다.
3. 위 제약을 만족하지 못한 HTTP 요청은 `ConfidentialPortManager`가 알려준 `sslPort`로 자동 리다이렉트된다.

운영 프로파일에만 적용하려고 `@Profile`로 묶었다. 로컬은 보통 HTTP 하나로 띄운다.

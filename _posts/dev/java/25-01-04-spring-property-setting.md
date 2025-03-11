---
title       : Spring boot property
description : >-
    Spring boot에서 property를 설정하는 여러 방법을 정리해보았습니다.
date        : 2025-01-14 14:32:50 +0900
updated     : 2025-01-14 14:33:52 +0900
categories  : [dev, java]
tags        : [spring, property]
pin         : false
hidden      : false
---

Spring boot에서 property를 설정하는 여러 방법을 정리해보았습니다.

## application-{profile}.yaml, application-{profile}.properties 파일을 통한 설정
- Spring boot에서는 application-{profile}.yaml, application-{profile}.properties 파일을 통해 설정을 할 수 있습니다.
- spring 이 실행될 때 profile이 접미사로 붙지 않은 application.yaml, application.properties 파일을 먼저 읽어오고, active profile에 맞는 profile을 찾아서 설정을 읽어옵니다.
- 예를 들어, application-dev.yaml 파일이 있다면, dev profile이 활성화되어 있을 때 해당 설정을 읽어옵니다.

## java -D 옵션을 통한 프로퍼티 설정
- java가 실행될 때 -D 옵션을 통해 property를 설정할 수 있습니다.
- 예를 들어, java -Dspring.port=8080 -jar app.jar와 같이 실행하면, spring.port=8080이라는 property가 설정됩니다.

## spring.config.location 옵션을 통한 프로퍼티 설정
- spring.config.location 옵션을 통해 외부 프로퍼티 파일을 설정할 수 있습니다.
- 예를 들어, java -jar app.jar --spring.config.location=classpath:/application-dev.yaml와 같이 실행하면, classpath:/application-dev.yaml 파일을 설정으로 사용합니다.

### vs spring.config.additional-location 옵션
- spring.config.location은 기본 설정 파일을 덮어쓰지만, spring.config.additional-location은 기본 설정 파일을 덮어쓰지 않습니다.

## @PropertySource 어노테이션을 통한 프로퍼티 설정
- @PropertySource 어노테이션을 통해 외부 프로퍼티 파일을 설정할 수 있습니다.
- 예를 들어, @PropertySource("classpath:/application-dev.yaml")와 같이 사용하면, classpath:/application-dev.yaml 파일을 설정으로 사용합니다.


---
layout  : wiki
title   : spring boot + webpack 방식의 프로젝트 구성에서 gradle 설정
summary : 
date    : 2025-02-05 11:00:12 +0900
updated : 2025-02-05 11:00:16 +0900
tags    : 
toc     : true
public  : true
parent  : [[etc/index]]
latex   : false
---
* TOC
{:toc}


# spring boot + webpack 방식의 프로젝트 구성에서 gradle 설정
- spring boot + webpack 방식의 프로젝트 구성에서 gradle 설정 내용을 정리해보았습니다.
- webpack을 통한 빌드 설정이 완료된 상태에서 gradle을 통해 빌드하고자 하는 경우에 대한 내용입니다.

---

# 1. gradle에서 node를 사용하기 위한 설정 (build.gradle >> plugins >> node plugin 추가)
- gradle에서 node를 사용하기 위한 설정을 추가합니다.
- build.gradle 파일에 아래와 같이 설정합니다.
- settings.gradle 을 통해 plugin을 별도 설정하지 않고 build.gradle에 설정하는 방식으로 진행합니다.

```groovy
plugins {
    // ...
    id "com.github.node-gradle.node" version "3.4.0"
}

```


---

# 2. gradle에서 npm을 사용하기 위한 설정 (build.gradle >> tasks >> npm 설정 추가)
- gradle에서 npm을 사용하기 위한 설정을 추가합니다.
- build.gradle 파일에 아래와 같이 설정합니다.


```groovy
task webapp(type: NpmTask) {  // npm task 선언
    inputs.property('appVersion', project.version) // 현재 프로젝트 버전을 입력값으로 설정해 task의 변경 여부를 체크하도록 설하
    inputs.files("package-lock.json").withPropertyName('package-lock').withPathSensitivity(PathSensitivity.RELATIVE)  // package-lock.json 파일을 입력값으로 설정하여 변경 여부를 체크하도록 설정.
    inputs.files("build.gradle").withPropertyName('build.gradle') .withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir("src/main/webapp/").withPropertyName("webapp-source-dir").withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.files("tsconfig.json").withPropertyName("tsconfig").withPathSensitivity(PathSensitivity.RELATIVE)

    def webpackDevFiles = fileTree("webpack/")  
    // webpackDevFiles.exclude("webpack.prod.js")  // 운영 환경 설정을 별도로 관리하는 경우에는 해당 설정을 추가하여 webpack.prod.js 파일을 제외하도록 설는
    inputs.files(webpackDevFiles).withPropertyName("webpack-dir").withPathSensitivity(PathSensitivity.RELATIVE)  // webpack 설정 파일을 입력값으로 설정하여 변경 여부를 체크하도록 설정.
    outputs.dir("build/resources/main/static/").withPropertyName("webapp-build-dir")  // webpack 빌드 결과물을 spring boot의 static 디렉토리로 복사하기 위한 설정

    dependsOn npmInstall // npm install task가 실행되기 전에 실행되도록 설정

    args = ["run", "webapp:build"]  // npm script 실행 명령어 설정
    environment = [APP_VERSION: project.version]  // 환경 변수 설정
}

processResources.dependsOn webapp  // processResources task가 실행되기 전에 webapp task를 실행하도록 설정
bootJar.dependsOn processResources  // bootJar task가 실행되기 전에 processResources task를 실행하도록 설정
```

---

# react resource 경로로 직접 접근시 404 에러를 막기위한 forward 설정
- spring boot에서 react-router-dom을 사용할 때 발생하는 404 에러 처리를 위한 설정을 추가합니다.
- 아래 컨트롤러는 프론트엔드 라우팅을 지원하기 위한 목적입니다.
- 백엔드에서 매핑되지 않은 모든 요청(웹소켓 제외)은 프론트엔드의 **단일 페이지 애플리케이션(SPA)**으로 포워딩됩니다.

```java
// ClientForwardController.java
@Controller
class ClientForwardController {
    @GetMapping(value = ["/{path:[^\\.]*}", "/{path:^(?!websocket).*}/**/{path:[^\\.]*}"])
    fun forward() = "forward:/"
}
```

- Spring Boot 2.6 이상에서는 PathPatternParser가 기본으로 사용되어 /**/와 정규식을 함께 사용하는 경우 오류가 발생합니다.  
- 만약 위 오류가 있다면 spring.mvc.pathmatch.matching-strategy=ant_path_matcher 설정으로 해결하거나 패턴을 간소화해야 합니다.

```yml
# application.yml
spring:
  mvc:
    pathmatch:
      matching-strategy: ant_path_matcher  

```



---
layout  : wiki
title   : vs code로 스프링 디버깅을 원할 경우
summary : 
date    : 2021-12-23 10:57:57 +0900
updated : 2021-12-31 13:54:45 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}

## 확장팩 목록

- Language support for java (필수)
- Debugger for java (필수)
- Extension pack for Java
- Spring Boot Extension Pack
- Gradle Extension Pack 
- Lombok Annotation Support for VS Code
- Vim

## Java 셋팅

### setting.json

java환경변수 설정 
```
"java.home": "/Library/Java/JavaVirtualMachines/jdk-11.0.5.jdk/Contents/Home",
```

gradle task로 디버깅시
```
"gradle.javaDebug": {
    "tasks": [
        "bootRun"
    ],
    "clean": true
}
```

### launch.json (sidebar >> Run and Debug >> add configuration 시 생성됨)
```
"version": "0.2.0",
"configurations": [
    {
        "type": "java",
        "name": "Launch TestSystemApp",
        "request": "launch",
        "mainClass": "com.zero.TestSystemApp",
        "projectName": "testsystem",
        "vmArgs": [
            "-Dspring.profiles.active=dev",
            "-Djasypt.encryptor.password=1234"
        ],
        "console": "internalConsole"
    }, 
]
```



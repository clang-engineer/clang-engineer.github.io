---
layout  : wiki
title   : nGrinder 
summary : 
date    : 2024-01-18 10:15:10 +0900
updated : 2024-01-18 10:44:31 +0900
tags    : 
toc     : true
public  : true
parent  : [[tools/index]]
latex   : false
---
* TOC
{:toc}

# nGrinder 개요
- nGrinder는 성능 테스트를 위한 오픈소스 툴이다.
- nGrinder는 Java로 개발되었으며, Spring Framework 기반으로 되어있다.
- nGrinder는 성능 테스트를 위한 스크립트를 작성할 수 있으며, 이를 통해 성능 테스트를 수행할 수 있다. (jython, groovy등의 스크립트를 지원한다.)
- nGrinder는 성능 테스트를 위한 컨트롤러와 에이전트로 구성되어 있다. (<-> JMeter는 컨트롤러와 에이전트가 없는 단독 데스크탑)
    - 컨트롤러는 성능 테스트를 위한 스크립트를 작성하고, 에이전트에게 성능 테스트를 요청한다.
    - 에이전트는 컨트롤러로부터 성능 테스트를 요청받으면, 요청받은 스크립트를 실행하고, 결과를 컨트롤러에게 전달한다.

# nGrinder 설치
- nGrinder는 Java로 개발되었으므로, Java가 설치되어 있어야 한다.
- nGrinder는 컨트롤러와 에이전트로 구성되어 있으므로, 컨트롤러와 에이전트를 각각 설치해야 한다.
- [nGrinder 공식 홈페이지](https://naver.github.io/ngrinder/)에서 최신버전을 다운로드 받을 수 있다.


# nGrinder 실행
## 컨트롤러 실행
- nGrinder 컨트롤러는 ngrinder-controller-{version}.war 파일을 실행하면 된다.
- ngrinder-controller-{version}.war 파일을 실행하면, 내장된 Tomcat이 실행되고, 8080 포트로 서비스를 제공한다
- ngrinder-controller-{version}.war 파일을 실행하는 방법은 아래와 같다.
    - Windows: ngrinder-controller-{version}.war 파일을 더블클릭하거나, 명령 프롬프트에서 java -jar ngrinder-controller-{version}.war 명령어를 실행한다.
    - Mac: 터미널에서 java -jar ngrinder-controller-{version}.war 명령어를 실행한다.

```sh
java -Djava.io.tmpdir={tempDir} -jar ./ngrinder-controller-{version}.war --port={port}
```

## 에이전트 실행
![ngrinder-agent](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2F7sorn%2FbtrZJc9eIHA%2F5Lv8YXb4ILQucpqlCMr17K%2Fimg.png)
Aagent를 다운로드 후

```sh
tar -xvf ngrinder-agent-{version}-localhost.tar // 압축풀기
cd ngrinder-agent // 디렉토리 이동
./run_agent.sh // 에이전트 실행
```

## nGrinder 접속
- nGrinder 컨트롤러가 실행되고 나면, 브라우저에서 http://localhost:{port} 으로 접속하면 된다.
- nGrinder 컨트롤러의 기본 포트는 8080이다.
- nGrinder 컨트롤러의 기본 계정은 admin/admin이다.

# nGrinder 스크립트 작성
- nGrinder는 성능 테스트를 위한 스크립트를 작성할 수 있다.
- nGrinder는 jython, groovy, scala 등의 스크립트를 지원한다.
- nGrinder는 성능 테스트를 위한 스크립트를 작성할 수 있는 에디터를 제공한다.

## 스크립트 작성
- nGrinder 컨트롤러에 접속한 후, 스크립트 메뉴를 클릭한다.
- 스크립트 메뉴에서 스크립트를 작성할 수 있다.
- 스크립트는 아래와 같은 형식으로 작성한다.
    - nGrinder는 성능 테스트를 위한 스크립트를 작성할 수 있다.
    - nGrinder는 jython, groovy, scala 등의 스크립트를 지원한다.
    - nGrinder는 성능 테스트를 위한 스크립트를 작성할 수 있는 에디터를 제공한다.

## 스크립트 파라미터
- ![img](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FADQDO%2FbtrZK1Tz9ks%2FtwQ4IpLAkhO1hEKgKFtgyK%2Fimg.png)
- Agent: 성능 측정에 사용할 Agent(Agent를 여러개로 구성하고 싶은 경우 Docker 나 cloud service 를 고려해 볼 수 있다.)
- Vuser per agent: Agent 당 설정할 가상 사용자 수(동시에 요청을 날리는 사용자)
- Process / Thread: 하나의 Agent에서 생성할 프로세스와 스레드 개수
- Script: 성능 측정 시 각 Agent 에서 실행할 스크립트
- Duration: 성능 측정 수행 시간
- Run Count: 스레드 당 테스트 코드를 수행하는 횟수 (Run Count와 Duration의 경우 둘 중 하나만 선택해서 기간 동안 실행하거나, Run Count 만큼 실행하게 한다.)
- Enable Ramp-up: 성능 측정 과정에서 가상 사용자를 점진적으로 늘리도록 활성화
- Initial Count: 처음 시작 시 가상 사용자 수
- Initial Sleep Time: 테스트 시작 시간
- Incremental Step: Process 또는 thread 를 증가시키는 개수
- Interval: Process 또는 Thread를 증가시키는 시간 간격

# nGrinder 성능 테스트
- Performance Test 메뉴에서 성능 테스트를 수행할 수 있다.
- 성능 테스트를 수행하기 위해서는 아래와 같은 순서로 진행한다.
    - 성능 테스트를 위한 스크립트를 작성한다.
    - 성능 테스트를 위한 스크립트를 컨트롤러에 업로드한다.
    - 성능 테스트를 위한 에이전트를 선택한다.
    - 성능 테스트를 수행한다.
    - 성능 테스트 결과를 확인한다.


# nGrinder 에러
```txt
// 컨트롤러
ERROR FileEntryRepository.java:192 : Error while fetching files from SVN for admin 

// 에이전트
agent controller: Waiting for agent controller server signal
```
- nGrinder 최신버전(3.5.8) 다운로드 받고 컨트롤러 실행, 에이전트 실행까지는 완료.
script를 만들기 위해 컨트롤러에서 script 항목을 클릭하면 컨트롤러 쪽에 위와 같은 에러 로그가 찍히면서 먹통.


## 해결
- nGrinder 사용자 설정 폴더를 완전히 삭제했다가 다시 실행하니 해결됨.
- nGrinder 사용자 설정 폴더 위치는 아래와 같다.
    - Windows: C:\Users\{사용자}\.ngrinder
    - Mac: /Users/{사용자}/.ngrinder

    
## 출처
> [https://github.com/naver/ngrinder/discussions/968](https://github.com/naver/ngrinder/discussions/968)

---
layout  : wiki
title   : Spring Batch
summary : 
date    : 2024-11-28 22:28:44 +0900
updated : 2024-11-28 22:29:00 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}

# Spring Batch가 필요한 경우
- 작업이 여러 단계로 구성된 복잡한 흐름을 가질 때 (예: 읽기 -> 처리 -> 쓰기).
- 작업이 대량 데이터를 트랜잭션 관리와 함께 처리해야 할 때.
- 실패 재시도(retry), 재시작(resume) 등의 기능이 필요한 경우.
- 작업 실행 이력을 저장하고 이를 기반으로 분석이나 관리가 필요할 때.

# Spring Batch의 구성요소
- Job: 배치 작업의 실행 단위. 여러 Step으로 구성됨.
- Step: 배치 작업의 단계. ItemReader, ItemProcessor, ItemWriter로 구성됨.
- JobRepository: Job과 Step의 실행 상태를 관리하는 저장소.
- JobLauncher: Job을 실행하는 인터페이스.
- JobInstance: Job의 실행 단위. JobParameters로 구분됨. (JobParameter가 동일하면 같은 JobInstance로 간주)
- JobExecution: Job의 실행 상태. JobInstance와 JobParameters를 가짐. 


# Spring Batch를 사용한 배치 작업의 흐름
1. Job을 생성한다.
2. Job에 Step을 추가한다.
3. Step에 ItemReader, ItemProcessor, ItemWriter를 설정한다.
4. Job을 실행한다.


# Spring Batch 상태를 저장하는 테이블
![Spring Batch Meta Tables](https://docs.spring.io/spring-batch/reference/_images/meta-data-erd.png)

##  BATCH_JOB_INSTANCE
- JobInstance의 정보를 저장하는 테이블.
- 배치가 수행되면 Job이 생성이 되고, 해당 잡 인스턴스에 대해서 관련된 모든 정보를 가진 최상위 테이블.

# BATCH_JOB_EXECUTION
- JobExecution의 정보를 저장하는 테이블.
- Job이 매번 실행될때, JobExecution이라는 새로운 객체가 생성되고, 해당 객체에 대한 정보를 저장하는 테이블.

# BATCH_JOB_EXECUTION_PARAMS
- JobParameters의 정보를 저장하는 테이블.
- JobParameters는 Job을 실행할 때 전달되는 파라미터를 저장하는 객체.

# BATCH_JOB_EXECUTION_CONTEXT
- JobExecutionContext의 정보를 저장하는 테이블.
- JobExecutionContext는 Job이 실행될 때, JobExecution과 함께 생성되는 객체로, 해당 객체에 대한 정보를 저장하는 테이블.
- 실패 후 중단된 부분부터 시작될 수 있도록 실패후 검색해야하는 상태를 나타낸다.

# BATCH_STEP_EXECUTION
- StepExecution의 정보를 저장하는 테이블.
- Step이 실행될 때, StepExecution이라는 새로운 객체가 생성되고, 해당 객체에 대한 정보를 저장하는 테이블.

# BATCH_STEP_EXECUTION_CONTEXT
- StepExecutionContext의 정보를 저장하는 테이블.
- StepExecutionContext는 Step이 실행될 때, StepExecution과 함께 생성되는 객체로, 해당 객체에 대한 정보를 저장하는 테이블.
- 실패 후 중단된 부분부터 시작될 수 있도록 실패후 검색해야하는 상태를 나타낸다.
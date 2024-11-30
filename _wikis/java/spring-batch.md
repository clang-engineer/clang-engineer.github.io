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
- Tasklet: Step의 실행 단위. Step의 실행을 담당하는 인터페이스. 
> Tasklet vs Chunk
> Tasklet은 데이터 처리 과정이 단일 작업으로 이루어질 때 사용하며, Chunk는 데이터 처리 과정이 여러 작업으로 이루어질 때 사용한다.
> Tasklet은 Step의 실행을 담당하는 인터페이스이며, Chunk는 Tasklet을 구현한 것으로, Chunk는 Tasklet을 상속받아 구현된 것이다.

- ItemReader: Step에서 사용되는 Item을 읽어오는 인터페이스.
- ItemProcessor: Step에서 사용되는 Item을 가공하는 인터페이스.
- ItemWriter: Step에서 사용되는 Item을 저장하는 인터페이스.



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
(* 동일한 JobInstance에 대해서 JobParameters가 다르면, JobExecution이 생성된다.)

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


# Spring Batch의 실행 흐름
![Spring Batch Flow](https://terasoluna-batch.github.io/guideline/5.0.0.RELEASE/en/images/ch02/SpringBatchArchitecture/Ch02_SpringBatchArchitecture_Architecture_ProcessFlow.png)

## 처리흐름 관점
1. JobScheduler 가 배치를 트리거링 하면 JobLauncher 를 실행한다.
2. JobLauncher 는 Job을 실행한다. 이때 JobExecution 을 수행하고, Execution Context 정보를 이용한다.
3. Job은 자신에게 정으된 Step을 실행한다. 이때 StepExecution을 수행하고, Execution Context 정보가 전달되어 수행된다.
4. Step은 Tasklet과 Chunk모델을 가지고 있으며 위 그림에서는 Chunk 모델로 수행되게 된다.
5. Chunk 모델은 ItemReader를 통해서 소스 데이터를 읽어 들인다.
6. ItemProcessor를 통해서 읽어들인 청크단위 데이터를 처리한다. 처리는 데이터를 변환하거나 가공하는 역할을 하게 된다.
7. ItemWriter는 처리된 청크 데이터를 쓰기작업한다. 다양한 Writer를 통해 데이터베이스에 저장하거나, 파일로 쓰는 역할을 하게 된다.

> 출처 & 참고
> - [https://terasoluna-batch.github.io/guideline/5.0.0.RELEASE/en/Ch02_SpringBatchArchitecture.html](https://terasoluna-batch.github.io/guideline/5.0.0.RELEASE/en/Ch02_SpringBatchArchitecture.html)
> - [https://devocean.sk.com/blog/techBoardDetail.do?ID=166690&boardType=techBlog&searchData=&searchDataMain=&page=&subIndex=&searchText=%EB%B0%B0%EC%B9%98&techType=&searchDataSub=&comment=](https://devocean.sk.com/blog/techBoardDetail.do?ID=166690&boardType=techBlog&searchData=&searchDataMain=&page=&subIndex=&searchText=%EB%B0%B0%EC%B9%98&techType=&searchDataSub=&comment=)
 
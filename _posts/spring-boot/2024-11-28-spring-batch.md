---
title       : "Spring Batch — Job·Step·Chunk와 재시작 메타데이터 구조"
description : "Spring Batch를 실행 모델 관점에서 Job→Step→Tasklet/Chunk로 보고, JobInstance·JobExecution·ExecutionContext 메타데이터가 중복 실행 방지와 재시작을 어떻게 가능하게 하는지 정리한다."
date        : 2024-11-28 09:00:45 +0900
updated     : 2026-09-05 21:40:00 +0900
categories  : [spring-boot, "배치·스케줄링"]
tags        : [batch, job, tasklet, chunk]
pin         : false
hidden      : false
---

Spring Batch를 이해할 때 클래스 이름부터 외우면 `Job`, `Step`, `JobExecution`, `ExecutionContext`가 서로 어떻게 연결되는지 헷갈리기 쉽다. 먼저 전체 실행 구조를 잡으면 나머지는 자연스럽게 따라온다.

```text
Scheduler / API
      ↓
JobLauncher
      ↓
Job
      ↓
Step
      ↓
Tasklet
또는
Chunk
  ├─ ItemReader
  ├─ ItemProcessor
  └─ ItemWriter
```

그리고 이 실행 흐름의 옆에는 **메타데이터 저장소(JobRepository)** 가 붙어 있다.

```text
실행 흐름
Job → Step → Chunk

상태 기록
JobInstance
  ↓
JobExecution
  ↓
StepExecution
  ↓
ExecutionContext
```

Spring Batch의 핵심 가치는 단순히 대량 데이터를 나눠 처리하는 데 있지 않다. **실행 단위를 명확히 나누고, 그 실행 상태를 저장해 중복 실행 방지와 재시작을 가능하게 하는 것**이 본체다.

## 언제 Spring Batch가 필요한가

Spring Batch가 잘 맞는 경우는 다음과 같다.

- 대량 데이터를 일정 단위로 읽고·가공하고·저장해야 함
- 여러 단계가 순서대로 이어지는 Job Flow가 필요함
- 실패한 작업을 처음부터 다시 하지 않고 재시작해야 함
- 실행 이력과 상태를 DB에 남겨 운영에서 추적해야 함
- Retry / Skip / Transaction 경계를 체계적으로 관리해야 함

반대로 단순한 주기성 메서드 한 번 실행 정도라면 `@Scheduled`만으로 충분할 수 있다. Spring Batch는 **배치 실행 상태 자체가 관리 대상일 때** 가치가 크다.

## 1. 실행 구조 — Job과 Step

### Job

하나의 배치 업무 단위다.

예를 들어 "일일 정산"이라는 Job은 다음 Step들로 구성될 수 있다.

```text
DailySettlementJob
├─ Step 1: 대상 주문 추출
├─ Step 2: 정산 계산
└─ Step 3: 결과 저장
```

### Step

Job 안에서 독립적으로 실행·상태 관리되는 단계다. 한 Step은 Tasklet 방식 또는 Chunk 방식으로 동작할 수 있다.

```text
Job
└─ Step
   ├─ Tasklet
   └─ Chunk
```

Tasklet과 Chunk는 같은 축의 선택지다.

## 2. Tasklet vs Chunk

### Tasklet

한 Step에서 하나의 작업을 수행하는 모델이다.

예:

- 파일 이동
- 임시 테이블 정리
- 외부 API 한 번 호출
- 단일 SQL 실행

```text
Step
 ↓
Tasklet.execute()
 ↓
완료
```

### Chunk

대량 데이터를 일정 묶음으로 읽고 처리하고 쓰는 반복 모델이다.

```text
read N개
  ↓
process
  ↓
write
  ↓
commit
  ↓
다음 N개
```

Chunk는 내부적으로 Tasklet 기반 Step 구현을 사용하지만, 사용자 관점에서는 **대량 데이터 처리 모델**로 이해하는 것이 더 중요하다.

구성요소는 다음과 같다.

- `ItemReader`: 입력을 읽는다.
- `ItemProcessor`: 값을 변환·검증한다.
- `ItemWriter`: 결과를 저장한다.

예를 들어 Chunk Size가 100이면 보통 100개를 읽고 처리한 뒤 한 번의 Transaction으로 Writer를 실행하고 Commit한다.

## 3. Chunk가 재시작 가능한 이유

Chunk 기반 처리의 장점은 단순 분할이 아니라 **Commit 단위가 생긴다는 것**이다.

```text
1~100   → commit
101~200 → commit
201~300 → 실패
```

실패 후 다시 시작할 때 이미 Commit된 1~200을 다시 처리하지 않고, 저장된 상태를 기준으로 이후 지점부터 이어갈 수 있다.

이를 가능하게 하는 것이 `ExecutionContext`와 Batch Metadata다.

## 4. JobInstance와 JobExecution을 구분한다

가장 자주 헷갈리는 부분이다.

```text
Job + identifying JobParameters
        ↓
JobInstance
        ↓ 실행할 때마다
JobExecution
```

### JobInstance

논리적으로 "같은 배치 대상"을 나타낸다.

```text
jobName = dailySettlement
businessDate = 2026-09-05
```

같은 Job 이름과 같은 identifying Parameter 조합이면 같은 JobInstance다.

### JobExecution

그 JobInstance를 실제로 한 번 실행한 기록이다.

```text
같은 JobInstance
├─ JobExecution #1 → FAILED
└─ JobExecution #2 → COMPLETED
```

즉 재시작은 새 JobInstance를 만드는 것이 아니라 **같은 JobInstance에 새로운 JobExecution을 추가하는 것**이다.

## 5. 중복 실행 방지는 어떻게 되는가

같은 Job + 같은 identifying JobParameters 조합이 이미 `COMPLETED` 상태라면 Spring Batch는 같은 JobInstance를 다시 실행하지 않는다.

예:

```text
DailyJob + date=2026-09-05
        ↓
COMPLETED
        ↓
같은 Parameter로 재실행
        ↓
거부
```

매일 다른 업무 대상을 처리한다면 날짜 같은 값을 identifying Parameter로 둔다.

```text
2026-09-05 → JobInstance A
2026-09-06 → JobInstance B
```

반대로 로그용 Timestamp처럼 JobInstance 신원을 바꾸면 안 되는 값은 non-identifying Parameter로 관리할 수 있다.

## 6. 재시작은 무엇을 보고 이어가는가

실패한 JobExecution은 같은 JobInstance로 다시 실행할 수 있다.

```text
JobInstance
├─ Execution #1 FAILED
└─ Execution #2 RESTART
```

Spring Batch는 Step 실행 상태와 `ExecutionContext`를 저장해 이전 실행 정보를 복원한다.

대표적으로 다음 정보가 메타데이터에 남는다.

- Job 실행 상태
- Step 실행 상태
- Read / Write Count
- 마지막 처리 위치를 복원하기 위한 Reader 상태
- 사용자 정의 Context 값

Reader가 Restart를 지원하고 필요한 상태를 `ExecutionContext`에 저장한다면 실패 지점 이후부터 이어갈 수 있다.

중요한 점은 **모든 Reader가 자동으로 임의 지점에서 재개되는 것은 아니라는 것**이다. 재시작 가능성은 ItemReader 구현과 상태 저장 방식에 따라 달라진다.

## 7. Batch Metadata Table은 실행 객체를 저장한다

메타 테이블을 이름으로 외우기보다 실행 객체와 대응시키면 쉽다.

```text
JobInstance
→ BATCH_JOB_INSTANCE

JobExecution
→ BATCH_JOB_EXECUTION
→ BATCH_JOB_EXECUTION_PARAMS
→ BATCH_JOB_EXECUTION_CONTEXT

StepExecution
→ BATCH_STEP_EXECUTION
→ BATCH_STEP_EXECUTION_CONTEXT
```

### BATCH_JOB_INSTANCE

JobInstance의 신원을 저장한다.

### BATCH_JOB_EXECUTION

실제 Job 실행 1회의 상태를 저장한다.

예:

- STARTED
- FAILED
- COMPLETED

### BATCH_JOB_EXECUTION_PARAMS

해당 JobExecution에 전달된 JobParameters를 기록한다.

### BATCH_JOB_EXECUTION_CONTEXT

Job 범위에서 재시작에 필요한 상태를 저장한다.

### BATCH_STEP_EXECUTION

각 Step 실행의 상태와 Read/Write Count 등을 저장한다.

### BATCH_STEP_EXECUTION_CONTEXT

Step 범위의 재시작 상태를 저장한다.

즉 메타 테이블은 별도의 부가 기능이 아니라 **Spring Batch 실행 모델을 영속화한 형태**다.

## 8. 실제 실행 흐름

전체 흐름을 다시 연결하면 다음과 같다.

```text
Scheduler / API
      ↓
JobLauncher.run(job, parameters)
      ↓
JobRepository에서 JobInstance 확인
      ↓
새 JobExecution 생성
      ↓
Step 실행
      ↓
StepExecution 생성
      ↓
Tasklet 또는 Chunk 수행
      ↓
상태 / ExecutionContext 저장
      ↓
다음 Step 또는 Job 종료
```

Chunk Step이면 내부는 다음처럼 반복된다.

```text
ItemReader
   ↓
ItemProcessor
   ↓
ItemWriter
   ↓
Commit
   ↓
ExecutionContext 갱신
   ↓
다음 Chunk
```

## 9. 운영에서 중요한 경계

### JobParameters를 아무 값이나 유니크하게 만들지 않는다

매 실행마다 무조건 현재 Timestamp를 identifying Parameter로 넣으면 모든 실행이 새로운 JobInstance가 되어 **재시작 의미가 사라질 수 있다**.

```text
잘못된 방향
실행마다 random timestamp
→ 항상 새 JobInstance
→ FAILED 실행을 같은 Instance로 재시작하기 어려움
```

업무 대상의 Identity와 단순 실행 정보는 분리한다.

### Chunk Size는 성능과 재처리 범위를 동시에 결정한다

큰 Chunk:

- Commit 횟수 감소
- Throughput에 유리할 수 있음
- 실패 시 다시 처리할 단위가 커짐

작은 Chunk:

- Commit 비용 증가
- 실패 시 재처리 범위가 작음

따라서 Chunk Size는 단순 성능 Parameter가 아니라 **Transaction Boundary**다.

### 완료된 Step의 재실행 정책을 명시한다

기본적으로 이미 완료된 Step은 Restart 시 다시 실행하지 않는다. 필요하면 `allowStartIfComplete(true)` 같은 정책을 별도로 적용한다.

## 정리

Spring Batch의 전체 구조는 두 축으로 보면 된다.

```text
[실행 구조]
Job
 ↓
Step
 ↓
Tasklet / Chunk

[상태 구조]
JobInstance
 ↓
JobExecution
 ↓
StepExecution
 ↓
ExecutionContext
```

그리고 두 축을 연결하는 것이 `JobRepository`다.

이 구조를 잡고 나면 Spring Batch의 핵심 기능도 한 줄로 정리된다.

```text
JobParameters로 실행 대상을 식별하고
→ Execution 상태를 저장하고
→ Commit 단위로 처리하며
→ 실패하면 저장된 상태를 이용해 다시 이어간다
```

그래서 Spring Batch는 단순 Scheduler가 아니라 **재실행 가능한 Batch Execution Framework**다.

## 참고

- [Spring Batch Reference](https://docs.spring.io/spring-batch/reference/)

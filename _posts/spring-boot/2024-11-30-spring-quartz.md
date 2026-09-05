---
title       : "Quartz Scheduler — Job·Trigger·State·Cluster 구조 이해하기"
description : "Quartz를 Job 실행 로직, Trigger 실행 시점, JobStore 상태 보존, Cluster 조율의 네 축으로 나눠 보고 Cron, Misfire, JDBCJobStore, @DisallowConcurrentExecution까지 연결해 이해한다."
date        : 2025-03-06 09:00:45 +0900
updated     : 2026-09-05 21:40:00 +0900
categories  : [spring-boot, "배치·스케줄링"]
tags        : [quartz, scheduler, cron, job]
pin         : false
hidden      : false
---

Quartz를 처음 보면 `Job`, `JobDetail`, `Trigger`, `Scheduler`, `JobStore`가 한꺼번에 등장해 역할이 섞이기 쉽다. 큰 그림은 네 층으로 나누면 단순하다.

```text
무엇을 실행할까?
→ Job / JobDetail

언제 실행할까?
→ Trigger / Cron

실행 상태를 어디에 보존할까?
→ RAMJobStore / JDBCJobStore

여러 Scheduler가 어떻게 한 번만 실행하게 할까?
→ Cluster / Lock
```

즉 Quartz의 본질은 **실행 로직과 실행 시점을 분리하고, 필요하면 그 스케줄 상태를 영속화·공유하는 Scheduler**다.

## 전체 실행 흐름

```text
Job
└─ 실제 실행 코드

JobDetail
└─ Job의 식별자·설정·JobDataMap

Trigger
└─ 언제 Job을 fire할지 결정

Scheduler
└─ JobDetail + Trigger 등록·실행 관리

JobStore
└─ Job·Trigger·실행 상태 저장
```

실행 시점에는 다음처럼 이어진다.

```text
Trigger fire 시각 도달
        ↓
Scheduler가 실행 가능 여부 판단
        ↓
JobDetail에서 Job 정보 조회
        ↓
Job 인스턴스 실행
        ↓
실행 상태 갱신
```

## 1. Job과 Trigger를 분리해서 본다

`Job`은 **무엇을 할지**, `Trigger`는 **언제 할지**를 담당한다.

```java
public class QueryJob implements Job {
    @Override
    public void execute(JobExecutionContext context)
            throws JobExecutionException {
        String query = context.getMergedJobDataMap().getString("query");
        System.out.println("Executing query: " + query);
    }
}
```

`JobDetail`은 Job Class 자체가 아니라 Quartz가 관리할 실행 정의다.

```java
JobDetail jobDetail = JobBuilder.newJob(QueryJob.class)
    .withIdentity("myJob", "group1")
    .usingJobData("query", "SELECT * FROM users")
    .build();
```

`Trigger`는 이 Job이 fire될 시간을 정의한다.

```java
Trigger trigger = TriggerBuilder.newTrigger()
    .forJob(jobDetail)
    .withIdentity("myTrigger", "group1")
    .withSchedule(
        CronScheduleBuilder.cronSchedule("0 0/5 * * * ?")
    )
    .build();
```

마지막으로 Scheduler가 둘을 등록한다.

```java
Scheduler scheduler = new StdSchedulerFactory().getScheduler();
scheduler.start();
scheduler.scheduleJob(jobDetail, trigger);
```

한 Job에 여러 Trigger를 연결할 수 있으므로 실행 로직을 복제하지 않고 "평일 오전 9시"와 "월말 23시"처럼 여러 스케줄을 붙일 수 있다.

```text
Job A
├─ Trigger 1
├─ Trigger 2
└─ Trigger 3
```

## 2. Job을 멈추는 것과 Trigger를 멈추는 것은 다르다

Quartz 운영에서 중요한 경계다.

| 제어 대상 | 의미 |
|---|---|
| Trigger Pause | 특정 실행 시점만 멈춤 |
| Job Pause | 해당 Job에 연결된 Trigger 전체 실행을 멈춤 |
| Trigger Delete | 특정 스케줄 정의 제거 |
| Job Delete | Job 정의와 연결 Trigger 제거 |

따라서 "오전 배치만 잠시 막고 저녁 배치는 살린다"면 Trigger 단위 제어가 맞고, 해당 업무 전체를 중지하려면 Job 단위 제어가 맞다.

## 3. RAMJobStore와 JDBCJobStore — 상태를 어디에 둘까

Quartz는 Job과 Trigger 상태를 어디에 저장할지 선택할 수 있다.

```text
RAMJobStore
→ Memory
→ 프로세스 종료 시 상태 소실
→ 단일 인스턴스·개발 환경

JDBCJobStore
→ Database
→ 재시작 후에도 상태 유지
→ 운영·Cluster
```

### RAMJobStore

- 설정이 단순하고 빠르다.
- Scheduler가 재시작되면 Job·Trigger 등록 상태가 사라진다.
- 여러 노드가 상태를 공유할 수 없다.

### JDBCJobStore

- Job·Trigger·실행 상태를 DB에 저장한다.
- 재시작 후 스케줄을 이어갈 수 있다.
- 여러 Scheduler 인스턴스가 같은 DB를 보며 Cluster를 구성할 수 있다.

즉 Cluster가 필요하면 JDBCJobStore가 전제다.

## 4. 여러 노드에서는 누가 실행할지 조율해야 한다

Application을 두 대 띄우고 두 인스턴스 모두 Quartz Scheduler를 실행하면, 아무 조율이 없을 경우 같은 스케줄을 두 노드가 각각 실행할 수 있다.

Quartz Cluster는 공유 JDBCJobStore를 사용해 **특정 Trigger를 어느 한 Scheduler만 획득하도록 조율**한다.

```text
Node A ─┐
        ├─ Shared Quartz DB
Node B ─┘
          ↓
     Trigger 획득 경쟁
          ↓
      한 노드만 실행
```

대표 설정은 다음과 같다.

```properties
org.quartz.jobStore.isClustered=true
org.quartz.scheduler.instanceId=AUTO
org.quartz.jobStore.clusterCheckinInterval=15000
```

핵심은 다음 세 가지다.

- 모든 노드가 **같은 Quartz DB**를 본다.
- `instanceId`는 노드마다 고유해야 한다.
- 시스템 시계가 크게 어긋나지 않도록 NTP 등으로 맞춘다.

Quartz는 `QRTZ_LOCKS`, Trigger 상태, Scheduler Check-in 정보를 이용해 실행권을 조율한다.

## 5. 중복 실행 방지와 Cluster는 같은 문제가 아니다

Cluster는 한 Trigger Fire를 여러 노드가 동시에 가져가지 않도록 조율한다. 하지만 **같은 Job의 이전 실행이 아직 끝나지 않았는데 다음 Trigger가 fire되는 문제**는 별도다.

예를 들어 5분마다 실행되는 Job이 10분 걸리면:

```text
10:00 실행 시작
10:05 다음 Trigger 도착
10:10 또 다음 Trigger 도착
```

이때 같은 `JobDetail`의 동시 실행을 막고 싶다면 Job Class에 `@DisallowConcurrentExecution`을 사용할 수 있다.

```java
@DisallowConcurrentExecution
public class SettlementJob implements Job {
    // ...
}
```

```text
Cluster
→ 여러 Scheduler 중 누가 Trigger를 실행할지

@DisallowConcurrentExecution
→ 같은 JobDetail 실행끼리 겹쳐도 되는지
```

둘은 다른 축이다.

## 6. Misfire — 실행 시각을 놓쳤을 때 무엇을 할까

Trigger가 예정 시각에 실행되지 못할 수 있다.

원인은 다양하다.

- 서버가 내려가 있었음
- Scheduler Thread Pool이 포화됨
- DB 응답이 늦음
- 이전 Job이 길게 실행 중
- `@DisallowConcurrentExecution`으로 다음 실행이 대기함

Quartz는 일정 임계시간 이상 늦어진 Trigger를 Misfire로 판단하고, **놓친 실행을 어떻게 처리할지 정책**을 적용한다.

Cron Trigger에서 자주 쓰는 선택은 다음과 같다.

| 정책 | 동작 |
|---|---|
| FireAndProceed | 놓친 실행을 1회 즉시 수행 후 정상 스케줄 복귀 |
| DoNothing | 놓친 실행은 버리고 다음 정상 시각 대기 |
| IgnoreMisfires | 가능한 놓친 실행을 따라잡도록 처리 |

```java
CronScheduleBuilder.cronSchedule("0 0/5 * * * ?")
    .withMisfireHandlingInstructionFireAndProceed();
```

어떤 정책을 택할지는 업무 의미로 결정한다.

```text
정산·회계 집계
→ 놓친 실행을 반드시 채워야 하나?

알림·주기적 Polling
→ 과거 실행을 몰아서 해도 의미가 있나?
```

즉 Misfire는 기술 설정이 아니라 **놓친 시간을 업무적으로 어떻게 해석할지**의 문제다.

## 7. Quartz DB 테이블은 네 그룹으로 보면 된다

JDBCJobStore의 표준 테이블을 이름 그대로 외울 필요는 없다. 역할별로 묶으면 이해하기 쉽다.

### Job 정의

- `QRTZ_JOB_DETAILS`

### Trigger 정의

- `QRTZ_TRIGGERS`
- `QRTZ_CRON_TRIGGERS`
- `QRTZ_SIMPLE_TRIGGERS`
- `QRTZ_SIMPROP_TRIGGERS`
- `QRTZ_BLOB_TRIGGERS`
- `QRTZ_CALENDARS`

### 실행 상태

- `QRTZ_FIRED_TRIGGERS`
- `QRTZ_PAUSED_TRIGGER_GRPS`

### Cluster 조율

- `QRTZ_SCHEDULER_STATE`
- `QRTZ_LOCKS`

이렇게 보면 DB Schema가 Quartz 내부 구조를 그대로 반영한다.

```text
Job / Trigger 정의
        ↓
실행 상태
        ↓
Cluster Coordination
```

## 8. Trigger State는 내부 실행 상태다

Quartz API에서 Trigger 상태를 조회하면 `NORMAL`, `PAUSED`, `BLOCKED`, `COMPLETE`, `ERROR`, `NONE` 같은 상태를 볼 수 있다.

특히 `BLOCKED`는 `@DisallowConcurrentExecution`이 걸린 Job의 다른 실행이 진행 중이라 기다리는 상황에서 나타날 수 있다.

```text
NORMAL
→ 실행 가능

PAUSED
→ 운영자가 일시 중지

BLOCKED
→ 동시 실행 제한 때문에 대기

COMPLETE
→ 더 이상 Fire Time이 없음

ERROR
→ Trigger 처리 오류
```

이 상태는 업무 Job 자체의 성공/실패 상태와 동일한 개념은 아니다. **Scheduler가 Trigger를 현재 어떻게 다루고 있는지**를 나타낸다.

## Quartz와 Spring Batch의 경계

둘은 자주 같이 언급되지만 역할이 다르다.

```text
Quartz
→ 언제 실행할까?
→ Scheduler

Spring Batch
→ 대량 작업을 어떻게 단계·상태·재시작 단위로 처리할까?
→ Batch Processing Framework
```

따라서 복잡한 대량 정산 Job은 Spring Batch로 구현하고, 실행 시점은 Quartz가 Trigger하는 조합도 가능하다.

반대로 단순히 "5분마다 API 호출" 정도라면 Spring Batch 없이 Quartz나 Spring Scheduling만으로 충분할 수 있다.

## 정리

Quartz를 구성요소 이름으로 외우지 말고 네 질문으로 보면 된다.

```text
무엇을 실행?
→ Job / JobDetail

언제 실행?
→ Trigger

상태를 어디에 보존?
→ JobStore

여러 노드는 어떻게 조율?
→ JDBCJobStore + Cluster
```

그 위에 운영 정책이 얹힌다.

```text
실행이 겹쳐도 되나?
→ @DisallowConcurrentExecution

놓친 실행을 어떻게 할까?
→ Misfire Policy

특정 스케줄만 멈출까?
→ Trigger 제어
```

이 구조를 잡으면 Quartz의 Cron, DB Schema, Cluster 설정은 서로 떨어진 기능이 아니라 하나의 Scheduler 상태 모델로 연결된다.

---
title       : Spring Quartz
description : "JobDetail·Trigger·Scheduler를 Cron으로 묶는 기본 사용법과, Job 정지 vs Trigger 정지의 차이, JDBCJobStore와 RAMJobStore 선택 기준."
date        : 2025-03-06 09:00:45 +0900
updated     : 2025-03-06 09:01:11 +0900
categories  : [spring-boot, "배치·스케줄링"]
tags        : [quartz, scheduler, cron, job]
pin         : false
hidden      : false
---

Quartz Scheduler는 유연하고 확장 가능한 Job 스케줄링을 위한 라이브러리로, Java 기반의 오픈소스 라이브러리이다. 
Job과 Trigger를 등록하고 실행하는 기능을 제공하며, Job이 실행되는 시점을 Cron 표현식을 통해 정의할 수 있다.

## 구성요소
- Scheduler: Job과 Trigger를 등록하고 작업을 실행하는 주체
- JobDetail: Job을 실행하기 위한 정보를 가지고 있는 객체
- Trigger: Job 실행 조건 및 시점을 정의하는 객체
- Job: 작업의 실제 실행 로직. Job 인터페이스를 구현하여 작성
- JobDataMap: JobDetail과 Trigger에 데이터를 전달하기 위한 객체

## 사용 방법
1. Job 정의: Job 인터페이스를 구현하여 Job을 정의
2. JobDetail 생성: Job을 실행하기 위한 정보를 가지고 있는 JobDetail 객체 생성
3. Trigger 생성: Job을 실행할 시점을 정의하는 Trigger 객체 생성
4. Scheduler에 등록: JobDetail과 Trigger를 Scheduler에 등록

```java
 // 1. Job 정의
public class QueryJob implements Job {
  @Override
  public void execute(JobExecutionContext context) throws JobExecutionException {
    String query = context.getMergedJobDataMap().getString("query");
    System.out.println("Executing query: " + query);
    // 여기에 쿼리 실행 로직 추가
  }
}

// 2. JobDetail 생성
JobDetail jobDetail = JobBuilder.newJob(QueryJob.class)
  .withIdentity("myJob", "group1")
  .usingJobData("query", "SELECT * FROM users")
  .build();

// 3. Trigger 생성
Trigger trigger = TriggerBuilder.newTrigger()
  .forJob(jobDetail)
  .withIdentity("myTrigger", "group1")
  .withSchedule(CronScheduleBuilder.cronSchedule("0 0/5 * * * ?"))
  .build();

 // 4. Scheduler 등록
SchedulerFactory schedulerFactory = new StdSchedulerFactory();
Scheduler scheduler = schedulerFactory.getScheduler();
scheduler.start();
scheduler.scheduleJob(jobDetail, trigger);
```


## Job과 Trigger 관계
- Job과 Trigger는 1:1 또는 1:N 관계로 연결 가능 (하나의 Job에 여러 Trigger를 연결할 수 있으나, 하나의 Trigger는 하나의 Job에만 연결 가능)
- Job이 삭제 될 때 Trigger도 함께 삭제됨
 

## Job 정지 vs Trigger 정지

| 구분 | Job 정지 | Trigger 정지 |
|---|---|---|
| 대상 | Job 자체 | 특정 Trigger |
| 영향 범위 | Job과 연결된 모든 Trigger가 멈춤 | 선택한 Trigger만 멈춤 |
| Job 상태 | Job은 여전히 등록되어 있지만 실행되지 않음 | Job은 활성 상태로 유지되며 다른 Trigger에 의해 실행될 수 있음 |
| 제어 수준 | Job 단위의 전역적인 제어 가능 | Trigger 단위로 세밀한 제어 가능 |
| 사용 사례 | Job 전체를 멈추거나 모든 트리거를 한꺼번에 멈추고 싶을 때 | 특정 Trigger만 멈추고 나머지는 동작하도록 유지하고 싶을 때 |


## JDBCJobStore vs RAMJobStore
- JDBCJobStore: Job, Trigger, JobDataMap 등의 정보를 DB에 저장
- RAMJobStore: Job, Trigger, JobDataMap 등의 정보를 메모리에 저장
- JDBCJobStore는 Quartz Scheduler가 종료되어도 정보가 유지되지만, RAMJobStore는 종료 시 정보가 사라짐
- JDBCJobStore는 Quartz Scheduler를 여러 대의 서버에서 공유할 때 사용

## 클러스터링 — 스케줄러를 여러 대에 띄울 때

인스턴스를 2대 이상 띄우면 **같은 Job이 양쪽에서 동시에 실행**되는 문제가 생긴다. 클러스터링은 이걸 막고, 한 노드가 죽어도 다른 노드가 이어받게(fail-over) 한다. 전제는 **JDBCJobStore(공유 DB)** — RAMJobStore로는 불가능하다.

```properties
org.quartz.jobStore.isClustered=true
org.quartz.scheduler.instanceId=AUTO          # 노드마다 고유 ID 자동 부여
org.quartz.jobStore.clusterCheckinInterval=15000
```

- 조율은 애플리케이션이 아니라 **DB의 `qrtz_locks` 행 락**으로 이뤄진다. 트리거를 획득할 때 노드들이 이 락을 놓고 경쟁해, 한 번의 실행은 한 노드만 가져간다.
- `instanceId`는 **노드마다 반드시 달라야** 한다. `AUTO`가 호스트명+타임스탬프로 생성해주니 직접 지정하지 않는다. 같은 ID를 두 노드에 주면 서로를 죽은 노드로 오인한다.
- 모든 노드의 **시계(NTP)를 맞춰야** 한다. clock skew가 크면 checkin·트리거 시점 판정이 어긋난다.
- Job이 **한 노드에서만 돌면 충분**할 때(중복 실행 절대 금지)는 `@DisallowConcurrentExecution`을 함께 건다.

## Misfire — 놓친 실행 처리

스케줄된 시각에 트리거를 못 쏜 경우(=misfire)를 어떻게 만회할지의 정책이다. **misfire는 생각보다 자주 난다** — 서버 다운타임, 스레드 풀 고갈, DB 지연, `@DisallowConcurrentExecution`으로 이전 실행이 안 끝난 경우 등. `org.quartz.jobStore.misfireThreshold`(기본 60초)를 넘겨 지각하면 misfire로 판정된다.

정책을 지정하지 않으면 기본값은 **smart policy**인데, 트리거 종류에 따라 동작이 갈려 헷갈린다. Cron 트리거의 대표 선택지:

| 정책 | 동작 |
|---|---|
| `withMisfireHandlingInstructionFireAndProceed` | 놓친 것 중 **1회만 즉시 실행**하고 이후 정상 스케줄 복귀 (기본, 대개 이걸 원함) |
| `withMisfireHandlingInstructionDoNothing` | 놓친 건 **버리고** 다음 정상 시각을 기다림 |
| `withMisfireHandlingInstructionIgnoreMisfires` | 놓친 모든 실행을 **몰아서 실행**(catch-up) |

```java
CronScheduleBuilder.cronSchedule("0 0/5 * * * ?")
    .withMisfireHandlingInstructionFireAndProceed();
```

> 흔한 오해: "5분마다"인데 서버가 1시간 죽었다 살아나면, 기본 정책은 밀린 12번을 다 돌리지 **않는다.** 밀린 실행을 반드시 채워야 하는 정산·집계라면 `Ignore`를, 중복이 해로우면 `DoNothing`을 명시적으로 골라야 한다.

## Quartz Database Schema

Quartz 2.x의 표준 스키마는 **11개 테이블**이다(접두어 `QRTZ_`는 `org.quartz.jobStore.tablePrefix`로 변경 가능). 배포판 `docs/dbTables`의 `tables_*.sql`에 DB별 DDL이 있다. (Quartz 1.x의 리스너 테이블·`qrtz_job_trigger_rel` 등은 2.x에 존재하지 않는다.)

| Table Name | Description |
|------------|-------------|
| qrtz_job_details | JobDetail 정보를 저장 |
| qrtz_triggers | Trigger 정보(Job 연결·상태 포함)를 저장 |
| qrtz_cron_triggers | Cron Trigger의 표현식을 저장 |
| qrtz_simple_triggers | Simple Trigger(반복 횟수·간격)를 저장 |
| qrtz_simprop_triggers | CalendarInterval 등 프로퍼티 기반 Trigger를 저장 |
| qrtz_blob_triggers | 커스텀 Trigger를 직렬화(Blob)해 저장 |
| qrtz_calendars | 실행 제외일 등 Calendar 객체를 직렬화해 저장 |
| qrtz_paused_trigger_grps | Pause된 Trigger 그룹을 저장 |
| qrtz_fired_triggers | 현재 실행(fire) 중인 Trigger의 상태를 저장 |
| qrtz_scheduler_state | 클러스터 노드별 인스턴스 상태(heartbeat)를 저장 |
| qrtz_locks | 클러스터 동시성 제어용 비관적 락 행 |


## Quartz Trigger State

| Trigger State | Description |
|--------------|-------------|
| Normal | Trigger가 실행될 준비가 되어 있으며, 스케줄에 따라 실행됨 |
| Paused | Trigger가 일시 중지되어 있으며, 실행되지 않음 |
| Complete | Trigger가 더 이상 실행되지 않으며, 실행할 "fire times"가 없음 |
| Error | Trigger가 오류가 발생하여 더 이상 실행되지 않음 |
| Blocked | Trigger가 @DisallowConcurrentExecution이 설정된 Job과 연결되어 있어 대기 중인 상태 |
| None | Trigger가 존재하지 않음 |
| Waiting | Trigger가 대기 중인 상태로, Job이 실행될 준비가 되어 있음 |



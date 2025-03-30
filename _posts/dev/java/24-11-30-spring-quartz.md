---
title       : Spring Quartz
description : >-
  Spring Quartz 에 관한 내용을 정리한 문서입니다.
date        : 2025-03-06 09:00:45 +0900
updated     : 2025-03-06 09:01:11 +0900
categories  : [dev, java]
tags        : [spring, quartz]
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

## Quartz Database Schema

| Table Name | Description |
|------------|-------------|
| qrtz_calendars | 쿼츠에서 사용하는 비표준 캘린더 정보를 저장 |
| qrtz_job_details | JobDetail 정보를 저장 |
| qrtz_locks | 쿼츠에서 사용하는 Lock 정보를 저장 |
| qrtz_scheduler_state | Scheduler 상태 정보를 저장 |
| qrtz_triggers | Trigger 정보를 저장 |
| qrtz_cron_triggers | Cron Trigger 정보를 저장 |
| qrtz_fired_triggers | 현재 실행 중인 Trigger 정보를 저장 |
| qrtz_blob_triggers | Blob Trigger 정보를 저장 |
| qrtz_simple_triggers | Simple Trigger 정보를 저장 |
| qrtz_simprop_triggers | 사용자 정의 Trigger 정보를 저장 |
| qrtz_paused_trigger_grps | Trigger 그룹의 Pause 상태 정보를 저장 |
| qrtz_job_listeners | Job Listener 정보를 저장 |
| qrtz_trigger_listeners | Trigger Listener 정보를 저장 |
| qrtz_scheduler_listeners | Scheduler Listener 정보를 저장 |
| qrtz_job_trigger_rel | Job과 Trigger의 관계를 저장 |
| qrtz_job_trigger_state | Job과 Trigger의 상태 정보를 저장 |


## Quartz Trigger State

| Trigger State | Description |
|--------------|-------------|
| Normal | Trigger가 실행될 준비가 되어 있으며, 스케줄에 따라 실행됨 |
| Paused | Trigger가 일시 중지되어 있으며, 실행되지 않음 |
| Complete | Trigger가 더 이상 실행되지 않으며, 실행할 "fire times"가 없음 |
| Error | Trigger가 오류가 발생하여 더 이상 실행되지 않음 |
| Blocked | Trigger가 DisallowConcurrentExecutionAttribute가 설정된 Job과 연결되어 있어 대기 중인 상태 |
| None | Trigger가 존재하지 않음 |
| Waiting | Trigger가 대기 중인 상태로, Job이 실행될 준비가 되어 있음 |
| Error | Trigger가 오류가 발생하여 더 이상 실행되지 않음 |



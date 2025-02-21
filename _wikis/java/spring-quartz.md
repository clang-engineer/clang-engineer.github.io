---
layout  : wiki
title   : Spring Quartz
summary : 
date    : 2024-11-30 14:04:18 +0900
updated : 2024-11-30 14:04:18 +0900
tags    : 
toc     : true
public  : true
parent  : [[java/index]]
latex   : false
---
* TOC
{:toc}

# Quartz Scheduler
- 유연하고 확장 가능한 Job 스케줄링을 위한 라이브러리

# Quartz의 주요 구성요소
- Scheduler: Job과 Trigger를 등록하고 작업을 실행하는 주체
- JobDetail: Job을 실행하기 위한 정보를 가지고 있는 객체
- Trigger: Job 실행 조건 및 시점을 정의하는 객체
- Job: 작업의 실제 실행 로직. Job 인터페이스를 구현하여 작성
- JobDataMap: JobDetail과 Trigger에 데이터를 전달하기 위한 객체

# Quartz의 사용 흐름
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


# Job과 Trigger 관계
- Job과 Trigger는 1:1 또는 1:N 관계로 연결 가능
- Job과 Trigger를 1:N 관계로 연결하여 Job을 여러 번 실행하는 방식을 사용할 수 있음
- Job이 실행될 때마다 Trigger가 실행되는 것이 아니라, Trigger의 조건에 따라 Job이 실행됨
- Job이 삭제 될 때 Trigger도 함께 삭제됨
 

# Job 정지 vs Trigger 정지

| 구분 | Job 정지 | Trigger 정지 |
|---|---|---|
| 대상 | Job 자체 | 특정 Trigger |
| 영향 범위 | Job과 연결된 모든 Trigger가 멈춤 | 선택한 Trigger만 멈춤 |
| Job 상태 | Job은 여전히 등록되어 있지만 실행되지 않음 | Job은 활성 상태로 유지되며 다른 Trigger에 의해 실행될 수 있음 |
| 제어 수준 | Job 단위의 전역적인 제어 가능 | Trigger 단위로 세밀한 제어 가능 |
| 사용 사례 | Job 전체를 멈추거나 모든 트리거를 한꺼번에 멈추고 싶을 때 | 특정 Trigger만 멈추고 나머지는 동작하도록 유지하고 싶을 때 |


# JDBCJobStore vs RAMJobStore
- JDBCJobStore: Job, Trigger, JobDataMap 등의 정보를 DB에 저장
- RAMJobStore: Job, Trigger, JobDataMap 등의 정보를 메모리에 저장
- JDBCJobStore는 Quartz Scheduler가 종료되어도 정보가 유지되지만, RAMJobStore는 종료 시 정보가 사라짐
- JDBCJobStore는 Quartz Scheduler를 여러 대의 서버에서 공유할 때 사용
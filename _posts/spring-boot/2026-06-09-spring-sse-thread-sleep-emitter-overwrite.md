---
title       : "Spring SSE 성능 문제 — Thread.sleep과 emitter 덮어쓰기"
description : "실시간 진행률 SSE에서 이벤트 누락/지연을 일으키는 두 흔한 실수와 해결."
date        : 2026-06-09 10:00:00 +0900
updated     : 2026-06-09 10:00:00 +0900
categories  : [spring-boot, "SSE·비동기"]
tags        : [concurrency, debugging]
pin         : false
hidden      : false
---

Spring Boot의 `SseEmitter` 기반 실시간 진행률 전송에서 이벤트 누락/지연을 일으키는 두 가지 흔한 실수.

## 1. sendData마다 Thread.sleep

```java
// BAD - 매 전송마다 200ms 블로킹, 100회 호출이면 20초 추가 지연
emitter.send(event);
Thread.sleep(200);

// GOOD - sleep 제거, InterruptedException catch도 불필요
emitter.send(event);
```

Worker 스레드에서 SSE를 보내는 구조라면 sleep이 전체 작업(비식별화, 엑셀 생성 등)을 직접 지연시킨다.

## 2. 재구독 시 기존 emitter 덮어쓰기

```java
// BAD - 같은 키로 subscribe하면 기존 emitter 제거 → 진행 중인 이벤트 영구 누락
Map<String, SseEmitter> emitterMap;

// GOOD - Set으로 변경하여 같은 키에 여러 emitter 브로드캐스트
Map<String, Set<SseEmitter>> emitterMap;
```

마이페이지 팝업을 열거나 페이지 새로고침 시 `subscribe()` 재호출 → 기존 다운로드의 emitter가 제거되어 프론트가 이벤트를 영원히 못 받는 문제. `Set<SseEmitter>`로 바꾸고 개별 emitter의 `onCompletion/onError`에서 해당 emitter만 제거하면 해결.

## 디버깅 팁

SSE 느림의 원인을 찾을 때는 다운로드 흐름의 각 단계에 `System.currentTimeMillis()` 기반 로그를 넣고 `[download]` 같은 공통 태그로 grep하면 병목을 빠르게 찾을 수 있다. `log.info` 레벨 사용 — logback의 root level이 `INFO`인 환경에서 `log.debug`는 안 찍힌다.

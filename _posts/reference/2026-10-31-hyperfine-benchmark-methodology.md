---
layout: post
title: "hyperfine — 반복 벤치마크의 설계와 해석"
date: 2026-10-31
categories: [reference]
tags: [cli, benchmark, performance, hyperfine]
---

`time`은 한 번의 실행 시간을 측정하지만 `hyperfine`은 여러 번 실행해 **실행 시간의 분포와 명령 간 비교**를 보여준다. 명령 옵션보다 중요한 것은 비교 조건의 동등성이다.

## 측정 모델

```text
비교할 명령 A / B
        │
        ├─ 입력·결과 동등성 확인
        ├─ --prepare : 매 실행 전 준비
        ├─ --warmup  : 워밍업
        └─ --runs    : 반복 측정
                  │
            시간 분포 수집
                  │
         평균·표준편차·범위 비교
```

## 대표 실행

```sh
hyperfine --warmup 3 --runs 20 'rg TODO src/'
hyperfine --warmup 3 'grep -R TODO src/' 'rg TODO src/'
hyperfine --export-json result.json 'rg TODO src/'
```

두 번째 예시는 **성능을 공정하게 비교한다는 보장은 없다**. `grep`과 `rg`는 숨김 파일·ignore 규칙·바이너리 처리 기본값이 달라 읽는 파일 집합부터 다를 수 있다. 먼저 동일한 대상·동일한 결과를 만드는지 확인해야 한다.

`--prepare`는 각 측정 실행 전 준비 명령을 수행할 수 있지만 CPU 부하·파일 시스템 캐시·디스크 상태를 모두 동일하게 만드는 것은 아니다. 출력량과 프로세스 시작 비용도 측정 결과에 영향을 준다. 작은 평균 차이만 보고 우위를 단정하지 말고 분산과 반복성을 함께 본다.

전체 옵션은 [hyperfine 공식 저장소](https://github.com/sharkdp/hyperfine)를 참고한다.

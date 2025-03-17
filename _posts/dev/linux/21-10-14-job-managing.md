---
title       : Linux 프로세스 잡 관리
description : >-
    프로세스를 관리하는 job과 관련된 내용을 기록합니다.
date        : 2024-06-09 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [linux, job]
pin         : false
hidden      : false
---

## job
- job은 shell에서 실행한 process를 의미한다. shell은 내부적으로 job table로 해당 process 정보를 유지한다.
- job은 foreground job과 background job으로 나뉜다.

| 종류 | 설명 |
|---|---|
| foreground job | 현재 shell에서 실행되는 job |
| background job | 현재 shell에서 실행되지만, 현재 shell을 block하지 않고 실행되는 job |

jobs 명령어로 현재 shell에서 실행되는 job을 확인할 수 있다. (job number, 상태, command를 보여준다.)

```bash
$ sleep 1000 &
$ jobs
[1]+  Running sleep 1000
```

## 관련 명령어

| 명령어 | 설명 |
|---|---|
| ctrl + z | foreground 작업을 일시 중지시키고 background로 보냄 |
| jobs | 현재 shell에서 실행되는 job을 보여줌 |
| jobs -l | job number, 상태, PID, command를 보여줌 |
| fg %n | 일시 중지된 n번 job을 foreground로 가져옴 |
| bg %n | 일시 중지된 n번 job을 background job으로 재개 |
| kill %n | n번 job을 종료 **(주의: %이 빠지면 PID가 n인 프로세스를 강제 종료하므로 주의)** |

```bash
$ sleep 1000 &  # background job으로 실행
$ jobs
[1]+  Running sleep 1000
$ sleep 1000
$ ctrl + z # foreground job을 일시 중지시키고 background로 보냄
[2]+ Suspended sleep 1000
$ jobs
[1]-  Running sleep 1000
[2]+  Suspended sleep 1000

$ bg %2 # 일시 중지된 2번 job을 background job으로 재개
[2]+ Continued sleep 1000

$ jobs
[1]+  Running sleep 1000
[2]-  Running sleep 1000

$ fg %1 # 1번 job을 foreground로 가져옴
[1]- Running sleep 1000
```

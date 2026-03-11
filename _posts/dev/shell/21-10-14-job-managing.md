---
title       : Linux 프로세스 잡 관리
description : >-
    프로세스를 관리하는 job과 관련된 내용을 기록합니다.
date        : 2024-06-09 22:50:30 +0900
updated     : 2025-10-03 14:20:18 +0900
categories  : [dev, shell]
tags        : [linux, job]
pin         : false
hidden      : false
---

# Shell Job 관리

`job`은 **shell에서 실행되는 프로세스**를 의미하며, shell은 내부적으로 **job table**로 해당 프로세스 정보를 관리합니다.

* **Foreground job** : 현재 shell에서 실행되는 작업
* **Background job** : 현재 shell에서 실행되지만, shell을 block하지 않고 백그라운드에서 실행되는 작업

---

## 1. Job 확인

* `jobs` 명령어로 현재 shell에서 실행 중인 job 확인 가능

```bash
$ sleep 1000 &
$ jobs
[1]+  Running sleep 1000
```

---

## 2. Job 종류

| 종류             | 설명                         |
| -------------- | -------------------------- |
| Foreground job | 현재 shell에서 실행되는 job        |
| Background job | shell을 block하지 않고 실행되는 job |

---

## 3. 주요 명령어

| 명령어        | 설명                                         |
| ---------- | ------------------------------------------ |
| `ctrl + z` | foreground job을 일시 중지하고 background로 보냄     |
| `jobs`     | 현재 shell에서 실행되는 job 확인                     |
| `jobs -l`  | job number, 상태, PID, command 확인            |
| `fg %n`    | 일시 중지된 n번 job을 foreground로 가져옴             |
| `bg %n`    | 일시 중지된 n번 job을 background로 재개              |
| `kill %n`  | n번 job 종료 (**주의:** % 없으면 PID가 n인 프로세스를 종료) |

---

## 4. 예제

```bash
$ sleep 1000 &   # background job 실행
$ jobs
[1]+  Running sleep 1000

$ sleep 1000     # foreground job 실행
$ ctrl + z       # 일시 중지 후 background로 이동
[2]+ Suspended sleep 1000

$ jobs
[1]-  Running sleep 1000
[2]+  Suspended sleep 1000

$ bg %2          # 2번 job을 background로 재개
[2]+ Continued sleep 1000

$ jobs
[1]+  Running sleep 1000
[2]-  Running sleep 1000

$ fg %1          # 1번 job을 foreground로 가져오기
[1]- Running sleep 1000
```


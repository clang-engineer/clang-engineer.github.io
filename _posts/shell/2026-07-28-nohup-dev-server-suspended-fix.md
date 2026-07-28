---
title       : "nohup로 띄운 dev 서버가 멈춘 것처럼 보이는 이유와 복구"
description : "`ps`에 찍히는데 접속이 안 되는 백그라운드 프로세스의 원인. nohup은 SIGHUP만 무시하고 stdin이 남아 있으면 SIGTTIN/SIGTTOU로 정지될 수 있다."
date        : 2026-07-28 21:45:00 +0900
updated     : 2026-07-28 21:45:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [nohup, process, job-control, signal, vite]
pin         : false
hidden      : false
---

`nohup npm run dev &`로 띄웠는데 브라우저가 안 열리고, `curl localhost:9000`도 실패하는데 `ps`에는 프로세스가 보이는 경우가 있다.

원인은 보통 `nohup`의 핵심 오해다. **nohup은 터미널 종료 시 `SIGHUP`을 무시**하게 해 주지만, 백그라운드에서 여전히 터미널 입출력 경로를 건드리면 정지 신호를 받을 수 있다.

## 한 줄 결론

- `ps`에서 프로세스가 보여도 `state`가 `T`이면 **종료가 아니라 정지(stopped)** 상태다.
- `nohup`만으로는 `SIGHUP`만 막고 `stdin`은 그대로라,
  백그라운드 프로세스가 tty(terminal input/output) 접근하면 `SIGTTIN`/`SIGTTOU`로 멈춘다.
- `</dev/null`로 stdin을 비워서 띄우면 이런 정지를 예방할 수 있다.

## 바로 점검하는 명령

```bash
ps -o pid,state,command | rg "npm run dev|node .*vite"
lsof -nP -iTCP:9000 -sTCP:LISTEN
```

정상 동작이면 9000 포트 LISTEN이 생겨야 하고, 상태가 `T`가 아닌 동작 상태(`R`, `S`, `SN` 등)여야 한다.

## 안정 실행 템플릿

```bash
nohup npm run dev -- --host 0.0.0.0 --port 9000 \
  </dev/null \
  >/tmp/rexnova-dev.log 2>&1 &

tail -F /tmp/rexnova-dev.log
```

`tail -F`는 로그 파일이 나중에 생겨도 계속 추적하고 로그 로테이션에도 붙는다.

## 왜 이런 일이 생기나 (원리)

- `nohup`(hang up의 약자): 터미널 끊김 신호를 무시하도록 설정하는 유틸리티.
- `SIGTTIN`: 백그라운드 프로세스가 표준 입력을 tty에서 읽으려 할 때 보내는 정지 신호.
- `SIGTTOU`: 백그라운드 프로세스가 터미널 출력/제어 작업을 시도할 때 보내는 정지 신호.

`SIGHUP` 차단만으로는 입출력 시그널까지는 막지 못해서, 일부 환경에서는 개발 서버가 겉보기엔 살아 있어도 실질적으로 멈춰 있다.

## 실전 팁

`vite`는 실행 시점에 로그를 터미널과 상호작용할 수 있는 코드 경로가 있어, 특히 macOS에서 `nohup`만으로 띄운 뒤 상태가 `T`가 된 사례를 자주 본다.
이럴 때는 먼저 `kill`로 정리하고, 위 명령으로 다시 띄우는 걸 추천한다.

```bash
pkill -f "vite"
rm -f /tmp/rexnova-dev.log
nohup npm run dev -- --host 0.0.0.0 --port 9000 </dev/null >/tmp/rexnova-dev.log 2>&1 &
```

관련 글: [셸 백그라운드 잡: &, nohup, disown, tmux의 차이](/posts/shell/2026-06-16-background-jobs-and-session/),
[프로세스 찾고 종료하기: pgrep, pkill, pidof, lsof, kill](/posts/linux/2026-06-16-process-find-and-kill/).

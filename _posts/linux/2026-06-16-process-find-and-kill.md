---
title       : "프로세스 찾고 종료하기: pgrep, pkill, pidof, lsof, kill"
description : "ps aux | grep 대신 쓰는 표준 도구들 — 이름·포트·시그널로 프로세스를 정확히 다루는 법"
date        : 2026-06-16 14:00:00 +0900
updated     : 2026-06-16 14:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [linux, process, pgrep, pkill, lsof]
pin         : false
hidden      : false
---

서버가 떠 있는지, 어떤 프로세스가 포트를 잡고 있는지, 좀비처럼 남은 잡을 어떻게 죽이는지 — 매일 마주치는 질문입니다. 대부분의 한국어 자료가 `ps aux | grep` 한 줄로 시작하지만, 그건 자기 자신(`grep` 프로세스)도 매칭되는 함정이 있고, 매번 PID를 손으로 옮겨 적게 됩니다.

이 글은 그걸 대체하는 표준 도구들 — `pgrep` / `pkill` / `pidof` / `killall` / `lsof` / `fuser` / `kill` — 의 역할과 차이를 정리합니다.

---

## 왜 `ps aux | grep`은 부족한가

```bash
$ ps aux | grep jekyll
zero  36785  ... bundle exec jekyll s
zero  41210  ... grep jekyll          ← grep 자신이 잡힘
```

- `grep` 프로세스 자신이 결과에 섞임
- PID를 시각적으로 골라내야 함 (스크립트로 쓰기 불편)
- 컬럼이 많아서 빠른 확인엔 과함

전통적 회피책으로 `grep [j]ekyll` 트릭(`[j]`는 정규식 문자 클래스라 `[j]ekyll`이라는 문자열은 `grep` 명령 자체에 안 나옴)이 있지만 가독성이 떨어집니다. `pgrep`이 정답.

---

## `pgrep` — 이름·커맨드라인으로 PID 찾기

```bash
pgrep nginx              # 이름에 nginx 포함된 프로세스의 PID
pgrep -fl jekyll         # -f 전체 커맨드라인 매칭, -l PID와 함께 출력
pgrep -u zero            # 특정 유저 소유 프로세스
pgrep -P 1234            # PID 1234의 자식 프로세스
pgrep -n nginx           # 가장 최근에 시작된 것 (newest)
pgrep -o nginx           # 가장 오래된 것 (oldest)
```

**핵심 옵션:**

| 옵션 | 의미 |
|---|---|
| `-f` | 실행파일 이름만이 아니라 **전체 커맨드라인**까지 매칭. `sudo ./tools/run.sh`처럼 인자 안의 문자열도 매칭하려면 필수 |
| `-l` | PID 옆에 커맨드라인 함께 출력 (없으면 PID만) |
| `-a` | macOS/BSD에서 전체 커맨드라인 표시. 리눅스의 `-a`와 의미가 살짝 다름 |
| `-u USER` | 소유자 필터 |
| `-x` | 정확히 일치(exact match)만 |

`-f`가 없으면 `pgrep run.sh`가 `sudo ./tools/run.sh`를 못 찾습니다 — 실행파일 이름이 `sudo`이기 때문입니다. **인자에 든 문자열로 찾을 때는 항상 `-f`**.

---

## `pkill` — 같은 매칭 문법으로 종료

`pgrep`의 모든 옵션을 그대로 받아서 시그널만 추가로 보냅니다.

```bash
pkill -f "jekyll s"          # SIGTERM (기본)
pkill -9 -f "jekyll s"       # SIGKILL — 진짜 안 죽을 때만
pkill -HUP nginx             # 설정 리로드 시그널 (nginx 관행)
pkill -u zero -f "node "     # zero 유저의 node 프로세스만
```

`pkill` 쓰기 전에 **같은 패턴으로 `pgrep -fl` 먼저 돌려서 무엇이 잡히는지 확인**하는 습관이 좋습니다. 광범위한 패턴(`pkill -f bash`)은 본인의 셸까지 죽일 수 있습니다.

---

## `pidof` — 정확한 실행파일 이름으로

```bash
pidof nginx
# 12345 12346 12347
```

- `pgrep`과 달리 **정확한 실행파일명**만 매칭 (부분 일치 안 됨)
- 리눅스 전용 (macOS에는 기본 없음 — `brew install pidof` 필요)
- 출력이 공백 구분 한 줄이라 `kill $(pidof nginx)` 같은 스크립트 친화적

`pgrep`이 더 유연하지만, "프로세스 이름 그대로 PID 뽑기"가 목적이면 더 간결합니다.

---

## `killall` — 이름으로 일괄 종료 (주의)

```bash
killall nginx                # 이름이 nginx인 모든 프로세스에 SIGTERM
killall -9 chrome            # SIGKILL
killall -u zero node         # zero 유저의 node 전부
```

**주의:** Solaris의 `killall`은 **모든 프로세스를 죽이는** 시스템 셧다운용 명령입니다. 리눅스/BSD/macOS와는 의미가 완전히 다릅니다. 낯선 시스템에서 함부로 치지 말 것.

리눅스(`psmisc` 패키지)와 macOS의 `killall`은 BSD 의미("이름으로 골라 죽임")로 동일하지만, 그래도 `pkill`이 더 명시적이고 옵션 일관성이 좋아서 `killall`보다 `pkill`을 추천합니다.

---

## `lsof` — 포트·파일로 역추적

"어떤 프로세스가 4000 포트를 잡고 있지?" 같은 질문은 이름이 아니라 자원으로 거꾸로 찾는 게 빠릅니다.

```bash
lsof -iTCP:4000 -sTCP:LISTEN     # 4000 포트 LISTEN 중인 프로세스
lsof -iTCP -sTCP:LISTEN          # 모든 TCP LISTEN 프로세스
lsof -i :4000                    # TCP/UDP 모두
lsof -p 36785                    # 특정 PID가 연 파일/소켓 전부
lsof /var/log/syslog             # 특정 파일을 열고 있는 프로세스
```

`-sTCP:LISTEN`을 빼면 ESTABLISHED 같은 활성 연결까지 다 나와서 시끄럽습니다. **"포트 누가 잡았어?"는 거의 항상 `-sTCP:LISTEN`**.

---

## `fuser` — 더 가벼운 포트 점유자 찾기 (리눅스)

```bash
fuser 4000/tcp                   # 4000 포트 점유 PID
fuser -k 4000/tcp                # 점유한 프로세스를 한 번에 종료
fuser /var/log/syslog            # 파일을 연 프로세스
```

`lsof`보다 가볍지만 출력이 빈약합니다. macOS는 기본 없음. 빠른 한 줄 확인용.

---

## `kill` — 시그널 선택의 의미

```bash
kill <PID>             # 기본 SIGTERM (15) — "정상 종료해줘"
kill -TERM <PID>       # 위와 동일
kill -KILL <PID>       # SIGKILL (9) — 커널이 강제 종료, 핸들러 못 잡음
kill -HUP <PID>        # SIGHUP (1) — "설정 리로드"의 관행적 신호
kill -INT <PID>        # SIGINT (2) — Ctrl+C와 동일
kill -l                # 시그널 목록 전체
```

**관행:** 먼저 `TERM`으로 보내고, 일정 시간(보통 5–10초) 기다린 뒤에도 안 죽으면 `KILL`. 처음부터 `-9`로 가면 프로세스가 임시 파일 정리·DB 커넥션 종료 등을 못 합니다.

```bash
pkill -TERM -f "jekyll s"
sleep 5
pkill -KILL -f "jekyll s"        # 그래도 살아 있으면
```

---

## 실전 흐름

서버를 다시 띄우려는데 포트가 잡혀 있다면:

```bash
# 1) 포트 점유자 확인
lsof -iTCP:4000 -sTCP:LISTEN

# 2) 어떤 명령으로 떴는지 확인
pgrep -fl jekyll

# 3) 정상 종료 시도
pkill -f "jekyll s"

# 4) 5초 후 잔여 확인
pgrep -fl jekyll

# 5) 안 죽었으면 KILL
pkill -9 -f "jekyll s"
```

---

## 대중성·대안

- `pgrep`/`pkill`/`kill`/`lsof` — **매우 주류**. macOS·리눅스·BSD 기본 포함. 1999년 Solaris에서 시작해 표준화됨.
- `pidof` — 리눅스 표준, macOS는 별도 설치. `pgrep -x`로 거의 대체 가능.
- `killall` — 의미가 OS마다 달라서 추천도가 살짝 떨어짐.
- **Rust 대체제 `procs`** — `ps` 대안. 컬러·트리·필터 좋지만 `pgrep` 영역을 직접 대체하진 않음. 시각적 탐색용.

결론: 셸에서 프로세스를 다루는 일이라면 `pgrep -fl` / `pkill -f` / `lsof -iTCP:<port> -sTCP:LISTEN` / `kill -TERM` 네 가지면 사실상 끝납니다.

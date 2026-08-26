---
title       : "top, htop, btop으로 Linux CPU·메모리·프로세스 확인하기"
description : "서버가 느리거나 CPU·메모리 알림이 왔을 때 top 화면을 읽는 법부터 htop의 인터랙티브 프로세스 관리, btop의 시스템 대시보드까지. load average, CPU 상태, VIRT/RES, %CPU/%MEM을 실전 관점에서 정리한다."
date        : 2026-08-26 09:30:00 +0900
categories  : [linux, "운영·모니터링"]
tags        : [linux, top, htop, btop, process, cpu, memory, monitoring]
pin         : false
hidden      : false
---

서버에서 CPU 100%, 메모리 부족, 응답 지연 같은 알림이 왔을 때 가장 먼저 필요한 것은 "어떤 프로세스가 문제인가"를 빠르게 좁히는 일이다. Linux라면 별도 설치 없이 쓸 수 있는 `top`이 출발점이고, 프로세스를 더 편하게 탐색하려면 `htop`, CPU·메모리뿐 아니라 디스크와 네트워크까지 한 화면에서 보고 싶다면 `btop`이 편하다.

세 도구는 서로 완전히 대체한다기보다 목적이 조금씩 다르다.

| 도구 | 강점 | 언제 쓰나 |
|---|---|---|
| `top` | 거의 모든 Linux에 기본 제공 | 낯선 서버, 설치 권한 없음, 즉시 상태 확인 |
| `htop` | 프로세스 탐색·검색·정렬·signal이 편함 | 어떤 프로세스가 자원을 쓰는지 파고들 때 |
| `btop` | CPU·메모리·디스크·네트워크·프로세스를 시각화 | 서버 전체 상태를 대시보드처럼 훑을 때 |

## 1. top — 어디서든 시작할 수 있는 기본 도구

```bash
top
```

`top`은 대부분의 Linux 환경에서 바로 실행할 수 있다. 화면은 크게 **시스템 요약**과 **프로세스 목록**으로 나뉜다.

```text
top - 09:21:10 up 42 days,  3:15,  2 users,  load average: 1.25, 0.93, 0.72
Tasks: 215 total,   2 running, 213 sleeping,   0 stopped,   0 zombie
%Cpu(s): 18.2 us,  4.1 sy,  0.0 ni, 76.9 id,  0.5 wa,  0.0 hi,  0.3 si,  0.0 st
MiB Mem :  15984.0 total,   1832.4 free,   7812.0 used,   6339.6 buff/cache

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  18231 app       20   0   12.1g   3.8g  321m S  92.4  24.3  58:12.31 java
```

처음에는 숫자가 많아 보이지만 장애 대응에서는 몇 군데만 먼저 보면 된다.

## 2. load average — CPU 사용률과 다른 숫자

```text
load average: 1.25, 0.93, 0.72
```

세 숫자는 각각 최근 **1분, 5분, 15분**의 load average다.

load average는 단순한 CPU 사용률이 아니다. CPU를 사용 중이거나 CPU를 기다리는 runnable task, Linux에서는 일부 uninterruptible sleep 상태의 task까지 반영되는 시스템 부하 지표다.

따라서 CPU core 수와 같이 보는 것이 중요하다.

```bash
nproc
```

예를 들어 4 core 머신에서 load 1은 대체로 여유가 있지만, 1 core 머신에서 load가 계속 4라면 처리할 일에 비해 CPU 자원이 부족할 가능성이 크다.

짧은 순간의 1분 load보다 **5분·15분 값까지 함께 올라가는지**를 보는 편이 좋다.

## 3. CPU 줄 읽기

```text
%Cpu(s): 18.2 us, 4.1 sy, 0.0 ni, 76.9 id, 0.5 wa, ...
```

자주 보는 값은 다음과 같다.

| 값 | 의미 | 볼 때 |
|---|---|---|
| `us` | user space CPU | Java, Node, Python 등 애플리케이션 연산 |
| `sy` | kernel CPU | system call, kernel 작업이 많은지 |
| `id` | idle | CPU가 실제로 얼마나 놀고 있는지 |
| `wa` | I/O wait | 디스크 등 I/O 완료를 기다리는 시간 |
| `st` | steal | VM에서 hypervisor 때문에 CPU를 못 받은 시간 |

CPU 알림이 왔다면 우선 `id`가 실제로 낮은지 본다. `us`가 높다면 애플리케이션 CPU 사용을, `sy`가 비정상적으로 높다면 kernel/system call 쪽을, `wa`가 높다면 CPU 자체보다 I/O 병목을 의심할 수 있다.

가상머신에서는 `st`도 유용하다. 애플리케이션이 CPU를 많이 쓰는 것이 아니라 host 쪽 경쟁 때문에 VM이 CPU 시간을 충분히 받지 못하는 상황을 구분하는 단서가 된다.

## 4. 메모리 — free 숫자 하나만 보면 안 된다

Linux는 남는 메모리를 page cache 등으로 적극 활용한다. 그래서 `free`가 작다는 이유만으로 바로 메모리 부족이라고 판단하면 안 된다.

`top`과 함께 다음 명령도 자주 사용한다.

```bash
free -h
```

여기서는 특히 `available`을 보는 것이 유용하다. 새 프로세스가 추가 메모리를 요구했을 때 swap 없이 비교적 사용할 수 있는 메모리를 추정한 값이다.

메모리 문제를 볼 때는 다음을 같이 확인한다.

```text
available memory가 계속 줄어드는가?
swap 사용량이 증가하는가?
특정 프로세스 RES가 계속 증가하는가?
OOM kill이 발생했는가?
```

## 5. VIRT와 RES는 무엇이 다른가

프로세스 목록에서 자주 헷갈리는 값이다.

```text
VIRT    RES    SHR    %MEM
12.1g   3.8g   321m   24.3
```

### VIRT

프로세스가 가진 **virtual address space 전체 크기**다. 실제 RAM에 올라온 양과 같지 않다. memory mapping, shared library, 예약된 address space 등이 포함될 수 있어 JVM 같은 프로세스에서는 특히 크게 보일 수 있다.

### RES

현재 실제 물리 메모리에 resident한 영역이다. 프로세스의 실제 RAM 사용을 빠르게 볼 때는 `VIRT`보다 `RES`가 훨씬 유용하다.

### %MEM

전체 물리 메모리 대비 프로세스의 resident memory 비율이다.

따라서 Java 프로세스에서 `VIRT=20G`가 보인다고 "RAM을 20GB 쓰고 있다"고 판단하면 안 된다. 우선 `RES`, JVM heap/native memory, OS 전체 available memory를 함께 본다.

## 6. %CPU는 왜 100을 넘을 수 있나

멀티코어 시스템에서는 `top` 설정과 구현에 따라 한 프로세스의 `%CPU`가 100%를 넘을 수 있다.

예를 들어 여러 thread가 동시에 CPU core를 사용하면:

```text
java  287.4 %CPU
```

처럼 보일 수 있다. 대략 여러 core를 동시에 사용하고 있다는 뜻이다.

따라서 CPU 문제를 볼 때는 시스템 전체 CPU와 프로세스 `%CPU`, core 수를 함께 봐야 한다.

## 7. top에서 자주 쓰는 키

`top` 실행 중 다음 정도만 알아도 실전에서 충분히 유용하다.

| 키 | 기능 |
|---|---|
| `P` | CPU 사용률 기준 정렬 |
| `M` | 메모리 사용률 기준 정렬 |
| `1` | CPU core별 사용률 표시 전환 |
| `c` | command line 전체 표시 전환 |
| `k` | PID에 signal 보내기 |
| `q` | 종료 |

CPU 알림을 받았다면 `top` → `P`, 메모리 알림이라면 `top` → `M`부터 시작하면 된다.

## 8. htop — 프로세스를 더 편하게 탐색

`htop`은 `top`과 비슷하지만 키보드 탐색과 프로세스 관리가 훨씬 편하다.

```bash
htop
```

배포판에 따라 별도 설치가 필요하다.

```bash
# macOS
brew install htop

# Ubuntu/Debian
sudo apt install htop
```

프로세스를 방향키로 선택하고 검색·정렬하거나 tree 형태로 parent/child 관계를 확인하기 좋다. signal을 보낼 때도 PID를 따로 기억해서 `kill` 명령을 치는 것보다 인터랙티브하게 처리할 수 있다.

`top`이 "어디서나 있는 최소 공통분모"라면 `htop`은 **프로세스 중심 작업을 편하게 만든 버전**으로 이해하면 된다.

## 9. btop — 시스템 전체를 대시보드로 보기

`btop`은 프로세스 목록뿐 아니라 시스템 리소스를 한 화면에 시각적으로 보여준다.

```bash
btop
```

대표적으로 다음을 동시에 볼 수 있다.

```text
CPU
Memory / Swap
Disk
Network
Processes
```

macOS에서는 Homebrew로 설치할 수 있다.

```bash
brew install btop
```

서버에 접속해서 "뭔가 느린데 어디부터 봐야 하지?"라는 상황에서는 CPU, memory, network, disk activity를 한 화면에서 훑을 수 있다는 장점이 크다.

다만 화려한 UI가 `top`의 기본 지식을 대신해주지는 않는다. `load average`, CPU state, process memory 같은 의미를 알고 btop을 사용하면 화면을 훨씬 정확하게 읽을 수 있다.

## 10. top, htop, btop 중 무엇을 쓸까

세 도구 중 하나만 선택해야 하는 것은 아니다.

```text
낯선 Linux 서버 / 설치 불가
        ↓
       top

프로세스를 검색·선택하며 자세히 관리
        ↓
       htop

CPU·RAM·disk·network까지 전체 상태 파악
        ↓
       btop
```

개인 개발환경에는 `btop`을 설치해두고, 실제 운영 서버에서는 `top`을 기본기로 가져가는 조합이 실용적이다. 운영 서버에는 원하는 TUI가 설치되어 있지 않은 경우가 많기 때문이다.

## 11. 장애 대응 시 빠른 순서

CPU 또는 메모리 알림을 받았을 때는 도구 자체보다 **무엇을 어떤 순서로 볼지**가 중요하다.

```text
1. uptime / load average 확인
2. CPU idle, user, system, iowait 확인
3. CPU 또는 memory 상위 프로세스 확인
4. 문제 PID의 command line과 실행 사용자 확인
5. systemd/Docker라면 해당 서비스 로그 확인
6. JVM 등 runtime이면 runtime 전용 지표로 더 깊게 확인
```

예를 들어 Java 프로세스가 CPU를 많이 쓴다고 바로 재기동하기보다, PID를 확인한 뒤 thread dump나 GC 상태 등 애플리케이션 레벨 증거를 추가로 확보할 수 있다.

반대로 서버 전체의 `wa`가 높다면 Java 코드보다 storage/I/O 쪽을 먼저 보는 것이 맞을 수 있다.

## 같이 쓰면 좋은 도구

시스템 상태와 로그는 서로 다른 문제다.

```text
btop        → CPU / RAM / disk / network / process
lazyjournal → journald / systemd / container 로그
lazydocker  → Docker container 상태 / logs / restart / exec
```

`btop`으로 "누가 자원을 쓰고 있는지" 찾고, 해당 프로세스가 systemd unit이나 container라면 로그 도구로 넘어가는 흐름이 자연스럽다.

> 📎 **치트시트** · [linux-process](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/linux-process.md) — 프로세스 조회·signal·background job 등 빠른 참조 (GitHub)
{: .prompt-tip }

## 정리

`top`은 오래된 도구지만 운영 환경에서는 여전히 가장 중요한 기본기다. 설치 여부를 걱정하지 않고 거의 어디서나 사용할 수 있기 때문이다.

`htop`은 그 프로세스 탐색 경험을 편하게 만들고, `btop`은 범위를 시스템 전체 리소스 대시보드로 넓힌다.

결국 중요한 것은 특정 TUI를 외우는 것이 아니라 다음 질문에 답할 수 있는 것이다.

```text
CPU가 실제로 바쁜가?
CPU를 누가 쓰고 있는가?
I/O를 기다리는 것인가?
메모리가 실제로 부족한가?
어떤 프로세스의 resident memory가 큰가?
문제가 지속적인가, 순간적인가?
```

이 질문을 `top`으로 답할 수 있다면, `htop`과 `btop`은 그 작업을 더 빠르고 편하게 만들어주는 도구가 된다.

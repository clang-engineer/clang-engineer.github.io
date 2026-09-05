---
title       : "Xmx는 8GB인데 Java 프로세스 RSS가 9GB를 넘는 이유"
description : "Linux 서버에서 메모리 사용률이 높게 보일 때 free -h, ps의 RSS, jcmd GC.heap_info를 함께 읽는 방법을 정리한다. Heap used·committed와 RSS의 차이, Xmx를 넘어서는 JVM 메모리, 재기동 전후 점검 순서를 실전 관점에서 설명한다."
date        : 2026-09-05 21:50:00 +0900
categories  : [linux, "운영·모니터링"]
tags        : [linux, java, jvm, memory, rss, xmx, heap, g1gc, jcmd, troubleshooting]
pin         : false
hidden      : false
---

Linux 서버에서 메모리 사용률이 90%를 넘었는데, Java 애플리케이션의 `-Xmx`는 8GB로 설정되어 있다. 그런데 `ps`를 보면 Java 프로세스의 RSS는 9GB를 넘는다.

처음 보면 모순처럼 보이지만 정상적으로 가능한 상황이다.

핵심은 다음 세 값이 서로 다른 의미라는 점이다.

```text
-Xmx          → Java Heap의 최대 크기
Heap used     → 현재 Heap에서 실제 사용 중인 크기
RSS           → 프로세스가 현재 물리 메모리에 올려둔 전체 크기
```

Java 프로세스의 메모리를 볼 때는 이 셋을 분리해서 봐야 한다.

## 1. 서버 전체 메모리부터 확인한다

```bash
free -h
```

예를 들어 다음과 같이 보인다고 하자.

```text
              total        used        free      shared  buff/cache   available
Mem:           15Gi        13Gi       233Mi       0.0Ki       1.2Gi       1.1Gi
Swap:         4.0Gi       2.0Mi       4.0Gi
```

Linux에서 `free` 숫자만 보고 메모리 부족을 판단하면 안 된다. Linux는 남는 메모리를 page cache 등으로 적극 활용하기 때문이다.

운영 중에는 특히 `available`을 같이 본다.

```text
available ≈ 1.1GiB
```

이 정도라면 즉시 장애 상태라고 단정할 수는 없지만, 추가 부하를 감당할 여유는 크지 않은 상태다. Swap 사용량이 증가하는지, `available`이 계속 줄어드는지도 같이 보는 것이 좋다.

## 2. 어떤 프로세스가 메모리를 쓰는지 확인한다

```bash
ps aux --sort=-rss | head -20
```

또는 특정 PID만 보면:

```bash
ps -p <PID> -o pid,user,%cpu,%mem,rss,vsz,etime,cmd
```

예시:

```text
PID   %MEM      RSS       VSZ
757   60.7   9793792   13177268
```

여기서 메모리 판단에 먼저 볼 값은 `RSS`다.

```text
9,793,792 KB ÷ 1024 ÷ 1024 ≈ 9.34 GB
```

즉 이 Java 프로세스는 실제 물리 메모리에 약 9.3GB가 resident한 상태다.

`VSZ`는 virtual address space 전체 크기이므로 실제 RAM 사용량과 동일하지 않다. JVM에서는 예약된 주소 공간 때문에 특히 크게 보일 수 있다.

## 3. Xmx 8GB인데 RSS가 왜 9.3GB인가

JVM 옵션이 다음과 같다고 하자.

```text
-Xms4096m
-Xmx8192m
```

`-Xmx8192m`은 **Java 프로세스 전체 메모리 제한이 아니다.**

`-Xmx`는 Java Heap의 최대 크기만 제한한다. 실제 Java 프로세스는 Heap 외에도 여러 메모리 영역을 사용한다.

대표적으로 다음이 있다.

```text
Java Heap
Metaspace
Thread Stack
Direct Buffer / Direct Memory
JIT Code Cache
JNI / Native Library
GC 및 JVM 내부 구조
Java Agent
```

따라서 다음과 같은 상황은 충분히 가능하다.

```text
Heap committed     8.0GB
+ non-Heap/native  1GB 이상
-------------------------
RSS                9GB 이상
```

즉 `Xmx=8GB`인데 RSS가 9GB를 넘는 것 자체는 비정상 현상이 아니다.

## 4. 실제 Heap 상태는 jcmd로 확인한다

Java 프로세스의 Heap 상태는 다음처럼 확인할 수 있다.

```bash
jcmd <PID> GC.heap_info
```

JDK 경로를 직접 사용해야 하는 환경이라면:

```bash
/path/to/jdk/bin/jcmd <PID> GC.heap_info
```

예시:

```text
garbage-first heap   total 8388608K, used 4851040K
region size 4096K
Metaspace       used 176311K, committed 177344K
```

이 값을 읽으면:

```text
Heap total(committed) ≈ 8GB
Heap used             ≈ 4.6GB
Metaspace used        ≈ 172MB
```

이라는 뜻이다.

여기서 중요한 부분은 **Heap used와 Heap committed가 다르다**는 점이다.

JVM은 Heap을 8GB까지 확보했지만, 그 순간 실제 객체가 차지하는 Heap은 약 4.6GB일 수 있다.

## 5. Heap 사용량이 줄었는데 Linux 메모리는 왜 그대로인가

JVM이 한 번 Heap을 크게 확장했다고 해서 사용량이 줄어든 즉시 모든 영역을 운영체제에 반환하는 것은 아니다.

G1GC를 사용하는 JVM에서도 Heap shrink나 unused memory 반환이 가능할 수 있지만, 반환 시점과 양을 운영자가 단순히 기대한 대로 보장할 수 있는 것은 아니다.

따라서 다음과 같은 상태가 유지될 수 있다.

```text
Heap used       4.6GB
Heap committed  8.0GB
RSS             9.3GB
```

애플리케이션이 실제 객체로 8GB를 사용하고 있다는 의미는 아니지만, JVM이 확보한 Heap과 native memory가 프로세스에 남아 있기 때문에 Linux에서는 높은 메모리 사용률로 보일 수 있다.

## 6. Heap used, committed, RSS를 구분한다

세 값의 의미를 정리하면 다음과 같다.

| 값 | 의미 | 어디서 확인 |
|---|---|---|
| `Heap used` | Heap에서 현재 객체가 사용 중인 크기 | `jcmd GC.heap_info` |
| `Heap committed` | JVM이 Heap 용도로 확보한 크기 | `jcmd GC.heap_info` |
| `RSS` | Heap + native memory 등을 포함해 실제 RAM에 resident한 프로세스 메모리 | `ps`, `top` |
| `-Xmx` | Heap이 커질 수 있는 최대 크기 | JVM 옵션 |

따라서 다음 식으로 생각하면 안 된다.

```text
-Xmx = Java 프로세스 최대 RAM 사용량   # 틀림
```

실제로는 다음에 가깝다.

```text
Java process RSS
≈ Heap
+ Metaspace
+ Thread Stack
+ Direct Memory
+ Code Cache
+ JNI / Native Library
+ JVM/GC 내부 메모리
+ Agent 등의 native 영역
```

## 7. 메모리 누수라고 바로 판단하면 안 된다

RSS가 높다는 사실만으로 memory leak을 판단할 수는 없다.

예를 들어 Heap이 한때 크게 확장된 뒤 다음 상태로 안정적으로 유지된다면:

```text
Heap committed  8GB
Heap used       4~5GB 사이에서 반복
RSS             9GB 부근 유지
```

단순히 JVM이 확보한 영역을 유지하고 있는 상황일 수도 있다.

반대로 GC가 반복된 뒤에도 Heap used의 기준선이 계속 올라간다면 누수를 의심할 근거가 생긴다.

확인할 때는 한 시점의 숫자보다 **시간에 따른 추이**를 보는 것이 중요하다.

```bash
jstat -gcutil <PID> 5000 12
```

또는 주기적으로 Heap 상태를 기록할 수 있다.

```bash
while true
do
    date
    jcmd <PID> GC.heap_info
    sleep 300
done
```

특히 Old 영역 사용률이 GC 이후에도 계속 우상향하는지 확인하면 좋다.

## 8. Full GC를 실행하면 메모리가 반환될까

다음 명령으로 Full GC를 요청할 수 있다.

```bash
jcmd <PID> GC.run
```

하지만 운영 서버에서는 신중해야 한다.

Full GC는 불필요한 객체를 정리할 수 있지만:

```text
GC 수행 = OS 메모리 반환 보장
```

은 아니다.

GC 과정에서 일시적인 응답 지연이 발생할 수도 있다. 따라서 단순히 Linux 메모리 사용률 숫자를 낮추기 위한 목적으로 무조건 Full GC를 실행하는 것은 좋은 접근이 아니다.

## 9. 재기동은 가장 확실한 메모리 회수 방법이지만 진단과 분리한다

JVM 프로세스를 재기동하면 해당 프로세스가 잡고 있던 Heap과 native memory는 운영체제로 반환된다.

`-Xms4G -Xmx8G`라면 재기동 후 Heap은 초기 상태에서 다시 시작하고, 실제 부하에 따라 이후 확장된다.

따라서 높은 RSS가 장기간 유지되고 있고 운영상 재기동이 가능한 상황이라면 다음 비교가 유용하다.

```text
재기동 전
  free -h
  ps RSS
  jcmd GC.heap_info

재기동

재기동 후
  free -h
  ps RSS
  jcmd GC.heap_info
```

하지만 재기동으로 숫자가 내려갔다고 해서 원인이 해결됐다고 단정하면 안 된다.

이후 같은 부하에서 다시 같은 크기까지 증가한다면 정상적인 Heap sizing인지, workload 특성인지, 애플리케이션 문제인지 추가로 구분해야 한다.

## 10. 운영 중 빠르게 확인하는 순서

Java 서버에서 메모리 알림이 왔을 때는 다음 순서가 실용적이다.

```text
1. free -h
   → 서버 available / swap 확인

2. ps aux --sort=-rss
   → 메모리 상위 프로세스 확인

3. ps -p <PID> -o ...rss,vsz...
   → 해당 프로세스 RSS 확인

4. JVM 옵션 확인
   → Xms / Xmx 확인

5. jcmd <PID> GC.heap_info
   → Heap used / committed 확인

6. 시간에 따른 Heap used 추이 관찰
   → 정상 유지인지 지속 증가인지 구분

7. 필요하면 재기동 전후 비교
   → 메모리 회수 및 기준선 재확인
```

핵심은 Linux 숫자 하나만 보지 않고 **OS → 프로세스 → JVM** 순서로 내려가는 것이다.

```text
Linux
  free / available
      ↓
Process
  RSS / VSZ
      ↓
JVM
  Xmx / Heap used / Heap committed / native memory
```

## 11. 캡처용 점검 스크립트

재기동 전후 상태를 동일한 형식으로 남기고 싶다면 간단한 스크립트를 사용할 수 있다.

```bash
#!/bin/bash

JAVA_HOME=/path/to/jdk

PID=$(pgrep -f 'catalina.base=/path/to/app' | head -1)

if [ -z "$PID" ]; then
    echo "Java 프로세스를 찾을 수 없습니다."
    exit 1
fi

echo "===== DATE ====="
date

echo
echo "===== PID ====="
echo "$PID"

echo
echo "===== SERVER MEMORY ====="
free -h

echo
echo "===== PROCESS MEMORY ====="
ps -p "$PID" -o pid,user,%cpu,%mem,rss,vsz,etime

echo
echo "===== JVM HEAP ====="
"$JAVA_HOME/bin/jcmd" "$PID" GC.heap_info
```

이렇게 남기면 재기동 전후의 `available`, RSS, Heap used/committed를 한 화면에서 비교할 수 있다.

## 정리

Java 서버의 메모리 문제에서 가장 자주 헷갈리는 부분은 다음 세 가지다.

```text
-Xmx != Java 프로세스 전체 메모리 한도
Heap used != Heap committed
Heap committed != RSS
```

Linux에서 메모리 사용률이 높다고 바로 증설이나 재기동부터 결정하기보다:

```text
free -h
→ RSS
→ JVM Heap
→ 시간에 따른 추이
```

순서로 확인하면 원인을 훨씬 정확하게 좁힐 수 있다.

특히 `Xmx`와 RSS의 차이를 이해하면 "Heap 최대값보다 Java 프로세스가 더 많은 메모리를 쓰고 있다"는 상황을 이상 현상으로 오해하지 않게 된다.

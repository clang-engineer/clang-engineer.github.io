---
title       : Linux 하드웨어 자원 모니터링 명령어 및 도구
description : 
date        : 2025-10-03 14:00:40 +0900
updated     : 2025-10-03 14:41:27 +0900
categories  : [dev, linux]
tags        : [linux, command, hardware, monitoring, cpu, memory, disk, network, nmon, atop, netdata]
pin         : false
hidden      : false
---

# 🖥️ Linux 하드웨어 자원 모니터링 명령어 및 도구

Linux 시스템에서 CPU, 메모리, 디스크, 네트워크 등의 하드웨어 자원을 모니터링하기 위한 명령어와 도구들을 카테고리별로 정리하였습니다.

---

## 1️⃣ CPU 사용률 확인

### 1. `mpstat`

```sh
# CPU 사용률을 %로 표시
mpstat | tail -1 | awk '{print 100-$NF}'
```

* `mpstat`는 `sysstat` 패키지에 포함되어 있으며, CPU 사용률을 모니터링합니다.

### 2. `top`

```sh
# CPU idle 확인
top -b -n1 | grep -Po '[0-9.]+ id'

# CPU 사용률 %
top -b -n1 | grep -Po '[0-9.]+ id' | awk '{print 100-$1}'
```

* `top` 명령어는 실시간으로 시스템 정보를 제공하며, `-b` 옵션은 배치 모드로 실행합니다.

### 3. `nmon`

```sh
# nmon 실행 후, 'c'를 눌러 CPU 사용률 확인
nmon
```

* `nmon`은 CPU, 메모리, 디스크, 네트워크 등 다양한 시스템 자원을 모니터링할 수 있는 도구입니다. ([LFCS Certification eBook][1])

---

## 2️⃣ 메모리 사용량 확인

### 1. `free`

```sh
free -h
```

* `free` 명령어는 시스템의 메모리 사용량을 확인할 수 있습니다. `-h` 옵션은 사람이 읽기 쉬운 형식으로 출력합니다.

### 2. `sar`

```sh
sar -r 1
```

* `sar`는 시스템 활동 보고서로, 메모리 사용량을 포함한 다양한 시스템 통계를 제공합니다.

### 3. `top`

```sh
top -n1 | grep Mem
```

* `top` 명령어에서 `-n1` 옵션을 사용하여 한 번만 실행하고, `grep`을 사용하여 메모리 정보를 필터링합니다.

### 4. `/proc/meminfo`

```sh
cat /proc/meminfo | grep Mem
```

* `/proc/meminfo` 파일은 시스템의 메모리 정보를 제공합니다.

---

## 3️⃣ 디스크 사용량 확인

### 1. `df`

```sh
df -h
```

* `df` 명령어는 파일 시스템의 디스크 공간 사용량을 확인합니다. `-h` 옵션은 사람이 읽기 쉬운 형식으로 출력합니다.

### 2. `iostat`

```sh
iostat -x 1
```

* `iostat`는 CPU와 디스크 I/O 통계를 제공합니다. `-x` 옵션은 확장된 통계를, `1`은 1초 간격으로 출력합니다.

### 3. `nmon`

```sh
# nmon 실행 후, 'd'를 눌러 디스크 사용량 확인
nmon
```

* `nmon`에서 'd'를 눌러 디스크 사용량을 확인할 수 있습니다.

---

## 4️⃣ 네트워크 사용량 확인

### 1. `ifstat`

```sh
ifstat
```

* `ifstat`는 네트워크 인터페이스의 입출력 통계를 실시간으로 제공합니다.

### 2. `netstat`

```sh
netstat -i
```

* `netstat`는 네트워크 연결, 라우팅 테이블, 인터페이스 통계 등을 표시합니다. `-i` 옵션은 인터페이스 통계를 보여줍니다.

### 3. `ss`

```sh
ss -tuln
```

* `ss`는 `netstat`보다 빠르고 상세한 네트워크 통계를 제공합니다. `-tuln` 옵션은 TCP, UDP, 리스닝 포트, 숫자 형식으로 출력합니다.

### 4. `nmon`

```sh
# nmon 실행 후, 'n'을 눌러 네트워크 사용량 확인
nmon
```

* `nmon`에서 'n'을 눌러 네트워크 사용량을 확인할 수 있습니다.

---

## 5️⃣ 종합 모니터링 도구

### 1. `atop`

```sh
atop
```

* `atop`은 CPU, 메모리, 디스크, 네트워크 등의 자원 사용량을 상세하게 모니터링할 수 있는 도구입니다. ([Last9][2])

### 2. `nmon`

```sh
nmon
```

* `nmon`은 CPU, 메모리, 디스크, 네트워크 등 다양한 시스템 자원을 모니터링할 수 있는 도구입니다. ([LFCS Certification eBook][1])

### 3. `Netdata`

```sh
netdata
```

* `Netdata`는 실시간으로 시스템 성능을 모니터링하고, 웹 기반 대시보드를 제공합니다. ([Wikipedia][3])

---

## 6️⃣ 참고 사항

* **`nmon`**: 실시간 모니터링과 CSV 형식으로 데이터를 저장하여 후속 분석이 가능합니다.
* **`atop`**: 시스템 자원 사용에 대한 상세한 정보를 제공하며, 로그 기능을 통해 과거 데이터를 분석할 수 있습니다.
* **`Netdata`**: 웹 기반 대시보드를 통해 실시간 모니터링이 가능하며, 다양한 플러그인을 지원합니다.

---

[1]: https://www.tecmint.com/command-line-tools-to-monitor-linux-performance/?utm_source=chatgpt.com "24 Best Command Line Tools to Monitor Linux Performance"
[2]: https://last9.io/blog/the-best-linux-monitoring-tools-for-2024/?utm_source=chatgpt.com "The Best Linux Monitoring Tools for 2024"
[3]: https://en.wikipedia.org/wiki/Netdata?utm_source=chatgpt.com "Netdata"


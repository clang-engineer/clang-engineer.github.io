---
title       : journalctl 사용법
description : >-
date        : 2022-05-13 13:30:44 +0900
updated     : 2025-10-03 14:37:06 +0900
categories  : [dev, linux]
tags        : [linux, systemd, journalctl]
pin         : false
hidden      : false
---

# 📓 journalctl Cheat Sheet

`journalctl`은 **systemd 기반 리눅스에서 로그를 조회하는 도구**입니다.
systemd는 로그 데이터를 **journal**이라는 바이너리 형식으로 저장하며, `systemd-journald.service`가 이를 관리합니다.

---

## 1️⃣ 기본 정보

* **설정 파일**: `/etc/systemd/journald.conf`
* **기본 실행**: 옵션 없이 실행하면 systemd 전체 로그 출력

```bash
journalctl
```

---

## 2️⃣ 최근 메시지 조회

* `-n [N]` : 최근 N개의 메시지 조회 (기본 10개)

```bash
journalctl -n       # 최근 10개
journalctl -n 7     # 최근 7개
```

* `-x` : message catalog에서 상세 설명 추가

```bash
journalctl -xn
```

* 마지막 로그부터 보기

```bash
journalctl -x -e
```

* 페이지 없이 출력

```bash
journalctl -xn --no-pager | less
```

---

## 3️⃣ 실시간 로그 보기

* `-f` : tail -f 처럼 실시간 로그 출력

```bash
journalctl -f
journalctl -f -u test-service  # 특정 서비스 실시간 로그
```

---

## 4️⃣ 특정 PID 로그 보기

* `_PID=<PID>` 옵션 사용

```bash
journalctl -n _PID=872   # PID 872 관련 최근 10개 로그
```

---

## 5️⃣ 로그 우선순위 필터링

* `-p <priority>` : 로그 우선순위에 따라 필터링
* 우선순위: `emerg, alert, crit, err, warning, notice, info, debug`

```bash
journalctl -p critical
journalctl -p err
```

---

## 6️⃣ 날짜/시간 필터링

* `--since` / `--until` 옵션으로 기간 지정 가능

```bash
journalctl --since "2020-01-09"
journalctl --since "2020-01-09" --until "2020-01-11"
journalctl --since yesterday --until tomorrow
journalctl --since "-2hour" --until "10min"
```

---

## 7️⃣ 특정 서비스 로그

* `-u <서비스명>` 옵션 사용

```bash
journalctl -u test-service      # 서비스 전체 로그
journalctl -f -u test-service   # 실시간 로그
```

---

### 💡 팁

* 다양한 옵션을 조합하면 로그 분석, 디버깅, 실시간 모니터링 등 다양한 용도로 활용 가능
* 예: 특정 서비스 + 최근 50개 로그 + 오류 수준 필터링

```bash
journalctl -u my-service -n 50 -p err
```

> 출처: [Lesstif: Linux journalctl](https://www.lesstif.com/system-admin/linux-journalctl-82215080.html)

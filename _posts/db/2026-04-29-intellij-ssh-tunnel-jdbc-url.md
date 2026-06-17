---
title       : "IntelliJ DB SSH 터널 — JDBC URL은 localhost가 아닌 원격 목적지로"
description : "IntelliJ 내장 SSH 터널 사용 시 JDBC URL에 베스천에서 본 원격 주소를 넣어야 하는 이유"
date        : 2026-04-29 10:00:00 +0900
updated     : 2026-04-29 10:00:00 +0900
categories  : [db, "도구·연동"]
tags        : [intellij, ssh-tunnel, troubleshooting]
pin         : false
hidden      : false
---

IntelliJ 내장 SSH 터널을 쓸 땐 JDBC URL에 **베스천에서 본 원격 주소**를 적어야 한다. `localhost:<로컬포트>`는 터미널에서 직접 `ssh -L`로 터널을 띄운 경우에만 맞다.

## 두 방식이 헷갈리는 이유

```bash
# 터미널 방식
ssh -L 5432:10.0.0.10:15432 myuser@203.0.113.10
# → 이 경우 JDBC URL: jdbc:postgresql://localhost:5432/appdb
```

| 방식 | General 탭 Host:Port | JDBC URL |
|------|----------------------|----------|
| **터미널 `ssh -L`** | `localhost:5432` | `localhost:5432` |
| **IntelliJ 내장 터널** | `10.0.0.10:15432` | `10.0.0.10:15432` |

두 방식이 섞이면 (IntelliJ 터널 ON + URL이 localhost) → `SSH tunnel creation failed: Connection refused`.

## 올바른 IntelliJ 설정 (내장 터널 사용 시)

### SSH/SSL 탭 → Use SSH tunnel 체크

| 필드 | 값 |
|------|-----|
| Host | `203.0.113.10` (베스천) |
| Port | `22` |
| Username | `myuser` |
| Local port | **비워두기** (자동 할당) |

### General 탭

```
Host: 10.0.0.10
Port: 15432
URL : jdbc:postgresql://10.0.0.10:15432/appdb?currentSchema=meta
```

`ssh -L 5432:10.0.0.10:15432 user@bastion` 명령에서:
- `user@bastion` → SSH/SSL 탭으로
- `10.0.0.10:15432` → General 탭으로
- 가운데 `5432` (로컬 포트) → IntelliJ는 신경 쓸 필요 없음

## 핵심 정리

IntelliJ는 "목적지까지 알아서 연결해줘"라는 추상화다. 그래서 **IntelliJ 관점에선 베스천을 거치든 안 거치든 최종 목적지 주소만 적으면 된다.** `localhost`는 "내가 이미 터널을 만들어놨다"는 뜻이라 IntelliJ가 직접 터널을 만들 때는 쓰면 안 된다.

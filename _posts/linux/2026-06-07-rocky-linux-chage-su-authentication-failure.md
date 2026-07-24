---
title       : "passwd 직후 su 인증이 실패할 때 점검 순서"
description : "비밀번호를 바꾼 직후 su가 실패할 때 PAM 로그, 계정 잠금, 만료, 접근 정책과 셸을 순서대로 진단한다. PASS_MIN_DAYS가 인증을 막는다는 오해도 바로잡는다."
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [rocky-linux, troubleshooting]
pin         : false
hidden      : false
---

새로 만든 계정에 `passwd`로 비밀번호를 설정한 직후 `su - username`이 `Authentication failure`로 끝날 수 있다. 이 메시지만으로 원인을 단정하면 안 된다. 특히 `/etc/shadow`의 **최소 변경 주기(`PASS_MIN_DAYS`, `chage -m`)는 비밀번호 변경 간격을 제한할 뿐, 현재 비밀번호 인증을 막지 않는다.**

## 증상

```bash
sudo passwd alice
# 새 비밀번호 입력 + 확인 → "all authentication tokens updated successfully"

su - alice
# Password: <방금 만든 비밀번호>
# su: Authentication failure
```

## 먼저 로그에서 실패한 PAM 단계를 확인

Rocky/RHEL에서는 시도 직후 보안 로그를 확인한다.

```bash
sudo journalctl -t su --since "5 minutes ago"
sudo tail -n 100 /var/log/secure
```

`pam_faillock`, `pam_access`, `pam_unix`, 만료 등 실제로 거부한 모듈을 찾는다. 로그 없이 `chage` 값을 바꾸면 원인을 가리고 정책만 약화시킬 수 있다.

## 계정 상태를 좁혀 확인

```bash
sudo passwd -S alice       # 잠금 여부와 비밀번호 상태
sudo faillock --user alice # 반복 실패로 인한 잠금
sudo chage -l alice        # 비밀번호·계정 만료
getent passwd alice        # 로그인 셸과 홈
```

| 점검 | 의미 |
|---|---|
| `passwd -S`의 `L` | 비밀번호 해시가 잠김 |
| `faillock` 기록 | PAM 실패 횟수 정책에 걸림 |
| password/account expires | 비밀번호 또는 계정 만료 |
| 셸이 `/sbin/nologin` | 대화형 로그인 차단 |
| `pam_access`/그룹 정책 | `su` 접근 대상 제한 |

잠금 원인이 확인됐을 때만 해당 상태를 해제한다.

```bash
sudo faillock --user alice --reset  # faillock이 원인일 때
sudo passwd -u alice                # 비밀번호 잠금이 원인일 때
```

## `chage -m`이 하는 일

`/etc/shadow`의 최소 변경 주기는 사용자가 비밀번호를 **다시 변경할 수 있는 가장 이른 시점**이다.

```bash
sudo chage -m 1 alice
# alice가 마지막 변경 후 하루 안에 passwd를 다시 실행하면 변경이 거부될 수 있음
# 하지만 현재 비밀번호를 사용한 su 인증 가능 여부와는 별개
```

`chage -m 0 -M -1`을 인증 장애의 일반 해결책으로 쓰면 안 된다. `-M -1`은 최대 사용 기간을 없애 조직의 비밀번호 만료 정책까지 바꾼다.

## 핵심 정리

`passwd` 직후 `su`가 실패하면 로그에서 거부한 PAM 단계를 먼저 찾고, 계정 잠금·faillock·만료·접근 정책·로그인 셸을 각각 확인한다. `PASS_MIN_DAYS`는 변경 주기이지 인증 허용 조건이 아니다.

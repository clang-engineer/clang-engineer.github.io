---
title       : "passwd로 비밀번호 바꾼 직후 su가 실패할 때 — chage 트랩"
description : "/etc/shadow의 최소 변경 주기 때문에 막 만든 비밀번호로도 인증이 거부되는 경우"
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-06-07 12:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [linux, rocky-linux, passwd, chage, shadow, troubleshoot]
pin         : false
hidden      : false
---

새로 만든 계정에 `passwd`로 비밀번호를 설정한 직후 `su - username`을 시도했는데 `Authentication failure`로 거절당하는 경우가 있다. 비밀번호는 맞다. 원인은 `/etc/shadow`에 박힌 **최소 변경 주기**다.

## 증상

```bash
sudo passwd shine
# 새 비밀번호 입력 + 확인 → "all authentication tokens updated successfully"

su - shine
# Password: <방금 만든 비밀번호>
# su: Authentication failure
```

비밀번호도 맞는데 거절당하는 게 핵심이다.

## 원인

`/etc/shadow`의 해당 사용자 라인:

```bash
grep shine /etc/shadow
# shine:$6$...:20559:1:90:7:::
#                  ^ 최소 변경 주기 (일)
```

각 컬럼의 의미:

| 컬럼 | 의미 |
|---|---|
| 1 | 사용자명 |
| 2 | 해시된 비밀번호 |
| 3 | 마지막 변경일 (epoch days) |
| **4** | **최소 변경 주기 (일)** — 0이 아니면 그 기간 동안 변경/인증 제한 |
| 5 | 최대 사용 가능 일수 |
| 6 | 만료 경고 일수 |

`1` 이상이면 비밀번호를 막 만들었어도 인증이 거부될 수 있다.

## 해결

```bash
sudo chage -m 0 -M -1 shine    # 최소 일수 0, 만료 없음
sudo chage -l shine             # 확인
```

`chage -l`이 보여주는 값:

```
Minimum number of days between password change   : 0
Maximum number of days between password change   : -1
```

이제 `su - shine`이 동작한다.

## 우회 (급할 때)

당장 root에서 작업해야 하는데 chage를 만질 시간이 없다면:

```bash
sudo su - shine    # 비밀번호 묻지 않고 전환
```

root는 비밀번호 우회가 되니까 임시 작업에 활용 가능.

## 핵심 정리

passwd 직후 인증 실패면 **비밀번호를 의심하지 말고 `/etc/shadow`의 최소 변경 주기**를 본다. `chage -m 0`으로 해결.

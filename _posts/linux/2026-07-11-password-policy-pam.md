---
title       : "비밀번호 정책과 PAM: 만료·최소 길이·복잡도·계정 잠금 강제하기"
description : "비밀번호를 몇 자 이상·며칠마다·몇 번 틀리면 잠그게 강제하는 법. login.defs와 chage로 만료를, pam_pwquality로 복잡도를, pam_faillock으로 잠금을 거는 흐름과 PAM을 안전하게 건드리는 법(authselect)."
date        : 2026-07-11 16:00:00 +0900
updated     : 2026-07-11 16:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [pam, password, security, chage, faillock]
pin         : false
hidden      : false
---

"비밀번호는 8자 이상, 90일마다 변경, 5번 틀리면 계정 잠금" — 회사 보안 정책에 흔히 나오는 요구입니다. 그런데 리눅스에서 이걸 실제로 강제하려면 한 군데가 아니라 **여러 층**을 건드려야 합니다. 만료는 `login.defs`·`chage`, 복잡도는 PAM의 `pam_pwquality`, 잠금은 `pam_faillock` — 서로 다른 곳에 흩어져 있습니다.

이 글은 그 층들을 한 장에 정리합니다. 그리고 이 영역의 진짜 위험 — **PAM 설정을 잘못 건드리면 아무도 로그인 못 하는 사고** — 를 피하는 법까지 다룹니다.

---

## 세 가지가 다른 곳에 있다

먼저 지도를 그리면 나머지가 읽힙니다.

| 정책 | 어디서 | 도구 |
|---|---|---|
| **만료·주기** (며칠마다 변경) | `/etc/login.defs`(신규 기본), 사용자별 `/etc/shadow` | `chage` |
| **복잡도·최소 길이** (몇 자, 어떤 문자) | `/etc/security/pwquality.conf` + PAM `password` 스택 | `pam_pwquality` |
| **계정 잠금** (몇 번 틀리면) | PAM `auth`/`account` 스택 | `pam_faillock` |

만료는 PAM이 아니라 `/etc/shadow`가 담당하고, 복잡도와 잠금이 PAM 영역입니다. 이 구분을 놓치면 "pwquality를 고쳤는데 왜 만료가 안 바뀌지" 같은 혼란에 빠집니다.

---

## PAM이 뭔가 — 30초 정리

**PAM(Pluggable Authentication Modules)**은 "로그인·인증을 어떻게 할지"를 프로그램마다 하드코딩하지 않고, `/etc/pam.d/` 아래 설정 파일로 조립하는 구조입니다. `login`·`sshd`·`sudo`·`su`가 각각 인증을 직접 구현하지 않고 PAM에게 위임합니다.

`/etc/pam.d/`의 각 줄은 이렇게 생겼습니다:

```
# 타입        제어플래그    모듈                    인자
password    requisite    pam_pwquality.so        retry=3
auth        required     pam_faillock.so         preauth deny=5
```

- **타입 4가지**: `auth`(신원 확인) · `account`(계정이 유효한가) · `password`(비밀번호 변경 규칙) · `session`(로그인 전후 처리)
- **제어 플래그**: `required`(실패해도 끝까지 진행 후 거부) · `requisite`(즉시 거부) · `sufficient`(성공하면 통과) · `optional`

복잡도는 `password` 타입, 잠금은 `auth`/`account` 타입에 걸립니다. 우리가 만질 건 이 두 가지입니다.

> **RHEL/Rocky에서는 `/etc/pam.d/system-auth`를 손으로 고치지 마세요.** 이 파일은 `authselect`가 관리하는 생성물이라, 직접 편집하면 다음 업데이트나 `authselect` 실행 때 덮어써집니다. 아래에서 `authselect`로 거는 법을 씁니다. Ubuntu/Debian은 `/etc/pam.d/common-*`을 `pam-auth-update`가 관리합니다.
{: .prompt-warning }

---

## 만료·주기 — login.defs와 chage

`/etc/login.defs`는 **앞으로 만들 계정**의 기본 만료 정책을 정합니다:

```bash
# /etc/login.defs
PASS_MAX_DAYS   90     # 최대 사용 일수 (이후 변경 강제)
PASS_MIN_DAYS   0      # 최소 변경 주기 (사용자가 다시 바꿀 수 있는 시점)
PASS_WARN_AGE   7      # 만료 며칠 전부터 경고
```

> `login.defs`는 **이미 존재하는 계정에는 소급 적용되지 않습니다.** 기존 계정은 `chage`로 개별 변경해야 합니다. `PASS_MIN_DAYS`는 비밀번호를 다시 **변경할 수 있는 시점**을 제한하며, 현재 비밀번호로 인증할 수 있는지는 제한하지 않습니다.
{: .prompt-warning }

기존 사용자에게 만료 정책을 거는 건 `chage`:

```bash
sudo chage -M 90 -m 0 -W 7 zero    # 최대 90일, 최소 0일, 7일 전 경고
sudo chage -E 2026-12-31 zero      # 계정 만료일(퇴사 예정자 등)
sudo chage -d 0 zero               # 다음 로그인 때 비밀번호 강제 변경
sudo chage -l zero                 # 현재 설정 확인
```

`chage -d 0`은 신규 계정을 넘길 때 특히 유용합니다 — 관리자가 임시 비밀번호를 걸어두고, 사용자가 첫 로그인에서 반드시 자기 비밀번호로 바꾸게 만듭니다.

---

## 복잡도·최소 길이 — pam_pwquality

최소 길이와 문자 종류 강제는 `/etc/security/pwquality.conf`에서 정합니다:

```bash
# /etc/security/pwquality.conf
minlen = 12        # 최소 길이 (아래 credit과 합산되는 점수 개념)
dcredit = -1       # 숫자 최소 1개 (음수 = "최소 N개 필수")
ucredit = -1       # 대문자 최소 1개
lcredit = -1       # 소문자 최소 1개
ocredit = -1       # 특수문자 최소 1개
minclass = 3       # 문자 '종류' 최소 3가지
maxrepeat = 3      # 같은 문자 연속 최대 3회
dictcheck = 1      # 사전 단어 검사
```

> **credit 값의 부호가 헷갈리는 지점입니다.** 음수(`dcredit = -1`)는 "숫자를 **최소 1개 요구**"라는 뜻이고, 양수는 "그 문자를 쓰면 minlen 점수를 **깎아준다(크레딧)**"는 반대 의미입니다. 정책 강제가 목적이면 거의 항상 **음수**를 씁니다.
{: .prompt-tip }

`pwquality.conf`만 고치면 되는 이유는, 요즘 배포판의 PAM `password` 스택에 `pam_pwquality.so`가 이미 이 파일을 읽도록 연결돼 있기 때문입니다. 확인:

```bash
grep pwquality /etc/pam.d/system-auth        # RHEL/Rocky
grep pwquality /etc/pam.d/common-password     # Debian/Ubuntu
# password requisite pam_pwquality.so retry=3
```

옛 자료의 `pam_cracklib`은 `pam_pwquality`로 대체됐습니다. 새로 설정한다면 `pwquality`를 씁니다. 규칙이 걸렸는지 테스트는 일반 사용자로 `passwd`를 실행해 약한 비밀번호가 거부되는지 보면 됩니다(**root는 규칙을 건너뛸 수 있으니 반드시 일반 계정으로**).

---

## 계정 잠금 — pam_faillock

비밀번호를 여러 번 틀리면 잠그는 건 `pam_faillock`(RHEL8+·현행 배포판 표준, 과거 `pam_tally2` 대체)입니다.

**Rocky/RHEL — authselect로 켜기(권장):**

```bash
sudo authselect enable-feature with-faillock
sudo authselect apply-changes
```

동작 파라미터는 `/etc/security/faillock.conf`:

```bash
# /etc/security/faillock.conf
deny = 5              # 5회 실패 시 잠금
unlock_time = 900     # 900초(15분) 후 자동 해제
fail_interval = 900   # 실패 카운트 집계 구간
```

**잠금 확인·해제:**

```bash
sudo faillock                    # 사용자별 실패 기록 조회
sudo faillock --user zero --reset # 특정 사용자 잠금 해제
```

Ubuntu/Debian은 `/etc/pam.d/common-auth`에 `pam_faillock` 줄을 넣거나 `pam-auth-update`로 관리합니다. `unlock_time`을 아주 크게 잡으면 실질적으로 관리자만 풀 수 있는 영구 잠금이 되니, 자동 해제 시간과 운영 부담을 저울질해서 정합니다.

---

## PAM을 안전하게 건드리는 법

이 영역에서 가장 중요한 원칙입니다. PAM `auth`/`account` 스택을 잘못 만지면 **root를 포함해 아무도 로그인·su·sudo를 못 하는** 상태가 될 수 있습니다.

- **작업용 root 세션을 하나 열어둔 채로** 다른 터미널에서 테스트합니다. 새 세션 로그인이 막혀도 열린 세션으로 되돌릴 수 있습니다.
- RHEL/Rocky는 손편집 대신 **`authselect`**, Ubuntu는 **`pam-auth-update`**를 씁니다. 생성 도구를 거치면 문법 오류·덮어쓰기 사고를 피합니다.
- 원상복구 대비: `authselect`는 `authselect apply-changes` 전에 백업을 남기고, `pam-auth-update`도 되돌릴 수 있습니다.

---

## 대중성·대안

- `chage`/`login.defs` — 만료 정책의 리눅스 표준. 대안 없음.
- `pam_pwquality` — 복잡도의 현행 표준(구 `pam_cracklib` 대체). 거의 모든 배포판 기본.
- `pam_faillock` — 잠금의 현행 표준(구 `pam_tally2` 대체). RHEL8+·최신 Debian.
- `authselect`(RHEL8+) / `pam-auth-update`(Debian) — PAM을 손편집하지 않고 관리하는 정공법. **직접 편집보다 항상 이쪽을 권장.**
- 규모가 커지면 — 개별 서버마다 정책을 거는 대신 **중앙 정책**(FreeIPA·LDAP + SSSD)으로 올라갑니다. 여러 서버·계정을 한곳에서 만료·복잡도까지 관리하는 다음 단계.

결론: 만료는 `chage`/`login.defs`, 복잡도는 `pwquality.conf`, 잠금은 `faillock.conf`로 나눠 걸고, PAM 스택 자체는 손대는 대신 `authselect`/`pam-auth-update`로 관리하세요. 그리고 무엇을 테스트하든 **root 세션 하나는 열어둔 채로**.

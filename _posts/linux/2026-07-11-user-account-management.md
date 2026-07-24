---
title       : "리눅스 사용자·그룹 관리: useradd, usermod, sudo, /etc/passwd·shadow"
description : "계정을 만들고(useradd) 고치고(usermod) 지우고(userdel), 그룹·sudo 권한을 붙이는 표준 흐름. /etc/passwd·shadow·group 파일이 실제로 무엇을 담는지, Debian과 RHEL의 adduser 차이까지."
date        : 2026-07-11 11:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [user, group, sudo, useradd, permissions]
pin         : false
hidden      : false
---

서버에 새 팀원 계정을 만들고, 배포용 서비스 계정을 파고, 누구에게 `sudo`를 줄지 정하는 일 — 리눅스를 운영하면 반드시 마주칩니다. 그런데 명령이 `useradd`인지 `adduser`인지, 왜 어떤 계정은 로그인이 되고 어떤 건 안 되는지, 그룹에 넣었는데 왜 바로 안 먹히는지에서 자주 막힙니다.

이 글은 계정을 **만들고(create) 고치고(modify) 지우는(delete)** 표준 도구와, 그 뒤에 있는 파일(`/etc/passwd` · `/etc/shadow` · `/etc/group`)을 함께 정리합니다.

---

## 계정은 결국 세 파일이다

명령을 배우기 전에, 사용자 계정이 어디에 저장되는지부터 잡아야 나머지가 다 읽힙니다. 계정 하나는 세 파일에 나뉘어 기록됩니다.

| 파일 | 담는 것 | 권한 |
|---|---|---|
| `/etc/passwd` | 사용자명·UID·GID·홈·로그인 셸 (비밀번호는 여기 없음) | 누구나 읽기 |
| `/etc/shadow` | 해시된 비밀번호와 만료 정책 | root만 읽기 |
| `/etc/group` | 그룹명·GID·소속 멤버 | 누구나 읽기 |

`/etc/passwd` 한 줄은 이렇게 생겼습니다:

```bash
grep zero /etc/passwd
# zero:x:1000:1000:Zero:/home/zero:/bin/bash
#  │   │  │    │    │      │          └ 로그인 셸
#  │   │  │    │    │      └ 홈 디렉토리
#  │   │  │    │    └ GECOS (설명/실명)
#  │   │  │    └ 주 그룹 GID
#  │   │  └ UID
#  │   └ 비밀번호 자리 (x = shadow에 있음)
#  └ 사용자명
```

두 번째 필드의 `x`가 핵심입니다. 옛날엔 여기에 해시가 직접 들어갔지만, 누구나 읽는 파일이라 위험해서 지금은 `x`로 두고 실제 해시는 root만 읽는 `/etc/shadow`로 뺐습니다.

```bash
sudo grep zero /etc/shadow
# zero:$6$xyz...:20559:0:99999:7:::
#          └ $6$ = SHA-512 해시 (비었으면 로그인 불가, ! 나 * 면 잠김)
```

`/etc/shadow`의 날짜·주기 컬럼은 비밀번호 변경·만료 정책을 담습니다. 만든 계정의 인증이 거부되면 [passwd 직후 su 인증 점검 순서](/posts/linux/2026-06-07-rocky-linux-chage-su-authentication-failure/)에서 PAM 로그, 잠금, 만료와 접근 정책을 구분해 확인하세요.

> **파일을 직접 편집하지 마세요.** `/etc/passwd`·`/etc/shadow`를 `vim`으로 여는 대신 항상 아래 명령을 씁니다. 꼭 손봐야 하면 `vipw`(passwd) / `vipw -s`(shadow) — 편집 중 잠금을 걸고 문법을 검사해 줍니다.
{: .prompt-warning }

---

## `useradd` — 계정 만들기

```bash
sudo useradd -m -s /bin/bash -c "Zero" zero   # 계정 생성
sudo passwd zero                               # 비밀번호 설정 (별도 단계)
```

`useradd`는 비밀번호를 **설정하지 않습니다.** 그래서 `passwd`로 따로 걸어줘야 로그인이 됩니다. 이걸 빼먹으면 `/etc/shadow`의 비밀번호 자리가 `!`(잠김) 상태라 로그인이 안 됩니다.

**자주 쓰는 옵션:**

| 옵션 | 의미 |
|---|---|
| `-m` | 홈 디렉토리 생성 (`/etc/skel` 템플릿 복사). **RHEL은 기본, Debian의 `useradd`는 이게 없으면 홈이 안 생김** |
| `-s /bin/bash` | 로그인 셸 지정. 서비스 계정은 `-s /usr/sbin/nologin`으로 로그인 차단 |
| `-c "설명"` | GECOS 필드 (실명·용도) |
| `-G docker,wheel` | **보조 그룹** 여러 개 한 번에 |
| `-g GROUP` | 주 그룹 지정 (기본은 유저명과 같은 그룹 새로 생성) |
| `-u 1500` | UID 직접 지정 |
| `-r` | 시스템 계정(UID를 1000 미만 대역에서, 홈 생성 안 함) — 데몬·서비스용 |

**서비스 계정**은 사람이 로그인할 일이 없으니 셸을 막습니다:

```bash
sudo useradd -r -s /usr/sbin/nologin -c "App runner" appsvc
```

### UID 1000의 경계

`id` 명령으로 방금 만든 계정을 보면:

```bash
id zero
# uid=1000(zero) gid=1000(zero) groups=1000(zero),27(sudo)
```

관례상 **UID 1000 미만은 시스템·데몬 계정**(root=0), **1000 이상이 일반 로그인 사용자**입니다. 이 경계값은 `/etc/login.defs`의 `UID_MIN`/`UID_MAX`, 새 홈의 기본 파일은 `/etc/skel`, 기본 셸·만료 정책은 `/etc/default/useradd`에서 정해집니다. 새 계정의 "기본값"이 궁금하면 이 세 파일을 봅니다.

### `adduser` vs `useradd` — 배포판마다 다르다

가장 흔한 혼란입니다.

- **Debian/Ubuntu**: `adduser`는 대화형 Perl 래퍼로, 홈 생성·비밀번호 설정·기본 그룹까지 한 번에 물어봅니다. **사람이 손으로 만들 땐 `adduser`가 편합니다.** 저수준 `useradd`는 스크립트·자동화용.
- **RHEL/Rocky**: `adduser`는 그냥 `useradd`로 가는 심볼릭 링크입니다. 대화형이 아닙니다.

그래서 스크립트에는 어디서나 동일하게 동작하는 `useradd`를, Debian 계열에서 손으로 만들 땐 `adduser`를 쓰는 게 안전합니다.

---

## `usermod` — 계정 고치기

만든 계정의 그룹·셸·홈·이름을 바꿉니다.

```bash
sudo usermod -aG docker zero      # docker 그룹에 '추가' (-a 필수!)
sudo usermod -s /bin/zsh zero     # 로그인 셸 변경
sudo usermod -L zero              # 계정 잠금 (로그인 차단)
sudo usermod -U zero              # 잠금 해제
sudo usermod -l newname oldname   # 사용자명 변경 (홈은 안 바뀜)
sudo usermod -d /home/new -m zero # 홈 이동 (-m 이 기존 파일까지 옮김)
```

> **`-a` 없는 `-G`는 지뢰입니다.** `usermod -G docker zero`는 zero의 보조 그룹을 **docker 하나로 덮어씁니다** — `sudo`·`wheel` 같은 기존 그룹이 다 날아가 sudo 권한을 잃습니다. 그룹에 **추가**할 땐 반드시 `-aG`(append). `-G`만 쓰는 건 "이 목록으로 통째로 교체"할 때뿐입니다.
{: .prompt-warning }

### 그룹 변경은 재로그인해야 먹힌다

`usermod -aG`로 그룹에 넣었는데 `docker` 명령이 여전히 권한 거부가 나는 흔한 함정 — **그룹 소속은 로그인 시점에 셸에 박히기 때문**입니다. 이미 열린 세션에는 반영되지 않습니다.

```bash
newgrp docker    # 현재 셸에서 즉시 새 그룹 적용 (재로그인 대신)
# 또는 로그아웃 후 다시 로그인
```

`id`로 실제 반영 여부를 확인하고, 안 보이면 세션을 새로 엽니다.

---

## 그룹 관리

```bash
sudo groupadd deploy           # 그룹 생성
sudo groupmod -n release deploy # 이름 변경
sudo groupdel deploy           # 삭제
sudo gpasswd -a zero deploy    # 멤버 추가 (usermod -aG 와 같은 효과)
sudo gpasswd -d zero deploy    # 멤버 제거
getent group deploy            # 그룹 멤버 확인 (/etc/group + LDAP 등 통합 조회)
```

멤버를 뺄 때는 `usermod`에 마땅한 옵션이 없어서 `gpasswd -d`를 씁니다. 조회는 `grep`보다 `getent`가 정확합니다 — 로컬 파일뿐 아니라 LDAP·NIS 같은 외부 소스까지 함께 봅니다.

---

## `userdel` — 계정 지우기

```bash
sudo userdel zero        # 계정만 삭제 (홈·메일은 남김)
sudo userdel -r zero     # 홈 디렉토리·메일 스풀까지 삭제
```

> 지우려는 계정이 돌리던 프로세스가 남아 있으면 `userdel: user zero is currently used by process`로 거부됩니다. 프로세스를 먼저 정리해야 합니다 — [프로세스 찾고 종료하기](/posts/linux/2026-06-16-process-find-and-kill/)의 `pkill -u zero`로 해당 유저 프로세스를 한 번에 끕니다. 또한 이 계정이 소유했던 파일이 시스템 곳곳에 UID만 남아 떠돌 수 있으니(`find / -uid 1000`), 실제 운영에선 삭제보다 **잠금(`usermod -L`)**을 선호하기도 합니다.
{: .prompt-tip }

---

## sudo 권한 부여

새 계정에 관리자 권한을 주는 가장 간단한 방법은 **관리자 그룹에 추가**하는 것입니다. 배포판마다 그룹 이름이 다릅니다:

```bash
sudo usermod -aG sudo zero     # Debian/Ubuntu
sudo usermod -aG wheel zero    # RHEL/Rocky/Fedora
```

이러면 사실상 root 전권이 갑니다. 특정 명령만 허용하는 최소 권한 방식(`/etc/sudoers.d/`), `su`와 `sudo`의 차이, `wheel` 그룹이 왜 그 이름인지 등 권한 상승의 원리는 [sudo·su·wheel 권한 다루기](/posts/linux/2026-07-11-sudo-su-wheel/)에서 따로 정리했습니다.

---

## 대중성·대안

- `useradd`/`usermod`/`userdel`/`passwd`/`chage` — **shadow-utils** 패키지. 리눅스 표준, 어느 배포판에나 있습니다. 이걸 벗어날 이유는 거의 없습니다.
- `adduser`/`deluser` — Debian 계열의 대화형 편의 래퍼. **손으로 만들 땐 이게 더 편하고**, 자동화엔 `useradd`.
- **systemd-homed** (`homectl`) — 계정을 `/etc/passwd`가 아니라 암호화된 홈 디렉토리에 자체 완결로 담는 새 방식. 랩톱·이동형 계정용으로 설계됐고 아직 서버 주류는 아닙니다. 전통적 `useradd` 흐름이 여전히 사실상 표준.
- 중앙 인증(여러 서버 계정을 한곳에서) — **LDAP/FreeIPA/SSSD**. 서버가 여러 대로 늘면 각 머신에 `useradd`하는 대신 이쪽으로 갑니다. 규모가 커질 때의 다음 단계.

결론: 단일 서버라면 `useradd -m -s`로 만들고 → `passwd`로 비밀번호 걸고 → `usermod -aG`로 그룹·sudo 붙이는 흐름이면 충분합니다. 그룹 추가엔 항상 `-a`를, sudoers 편집엔 항상 `visudo`를 기억하세요.

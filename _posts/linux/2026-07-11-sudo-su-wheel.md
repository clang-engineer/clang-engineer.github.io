---
title       : "su vs sudo, 그리고 wheel 그룹 — 리눅스 권한 상승 제대로 이해하기"
description : "su는 대상 계정의 비밀번호를, sudo는 내 비밀번호를 묻는다 — 이 차이에서 감사 로그·최소 권한·wheel 그룹까지 권한 상승(privilege escalation)의 원리와 sudoers·visudo 실무를 정리합니다."
date        : 2026-07-11 12:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [sudo, su, wheel, sudoers, permissions, security]
pin         : false
hidden      : false
---

리눅스에서 관리 작업을 하려면 결국 root 권한이 필요합니다. 그런데 그 권한을 얻는 길이 `su`와 `sudo` 두 갈래로 갈리고, 어느 쪽을 왜 쓰는지, `sudo -i`와 `sudo -s`가 뭐가 다른지, `wheel` 그룹은 왜 하필 "바퀴"인지에서 대부분 흐릿하게 넘어갑니다.

이 글은 계정을 그룹에 넣는 법이 아니라(그건 [사용자·그룹 관리 글](/posts/linux/2026-07-11-user-account-management/)에서 다뤘습니다), **`su`와 `sudo`가 실제로 어떻게 동작하는지** — 무슨 비밀번호를 묻고, 무엇을 로그로 남기고, sudoers 문법이 어떻게 최소 권한을 표현하는지 — 를 정리합니다.

---

## `su` — 다른 계정으로 갈아타기

`su`(substitute user)는 현재 셸에서 **다른 사용자로 전환**합니다. 대상을 안 적으면 root입니다.

```bash
su            # root로 전환 (root의 비밀번호를 물음)
su -          # root로 전환 + 로그인 셸 (환경까지 갈아탐)
su zero       # zero로 전환
su - zero     # zero로 전환 + 로그인 셸
```

핵심은 **`su`는 전환하려는 대상 계정의 비밀번호를 묻는다**는 점입니다. `su`로 root가 되려면 root의 비밀번호를 알아야 합니다. 그래서 여러 사람이 서버를 관리하면 root 비밀번호를 공유하게 되고, 누가 무엇을 했는지 추적이 안 됩니다 — 뒤에서 볼 `sudo`가 나온 이유가 이것입니다.

### `su`와 `su -`의 차이 — 로그인 셸

`-`(또는 `-l`, `--login`) 하나가 붙고 안 붙고에서 환경이 완전히 달라집니다.

| | `su zero` | `su - zero` |
|---|---|---|
| 셸 종류 | 비로그인 셸 | **로그인 셸** |
| `HOME` | 원래 유저 그대로 | zero의 홈으로 변경 |
| `PATH` | 원래 값 유지 (root의 `sbin`이 없을 수 있음) | zero의 로그인 프로파일로 재설정 |
| 작업 디렉토리 | 그 자리 그대로 | zero의 홈으로 이동 |
| 프로파일 로드 | 안 함 | `~/.bash_profile` 등 로드 |

```bash
su                    # root지만 PATH·HOME은 원래 유저 것
echo $PATH            # /usr/sbin 이 없어서 일부 관리 명령이 안 잡힘
which useradd         # command not found 가 날 수 있음

su -                  # root의 완전한 환경
echo $PATH            # /usr/sbin, /sbin 포함 — 관리 명령 정상
```

> **root로 전환할 땐 거의 항상 `su -`를 쓰세요.** 그냥 `su`는 원래 유저의 `PATH`를 물려받아 `/sbin`·`/usr/sbin`의 관리 명령(`useradd`·`ip`·`shutdown` 등)이 "command not found"로 안 잡히는 함정에 빠집니다. `-`가 있어야 root의 진짜 로그인 환경이 됩니다.
{: .prompt-warning }

> `passwd` 직후 `su - user`가 "Authentication failure"로 거부된다면 메시지만으로 원인을 단정하지 마세요. [비밀번호 직후 su 인증 실패 글](/posts/linux/2026-06-07-rocky-linux-chage-su-authentication-failure/)의 순서대로 PAM 로그, 계정 잠금, 만료, 접근 정책과 로그인 셸을 확인합니다.
{: .prompt-tip }

---

## `sudo` — 명령 하나만, 내 비밀번호로

`sudo`(superuser do)는 `su`와 근본이 다릅니다.

```bash
sudo useradd -m zero      # 이 명령 하나만 root 권한으로 실행
sudo -u deploy ls /srv    # deploy 유저로 실행 (root가 아님)
```

**`sudo`는 대상 계정이 아니라 나 자신의 비밀번호를 묻습니다.** root의 비밀번호를 몰라도 됩니다 — sudoers에 내가 등록돼 있으면, 내 비밀번호로 인증하고 딱 그 명령만 상승된 권한으로 돌립니다.

### `su`와 `sudo`의 근본 차이

| | `su -` | `sudo <cmd>` |
|---|---|---|
| 묻는 비밀번호 | **대상 계정(root)의 것** | **내 자신의 것** |
| 권한 범위 | 셸 전체가 root (계속 root) | 명령 하나만 상승, 끝나면 복귀 |
| 감사 로그 | 전환 사실 정도만 | **누가·언제·어떤 명령**을 실행했는지 남음 |
| root 비밀번호 | 알아야 함 (공유 위험) | 몰라도 됨 (설정 안 하면 잠가둘 수도) |
| 최소 권한 | 불가 (전부 아니면 전무) | 명령 단위로 세밀하게 제어 |

이 차이가 실무에서 `sudo`를 표준으로 만든 이유입니다. 여러 관리자가 각자 자기 비밀번호로 인증하고, 무슨 명령을 돌렸는지 로그에 남으니 root 비밀번호를 공유할 필요도, 사고 후 추적을 포기할 일도 없습니다.

### 감사 로그가 실제로 남는 곳

`sudo` 사용은 인증 로그에 기록됩니다. 위치가 배포판마다 다릅니다:

```bash
sudo tail /var/log/auth.log     # Debian/Ubuntu
sudo tail /var/log/secure       # RHEL/Rocky/Fedora
```

```
sudo:  zero : TTY=pts/0 ; PWD=/home/zero ; USER=root ; COMMAND=/usr/sbin/useradd -m app
```

누가(`zero`), 어디서(`TTY`/`PWD`), 누구로(`USER=root`), 무슨 명령을 돌렸는지 한 줄에 다 남습니다. `su`로 root 셸에 들어가 버리면 그 뒤 명령들은 전부 "root가 했다"로만 뭉뚱그려져 이 추적이 사라집니다.

---

## `sudo -i` vs `sudo -s` vs `sudo su -`

한 번의 명령이 아니라 **root 셸 자체가 필요할 때** 세 가지 방법이 헷갈립니다.

```bash
sudo -i        # root의 로그인 셸 (su - 와 거의 동일한 환경)
sudo -s        # root 셸이지만 내 환경(HOME·PATH) 상당 부분 유지
sudo su -      # 권장 안 함 — sudo로 su를 부르는 중복
```

| | `sudo -i` | `sudo -s` |
|---|---|---|
| 셸 종류 | **로그인 셸** | 비로그인 셸 |
| `HOME` | `/root` | 내 홈 유지 |
| 프로파일 로드 | root의 것 로드 | 안 함 |
| 인증 | **내 비밀번호** | **내 비밀번호** |

`su -`와 `sudo -i`는 도착지(root 로그인 셸)가 같지만 **인증이 다릅니다** — `su -`는 root 비밀번호를, `sudo -i`는 내 비밀번호를 묻습니다. root 비밀번호를 아예 안 걸어두는 요즘 서버(클라우드 이미지 등)에서는 `su -`가 애초에 불가능하고 `sudo -i`가 유일한 길입니다.

`sudo su -`는 `sudo`로 `su`를 실행하는 구조라 **동작은 하지만 중복**입니다. `sudo -i` 하나로 끝나는 걸 두 단계로 도는 것이라, 굳이 쓸 이유가 없습니다.

```bash
sudo -u www-data whoami       # 특정 유저로 명령 실행
# www-data
sudo -u deploy -i             # deploy의 로그인 셸로 진입
```

`-u`로 root가 아닌 임의의 유저가 될 수 있습니다. 서비스 계정으로 뭔가를 재현·디버깅할 때 유용합니다.

---

## `wheel` 그룹 — 왜 "바퀴"인가

RHEL·Rocky·Fedora에서 관리자 그룹은 `wheel`입니다. 이름의 유래는 BSD 유닉스로, 미국 속어 **"big wheel"(큰손·실세)**에서 왔습니다 — root가 될 수 있는 "실세들의 그룹"이라는 뜻입니다.

배포판마다 관리자 그룹 이름이 갈립니다:

| 배포판 계열 | 관리자 그룹 | sudoers 기본 설정 |
|---|---|---|
| RHEL / Rocky / Fedora / CentOS | `wheel` | `%wheel ALL=(ALL) ALL` |
| Debian / Ubuntu | `sudo` | `%sudo ALL=(ALL:ALL) ALL` |

그래서 [계정 관리 글](/posts/linux/2026-07-11-user-account-management/)에서 sudo를 줄 때 배포판에 따라 `usermod -aG wheel`과 `usermod -aG sudo`로 갈렸던 것입니다.

### `pam_wheel` — `su`를 wheel 멤버만 허용하기

`wheel`은 원래 sudo 이전부터 있던 개념으로, **`su` 사용 자체를 제한**하는 데 쓰였습니다. `/etc/pam.d/su`에서 `pam_wheel`을 켜면 wheel 그룹에 속한 사람만 `su`로 root가 될 수 있습니다.

```bash
# /etc/pam.d/su 에서 주석 해제
auth  required  pam_wheel.so use_uid
```

이러면 wheel 멤버가 아닌 유저는 root 비밀번호를 알아도 `su`가 거부됩니다. root 전환의 첫 관문을 그룹 소속으로 한 번 더 조이는 방어층입니다. 요즘은 `su`보다 `sudo` 중심으로 관리하지만, root 비밀번호를 걸어두는 환경이라면 여전히 유효한 잠금입니다.

---

## sudoers 문법 — `user host=(runas) commands`

누가 무엇을 sudo로 할 수 있는지는 `/etc/sudoers`에 정의됩니다. 각 규칙의 뼈대는 이렇습니다:

```
사용자   호스트 = (실행대상) 명령
zero    ALL   = (ALL:ALL)  ALL
```

- **사용자**: 대상 유저. 그룹은 `%` 접두 (`%wheel`, `%sudo`)
- **호스트**: 어느 머신에서 유효한지 (단일 서버면 보통 `ALL`)
- **(실행대상)**: 어떤 유저:그룹으로 실행 가능한지. `(ALL:ALL)`이면 아무 유저·그룹으로나
- **명령**: 허용할 명령. `ALL`이면 전부

실전 예시:

```
# 특정 유저에게 전권
zero ALL=(ALL:ALL) ALL

# wheel 그룹 전체에 전권 (그룹은 % 접두)
%wheel ALL=(ALL) ALL

# 최소 권한 — deploy 유저가 비번 없이 특정 서비스만 재시작
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart myapp
```

마지막 예시가 `sudo`의 진가입니다. 배포 계정에게 root 전권을 주는 대신, **`systemctl restart myapp` 딱 하나만, 비밀번호 없이** 허용합니다. CI/CD 스크립트가 다른 위험한 명령은 절대 못 돌리게 최소 권한으로 묶는 표준 패턴입니다.

> 📎 **치트시트** · [linux](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/linux.md#sudo-권한-부여) — sudo 그룹 부여 vs sudoers 최소 권한 명시 빠른 참조 (GitHub)
{: .prompt-tip }

---

## `visudo` — sudoers는 절대 직접 편집하지 않는다

`/etc/sudoers`를 `vim`으로 직접 열면 안 됩니다. **`visudo`를 반드시 써야 합니다.**

```bash
sudo visudo                          # /etc/sudoers 안전하게 편집
sudo visudo -f /etc/sudoers.d/deploy # 드롭인 파일 편집
sudo visudo -c                       # 현재 문법만 검사
```

이유는 하나입니다 — **저장할 때 문법을 검사**합니다. sudoers에 오타가 하나라도 있으면 `sudo` 전체가 파싱 에러로 먹통이 되는데, 그 상태에서는 `sudo`를 못 쓰니 고칠 수도 없는 상황에 갇힙니다. `visudo`는 문법이 틀리면 저장을 거부하고 다시 편집하게 해서 이 사고를 원천 차단합니다.

> **`vim /etc/sudoers`는 서버를 벽돌로 만드는 지름길입니다.** 오타로 문법이 깨진 채 저장하면 그 순간부터 모든 `sudo`가 거부되고, `sudo`가 없으면 그 파일을 고칠 root 권한도 못 얻습니다(root 비번을 안 걸어뒀다면 복구 모드로 부팅해야 합니다). 반드시 `visudo`로만 편집하세요.
{: .prompt-warning }

### `/etc/sudoers.d/` 드롭인 관례

`/etc/sudoers`를 직접 고치는 대신, `/etc/sudoers.d/` 아래에 규칙별 파일을 두는 것이 요즘 관례입니다. 메인 파일 끝의 `@includedir /etc/sudoers.d`가 이 디렉토리를 자동으로 읽어들입니다.

```bash
sudo visudo -f /etc/sudoers.d/deploy
# deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart myapp
```

패키지·역할별로 파일이 나뉘어 관리가 깔끔하고, 하나를 지워도 나머지가 안 깨집니다. 파일명에 `.`이나 `~`가 들어가면 무시되니 주의합니다.

---

## 내 권한 확인과 비밀번호 캐시

```bash
sudo -l          # 내가 가진 sudo 권한 목록 확인
sudo -v          # 비밀번호 타임스탬프 갱신 (명령 실행 없이 캐시만)
sudo -k          # 캐시 즉시 무효화 (다음 sudo에서 다시 비번 물음)
```

`sudo -l`은 "내가 이 서버에서 sudo로 뭘 할 수 있지?"를 그대로 보여줍니다. 최소 권한으로 묶인 계정이 자기가 뭘 허용받았는지 확인할 때 가장 먼저 칠 명령입니다.

### 비밀번호를 한 번만 묻는 이유 — timestamp

`sudo`를 연달아 칠 때 매번 비밀번호를 안 묻는 건, 한 번 인증하면 **타임스탬프를 캐시**하기 때문입니다. 기본 유효 시간은 **15분**이고, `sudoers`의 `timestamp_timeout`으로 바꿉니다.

```
# /etc/sudoers (visudo로)
Defaults timestamp_timeout=5     # 5분으로 단축
Defaults timestamp_timeout=0     # 매번 비밀번호 요구 (캐시 끔)
```

공용 서버나 보안이 민감한 환경이면 타임아웃을 줄이거나 `0`으로 꺼서, 자리를 비운 사이 캐시된 권한이 악용되는 창을 좁힙니다.

---

## 보안 관례 — root 로그인 대신 sudo

지금까지의 내용이 하나의 운영 원칙으로 모입니다:

- **root로 직접 로그인하거나 `su`로 상주하지 말고, 필요할 때 `sudo`로 상승합니다.** 누가·언제·무엇을 했는지 감사 로그가 남고, 계정별 비밀번호로 책임이 분리됩니다.
- **최소 권한**: 전권(`ALL`)을 남발하지 말고, 자동화 계정은 sudoers로 필요한 명령만 `NOPASSWD`로 엽니다.
- **SSH에서 root 직접 로그인을 막습니다.** `/etc/ssh/sshd_config`에서:

```bash
PermitRootLogin no       # root SSH 직접 로그인 차단
```

이러면 공격자가 root를 노려도 로그인 지점이 없고, 관리자는 각자 계정으로 들어와 `sudo`로 상승하게 강제됩니다 — 감사와 최소 권한이 구조적으로 지켜집니다.

---

## 대중성·대안

- `sudo` — **압도적 주류**. 거의 모든 리눅스 배포판·macOS·BSD의 사실상 표준 권한 상승 도구. 최소 권한·감사·계정별 책임 분리 때문에 서버 운영의 기본값입니다.
- `su` — 여전히 표준이지만 **root 비밀번호 공유·감사 불가** 때문에 다중 관리자 환경에서는 `sudo`에 자리를 내줬습니다. 단일 개인 서버나 root 셸이 잠깐 필요할 때 쓰는 정도.
- **`doas`** (OpenBSD 유래, `opendoas`) — `sudo`의 경량 대안. 설정이 훨씬 단순하고 공격 표면이 작아 미니멀리스트·개인 서버에서 인기가 오르는 중이지만, 생태계·기능 폭은 `sudo`가 압도적이라 **팀·엔터프라이즈 표준은 여전히 `sudo`**입니다. "설정이 sudoers보다 간단했으면" 싶은 개인 환경이라면 고려할 만합니다.
- **Polkit(`pkexec`)** — GUI·데스크톱에서 세밀한 권한 정책을 다루는 별개 축. 서버 CLI에서 `sudo`를 대체하는 물건은 아닙니다.

결론: 서버라면 root 로그인을 막고(`PermitRootLogin no`), 관리자는 각자 계정으로 들어와 `sudo`로 상승하며, 자동화 계정은 `visudo`로 `/etc/sudoers.d/`에 최소 권한만 여는 흐름이 표준입니다. `su`가 대상의 비번을, `sudo`가 내 비번을 묻는다는 한 가지 차이만 확실히 잡으면 나머지가 다 읽힙니다.

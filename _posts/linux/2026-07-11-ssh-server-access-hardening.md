---
title       : "SSH 서버 접속과 하드닝: 키 인증, sshd_config, 잠기지 않고 문 잠그기"
description : "서버에 어떻게 들어가고(ssh·~/.ssh/config), 키 인증을 어떻게 붙이고, sshd_config로 그 문을 어떻게 잠그는지. 특히 자기 자신이 잠기지 않고 하드닝하는 순서까지."
date        : 2026-07-11 19:00:00 +0900
updated     : 2026-07-11 19:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [ssh, sshd, security, ssh-keygen, hardening]
pin         : false
hidden      : false
---

서버를 운영하면 가장 먼저 하는 일이 "들어가는 것"이고, 가장 중요한 일이 "그 문을 잠그는 것"입니다. 그런데 여기서 두 가지가 자주 어긋납니다 — 키를 넣었는데 왜 자꾸 비밀번호를 물어보는지, 그리고 sshd 설정을 잘못 만졌다가 **자기 자신이 서버에서 영영 잠기는 것**입니다.

이 글은 SSH로 **들어가는 법**(클라이언트·키 인증)과 그 문을 **안전하게 잠그는 법**(`sshd_config` 하드닝)을, 특히 잠기지 않는 순서에 초점을 맞춰 정리합니다.

> 📎 **치트시트** · [ssh](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/ssh.md) — ~/.ssh/config·키 생성·keepalive 빠른 참조 (GitHub)
{: .prompt-tip }

---

## 클라이언트 기본 — 접속과 `~/.ssh/config`

```bash
ssh zero@server.example.com        # 기본 (22번 포트)
ssh -p 2222 zero@server.example.com # 포트가 다르면 -p
```

포트·유저·키를 매번 손으로 치는 대신, 클라이언트 쪽 `~/.ssh/config`에 **Host 별칭**으로 묶어두면 `ssh web` 한 단어로 접속됩니다.

```
# ~/.ssh/config
Host web
    HostName    server.example.com   # 실제 주소
    User        zero                 # 로그인 사용자
    Port        2222                 # 22가 아니면 여기서
    IdentityFile ~/.ssh/id_ed25519   # 이 호스트에 쓸 개인키

Host *
    ServerAliveInterval 60           # 60초마다 keepalive (유휴 끊김 방지)
```

이제 `ssh web`, `scp file web:/tmp/`, `git@web:...`이 전부 이 설정을 따릅니다. `HostName`·`User`·`Port`·`IdentityFile` 네 줄이 사실상 전부입니다.

---

## 키 기반 인증 — 이 글의 핵심

비밀번호 인증은 무차별 대입에 노출되고, 매번 입력해야 합니다. **공개키/개인키 쌍**을 쓰면 서버에 공개키만 심어두고, 접속은 개인키로 자동 인증됩니다.

### 1) 키 생성

```bash
ssh-keygen -t ed25519 -C "zero@laptop"   # ed25519 권장
```

- `-t ed25519` — **ed25519 권장**. 짧고 빠르고 안전합니다. `rsa`는 레거시(굳이 쓰면 `-t rsa -b 4096`).
- `-C "..."` — 주석. 어느 기기의 키인지 나중에 구분하려는 표식일 뿐, 보안과 무관.
- 결과: `~/.ssh/id_ed25519`(개인키, **절대 유출 금지**)와 `~/.ssh/id_ed25519.pub`(공개키, 서버에 심는 것).

생성 중 물어보는 **passphrase**는 개인키 자체를 암호화합니다. 비워도 되지만, 노트북 분실 시를 생각하면 걸어두고 `ssh-agent`로 편의를 챙기는 편이 낫습니다(아래).

### 2) 공개키를 서버에 심기

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub zero@server   # 자동 (권장)
```

`ssh-copy-id`가 없거나 안 되면 수동으로 — 서버의 `~/.ssh/authorized_keys`에 **공개키 한 줄**을 추가합니다.

```bash
# 로컬에서 공개키를 서버 authorized_keys에 이어붙이기
cat ~/.ssh/id_ed25519.pub | ssh zero@server \
  'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

한 서버에 여러 사람/기기의 공개키를 넣을 수 있고, `authorized_keys`는 한 줄에 공개키 하나씩입니다.

---

## 권한 함정 — "키를 넣었는데 왜 비번을 물어보지"

키를 제대로 심었는데도 sshd가 비밀번호를 묻는다면, **1순위 원인은 권한**입니다. sshd는 `~/.ssh`나 `authorized_keys`, 심지어 **홈 디렉토리 자체**가 너무 느슨하면 그 키를 **조용히 무시하고** 다음 인증 방법(비밀번호)으로 넘어갑니다. 에러도 안 냅니다.

```bash
chmod 700 ~/.ssh                  # 700 (rwx------)
chmod 600 ~/.ssh/authorized_keys  # 600 (rw-------)
chmod 700 ~                       # 홈: 그룹/기타 쓰기 불가여야 함
```

| 대상 | 요구 권한 | 이유 |
|---|---|---|
| `~` (홈) | 그룹·기타에 **쓰기 없음** (`755`/`700`) | 남이 홈에 쓸 수 있으면 `~/.ssh`를 바꿔치기할 수 있음 |
| `~/.ssh` | `700` | 본인만 접근 |
| `~/.ssh/authorized_keys` | `600` | 본인만 읽기/쓰기 |

> **왜 조용히 실패하는가.** sshd는 "쓰기 권한이 남에게 있는 키 파일"을 신뢰하지 않도록 설계돼 있습니다. 이건 버그가 아니라 의도입니다. 원인을 정확히 보려면 서버에서 `sudo tail -f /var/log/auth.log`(Debian) 또는 `journalctl -u sshd -f`(RHEL)를 켜두고 접속을 시도하면 `Authentication refused: bad ownership or modes` 같은 로그가 찍힙니다. 클라이언트 쪽은 `ssh -v`로 어떤 키를 시도하는지 볼 수 있습니다.
{: .prompt-warning }

---

## `sshd_config` 하드닝 — 문 잠그기

서버의 `/etc/ssh/sshd_config`를 편집합니다. 아래가 실전에서 가장 효과 큰 항목들입니다.

```bash
# /etc/ssh/sshd_config
PermitRootLogin no          # root 직접 로그인 차단 (sudo로 승격)
PubkeyAuthentication yes    # 키 인증 허용
PasswordAuthentication no   # 비밀번호 인증 끔 (키 전용) — 순서 주의!
Port 2222                   # 기본 22 변경 (스캔 소음 감소용)
AllowUsers zero deploy      # 접속 허용 사용자를 화이트리스트로 제한
# AllowGroups sshusers      # 또는 그룹 단위로
```

| 지시어 | 값 | 효과 |
|---|---|---|
| `PermitRootLogin` | `no` | root로 직접 못 들어옴. 일반 계정 접속 후 [sudo](/posts/linux/2026-07-11-sudo-su-wheel/)로 승격 |
| `PasswordAuthentication` | `no` | 비밀번호 인증 자체를 끔 → 무차별 대입 무력화 |
| `PubkeyAuthentication` | `yes` | 키 인증 사용 (기본값이지만 명시) |
| `Port` | `2222` 등 | 포트 변경. 보안이라기보단 자동 스캔 소음 감소 |
| `AllowUsers`/`AllowGroups` | 사용자·그룹 | 나열된 대상만 접속 허용(그 외 전부 거부) |

`Port` 변경은 "보안" 자체가 아니라 로그 소음을 줄이는 정도임을 알아두세요. 진짜 방어는 `PasswordAuthentication no` + 키 인증입니다.

### 적용은 반드시 문법 검사 먼저

```bash
sudo sshd -t                    # 문법 검사 (틀리면 여기서 잡힘)
sudo systemctl reload sshd      # 무중단 재적용 (기존 세션 유지)
```

`sshd -t`로 먼저 검사하지 않고 `restart`부터 하면, 오타 하나로 sshd가 안 뜨면서 접속이 막힙니다. **항상 `-t` → `reload` 순서.**

> **서비스 이름이 배포판마다 다릅니다.** RHEL/Rocky는 `sshd`, Debian/Ubuntu는 전통적으로 `ssh`입니다(`systemctl reload ssh`). 게다가 최신 Ubuntu(22.10+)는 **소켓 활성화(`ssh.socket`)**를 써서, `Port`를 `sshd_config`가 아니라 `ssh.socket`에서 지정해야 하는 경우가 있습니다. `systemctl status ssh ssh.socket`으로 무엇이 포트를 여는지 먼저 확인하세요.
{: .prompt-warning }

---

## 잠금 방지 — 가장 중요한 규칙

sshd 설정을 만질 때 가장 위험한 실수는, `reload` 후 **접속이 되는지 확인하기도 전에 지금 세션을 닫는 것**입니다. 설정이 틀렸다면 다시는 못 들어옵니다.

**안전한 순서:**

```bash
# 1) 지금 열려 있는 SSH 세션은 그대로 둔다 (닫지 말 것)

# 2) 먼저 키 접속이 되는지 '새 터미널'로 확인
ssh -p 2222 zero@server         # 비번 안 물어보고 바로 들어오면 OK

# 3) 그 다음에 PasswordAuthentication no 로 바꾼다
sudo sshd -t && sudo systemctl reload sshd

# 4) 또 '새 터미널'로 접속 성공 확인
ssh -p 2222 zero@server

# 5) 여기까지 다 되면 그때 원래 세션을 닫는다
```

> **`PasswordAuthentication no`를 켜기 전에 반드시 키 접속을 먼저 검증하세요.** 키가 (권한 함정 등으로) 실제로는 동작하지 않는데 비밀번호까지 꺼버리면, 남은 인증 수단이 없어 **자기 자신이 완전히 잠깁니다**. 클라우드라면 콘솔(시리얼 접속)로 복구할 수 있지만, 물리 서버라면 곤란해집니다. "현재 세션 유지 + 새 터미널 테스트"는 선택이 아니라 필수입니다.
{: .prompt-warning }

---

## 방화벽 연계 — 포트를 바꿨다면

`Port`를 바꾸면 sshd만 바뀌는 게 아니라 **방화벽에서 새 포트를 열어줘야** 접속됩니다. 방화벽이 새 포트를 막고 있으면 위 테스트 자체가 실패합니다.

```bash
# firewalld (RHEL/Rocky)
sudo firewall-cmd --permanent --add-port=2222/tcp && sudo firewall-cmd --reload

# ufw (Debian/Ubuntu)
sudo ufw allow 2222/tcp
```

방화벽 규칙을 새 포트로 옮기고 나서 **옛 22번을 닫기 전에도** 새 포트 접속이 되는지 먼저 확인하세요(잠금 방지와 같은 원리). 규칙 상세는 [firewalld·ufw 기초](/posts/linux/2026-07-11-firewalld-ufw-basics/)에서 다룹니다.

---

## 무차별 대입 대응 — 로그로 확인하고 막기

비밀번호 인증을 껐어도, 공개된 서버라면 로그인 시도는 끊이지 않습니다. 실패 기록으로 실태를 봅니다.

```bash
sudo lastb                       # 실패한 로그인 시도 (btmp 기반)
sudo grep "Failed password" /var/log/auth.log   # Debian
sudo journalctl -u sshd | grep -i fail          # RHEL
```

`lastb`·`auth.log`가 무엇을 담는지, `last`/`lastlog`와 어떻게 다른지는 [로그인 기록: utmp·wtmp·btmp](/posts/linux/2026-07-11-login-records-utmp-wtmp/)에서 정리했습니다.

대응책으로는 **fail2ban**이 사실상 표준입니다 — 로그를 감시하다 특정 횟수 이상 실패한 IP를 방화벽에서 일시 차단합니다. 키 전용(`PasswordAuthentication no`)으로 이미 비밀번호 대입은 무력화되지만, 로그 소음과 연결 부하를 줄이는 데 유용합니다(대안 섹션 참고).

---

## ssh-agent — passphrase를 한 번만

개인키에 passphrase를 걸면 접속마다 물어봐서 번거롭습니다. `ssh-agent`가 세션 동안 복호화된 키를 메모리에 물고 있어, 한 번만 입력하면 됩니다.

```bash
eval "$(ssh-agent -s)"       # 에이전트 시작
ssh-add ~/.ssh/id_ed25519    # 키 등록 (passphrase 1회 입력)
```

**에이전트 포워딩**(`ssh -A`)은 A 서버를 거쳐 B 서버로 갈 때 로컬 키를 빌려주는 기능이지만, 경유 서버가 신뢰할 수 없으면 키가 노출될 위험이 있어 함부로 켜지 않습니다. 필요하면 `-A` 대신 `ProxyJump`(`ssh -J`)를 우선 검토하세요.

---

## 대중성·대안

- **OpenSSH** (`ssh`/`sshd`/`ssh-keygen`/`ssh-copy-id`) — 리눅스·macOS·BSD·Windows 모두에서 **사실상 유일한 표준**. 벗어날 이유가 없습니다.
- **ed25519 vs rsa** — 신규 키는 ed25519가 정답(짧고 빠르고 안전). rsa는 아주 오래된 시스템 호환용 레거시.
- **fail2ban** — 로그 기반 IP 차단의 주류. 대안으로 `sshguard`, 클라우드라면 아예 **보안 그룹/방화벽에서 SSH 포트를 특정 IP로만 제한**하는 편이 더 근본적입니다.
- **Teleport / Boundary** 같은 접속 브로커 — 서버가 수십 대 이상, 감사·단기 인증서 발급이 필요한 규모에서의 다음 단계. 단일 서버엔 과합니다.

결론: **ed25519 키 생성 → `ssh-copy-id`로 심고 → 권한(700/600) 확인 → `sshd_config`에서 `PermitRootLogin no`·`PasswordAuthentication no`·`AllowUsers`** 순서면 단일 서버 하드닝은 충분합니다. 무엇을 바꾸든 **현재 세션을 열어둔 채 새 터미널로 먼저 접속 테스트** — 이 한 가지가 자기 자신을 잠그지 않게 지켜줍니다.

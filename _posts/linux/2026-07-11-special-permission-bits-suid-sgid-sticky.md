---
title       : "특수 권한 비트: SUID, SGID, Sticky Bit — passwd는 왜 root로 실행되나"
description : "일반 사용자가 자기 비밀번호를 바꿀 수 있는 이유(SUID), 공유 디렉토리의 그룹이 유지되는 이유(SGID), /tmp에서 남의 파일을 못 지우는 이유(sticky bit). rwx 너머의 세 비트를 chmod로 다루고 보안 관점으로 점검하는 법."
date        : 2026-07-11 17:00:00 +0900
updated     : 2026-07-11 17:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [permissions, suid, sgid, sticky-bit, security]
pin         : false
hidden      : false
---

`ls -l /usr/bin/passwd`을 보면 권한 자리에 `x`가 아니라 `s`가 있습니다. 일반 사용자인 내가 실행하는데도 `passwd`는 root만 쓸 수 있는 `/etc/shadow`를 고칩니다. 어떻게 가능할까요? 답은 기본 `rwx` 너머에 있는 **특수 권한 비트 세 개** — SUID·SGID·Sticky bit — 입니다.

이 글은 기본 권한을 짧게 복습한 뒤, 이 세 비트가 각각 무엇을 하고 언제 쓰며 보안상 무엇을 조심해야 하는지 정리합니다.

---

## 기본 rwx 30초 복습

특수 비트를 이해하려면 기본 권한의 숫자 표기가 손에 있어야 합니다.

```bash
ls -l script.sh
# -rwxr-xr--  1 zero staff  ...
#  │└┬┘└┬┘└┬┘
#  │ 소유자 그룹 기타
#  파일 타입
```

- `r=4` · `w=2` · `x=1`, 소유자·그룹·기타 3자리로 `chmod 754` 처럼 표기합니다.
- `chmod u+x`, `chmod g-w` 같은 기호 표기도 같은 대상을 가리킵니다.

특수 비트는 이 세 자리 **앞에 한 자리가 더 붙는** 형태입니다 — `chmod 4755`의 맨 앞 `4`가 그것입니다.

| 특수 비트 | 8진수 | 붙는 위치 |
|---|---|---|
| SUID | `4` | 소유자 실행 자리 (`s`) |
| SGID | `2` | 그룹 실행 자리 (`s`) |
| Sticky | `1` | 기타 실행 자리 (`t`) |

---

## SUID — 실행하는 동안 파일 소유자의 권한을 빌린다

SUID(Set User ID)가 붙은 **실행 파일**은, 실행하는 사람이 누구든 **파일 소유자의 권한으로** 동작합니다.

```bash
ls -l /usr/bin/passwd
# -rwsr-xr-x 1 root root ... /usr/bin/passwd
#     ^ 소유자 실행 자리가 x 가 아니라 s
```

`passwd`의 소유자는 root이고 SUID가 걸려 있습니다. 그래서 일반 사용자가 실행해도 실행되는 순간 root 권한을 얻어 `/etc/shadow`를 고칠 수 있는 겁니다. 이게 없으면 사용자는 자기 비밀번호조차 못 바꿉니다.

**설정·확인:**

```bash
sudo chmod u+s myprogram      # SUID 부여 (기호)
sudo chmod 4755 myprogram     # 동일 (8진수, 앞자리 4)
ls -l myprogram               # -rwsr-xr-x 확인
```

실행 권한(`x`)이 없는데 SUID를 걸면 소문자 `s`가 아니라 **대문자 `S`**로 표시됩니다 — "설정은 됐지만 실행 비트가 없어 무의미"하다는 신호입니다.

> **SUID는 가장 흔한 권한 상승(privilege escalation) 통로입니다.** 소유자가 root인 SUID 실행 파일에 버그가 있으면 공격자가 root를 탈취할 수 있습니다. 그래서 **직접 만든 스크립트·바이너리에 SUID를 함부로 걸면 안 됩니다.** 특히 셸 스크립트는 대부분의 리눅스에서 SUID가 아예 무시되니(보안상 의도된 동작), "스크립트에 SUID 걸었는데 왜 안 되지"는 버그가 아니라 설계입니다. 권한이 필요하면 SUID 대신 [sudo](/posts/linux/2026-07-11-sudo-su-wheel/)로 명령 단위 허용을 쓰세요.
{: .prompt-warning }

---

## SGID — 그룹 권한을 빌리거나, 디렉토리 그룹을 물려준다

SGID(Set Group ID)는 대상이 **파일이냐 디렉토리냐**에 따라 동작이 갈립니다.

**실행 파일에 걸면** — SUID의 그룹 버전. 실행하는 동안 파일의 **그룹** 권한을 얻습니다.

**디렉토리에 걸면 (이쪽이 실무에서 훨씬 유용)** — 그 디렉토리 안에 새로 만드는 파일이 만든 사람의 주 그룹이 아니라 **디렉토리의 그룹을 물려받습니다.**

```bash
sudo chgrp developers /srv/shared    # 디렉토리 그룹을 developers로
sudo chmod g+s /srv/shared           # SGID 부여
sudo chmod 2775 /srv/shared          # 동일 (앞자리 2)
ls -ld /srv/shared
# drwxrwsr-x ... developers ...
#      ^ 그룹 실행 자리가 s
```

이제 `/srv/shared` 안에서 누가 파일을 만들든 그룹이 자동으로 `developers`가 됩니다. **여러 사람이 공유하는 작업 디렉토리**에서 "내가 만든 파일을 동료가 못 읽는다"는 문제를 근본적으로 없애는 표준 패턴입니다. 그룹 자체를 만들고 사람을 넣는 법은 [사용자·그룹 관리](/posts/linux/2026-07-11-user-account-management/)를 보세요.

---

## Sticky Bit — 내 것만 지울 수 있는 공유 디렉토리

Sticky bit이 걸린 **디렉토리** 안에서는, 파일을 지우거나 이름을 바꾸는 걸 **그 파일의 소유자(와 root)만** 할 수 있습니다 — 디렉토리에 쓰기 권한이 있어도 남의 파일은 못 건드립니다.

대표 예가 `/tmp`입니다:

```bash
ls -ld /tmp
# drwxrwxrwt ... /tmp
#         ^ 기타 실행 자리가 x 가 아니라 t
```

`/tmp`는 모두가 쓸 수 있어야(rwxrwxrwx) 하지만, sticky bit이 없으면 아무나 남의 임시 파일을 지울 수 있습니다. sticky bit이 "쓰기는 되지만 삭제는 자기 것만"으로 그 구멍을 막습니다.

```bash
sudo chmod +t /srv/dropbox     # sticky 부여 (기호)
sudo chmod 1777 /srv/dropbox   # 동일 (앞자리 1)
```

실행 권한이 없는 채로 sticky만 걸면 SUID와 마찬가지로 대문자 `T`로 표시됩니다.

---

## 보안 점검 — SUID/SGID 파일 감사

SUID·SGID 바이너리는 공격 표면이라, 시스템에 어떤 것들이 있는지 주기적으로 파악해 두는 게 좋습니다.

```bash
# SUID 걸린 파일 전부 찾기
sudo find / -perm -4000 -type f 2>/dev/null

# SGID 걸린 파일 전부
sudo find / -perm -2000 -type f 2>/dev/null

# 둘 중 하나라도 걸린 것 (SUID 또는 SGID)
sudo find / -perm /6000 -type f 2>/dev/null
```

정상 시스템에도 `passwd`·`sudo`·`ping`·`mount` 등 SUID 바이너리가 여럿 있습니다. **평소 목록을 저장해 두고** 나중과 비교해, 낯선 SUID 파일(특히 홈 디렉토리나 `/tmp`의)이 새로 생겼다면 침해 신호로 의심합니다.

```bash
sudo find / -perm -4000 -type f 2>/dev/null > /root/suid-baseline.txt   # 기준 저장
# 나중에: diff 로 변화 확인
```

---

## 대중성·대안

- SUID/SGID/sticky bit — POSIX 표준 권한 모델의 일부. 모든 유닉스 계열에 존재하고, 대안이랄 게 없는 기본기입니다.
- **SUID 대신 고려할 것** — 권한이 필요한 커스텀 작업은 SUID 바이너리를 만드는 대신 거의 항상 [sudo](/posts/linux/2026-07-11-sudo-su-wheel/)로 명령을 한정해 허용하는 게 안전합니다. 리눅스라면 **capabilities**(`setcap cap_net_bind_service=+ep`처럼 "root 전권" 대신 필요한 능력만 부여)가 더 정교한 대안입니다 — 예: 웹서버가 80 포트를 열려고 root로 뜰 필요 없이 그 능력만 받습니다.
- SGID 디렉토리 — 공유 작업 공간의 표준. ACL(`setfacl`)로 더 세밀하게 갈 수도 있지만, "그룹 상속"만 필요하면 SGID가 가장 간단합니다.

결론: `4=SUID / 2=SGID / 1=sticky`를 기본 3자리 앞에 붙인다고 기억하세요. SUID는 소유자 권한을, SGID는 그룹(또는 디렉토리 그룹 상속)을, sticky는 공유 디렉토리의 삭제 보호를 담당합니다. 그리고 직접 만든 것에 SUID를 거는 대신 sudo나 capabilities를 먼저 떠올리세요.

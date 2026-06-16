---
title       : "vim-dadbod + PostgreSQL .pgpass 인증 (Windows)"
description : "Windows의 pgpass.conf 경로, user 자동 fallback, JDBC URL 미지원 등 vim-dadbod로 PostgreSQL 붙일 때의 함정 다섯 가지"
date        : 2026-05-06 12:00:00 +0900
updated     : 2026-05-06 12:00:00 +0900
categories  : [lazyvim, "Dadbod"]
tags        : [vim-dadbod, postgresql, windows, troubleshooting]
pin         : false
hidden      : false
---

LazyVim의 `lang.sql` extra(= `vim-dadbod` + `vim-dadbod-ui`)로 PostgreSQL을 붙일 때 일반 가이드에 잘 안 나오는 함정 다섯 개.

## 1. Windows에서 `.pgpass`는 `~/.pgpass`가 아니다

| OS | psql이 읽는 파일 |
|----|------------------|
| Linux/macOS | `~/.pgpass` (chmod 600 필수) |
| **Windows** | `%APPDATA%\postgresql\pgpass.conf` |

다른 OS 가이드 보고 `~/.pgpass`(또는 `%USERPROFILE%\.pgpass`)에 만들면 psql이 절대 안 읽는다. 퍼미션 600 요구는 Unix 한정.

## 2. libpq는 user를 프롬프트하지 않는다

비밀번호는 입력 콜백이 있어 프롬프트가 뜨지만, **user는 절대 안 물어보고 조용히 fallback**한다:

```
URL의 user → $PGUSER → OS 사용자명
```

dbui에서 URL을 `postgresql://host/db`로 user 빼면 OS 사용자명(`myuser` 등)으로 시도되고, 서버에 그 role이 없으면 `FATAL: role "myuser" does not exist`로 실패한다. → **URL에 user는 항상 박는다.**

```lua
-- nvim/lua/config/options/dbui.lua
vim.g.dbs = {
  { name = "docker pg",  url = "postgres://appuser@localhost:5432/appdb" },
  { name = "remote pg",  url = "postgresql://dbuser@10.0.0.10:5432/db?connect_timeout=5" },
}
```

## 3. `.pgpass` 매칭 키는 `host:port:db:user` 4필드

URL의 user가 그대로 매칭 키로 들어간다. 비번만 채우고 user 자리를 placeholder로 두면 매칭 실패 → 매번 비번 프롬프트:

```ini
# pgpass.conf — user 필드도 정확히 일치해야 함
localhost:5432:appdb:appuser:your_password
10.0.0.10:5432:db:dbuser:your_password
```

user 자리에 `*` 와일드카드도 가능하지만, 그러면 host:port:db에 비번이 하나로 통일된다.

## 4. vim-dadbod은 JDBC URL을 모른다

```
jdbc:postgresql://host/db   →  E605: no adapter for jdbc
```

JDBC 접두어를 떼고 dadbod 어댑터 스킴으로 써야 한다(`postgres://`, `postgresql://`, `mysql://` 등). **H2는 어댑터 자체가 없어** dadbod 대신 H2 Web Console / IntelliJ Database 툴 사용.

## 5. 원격 DB는 `?connect_timeout=5`

libpq 기본 timeout이 매우 길어 VPN 끊긴 상태에서 사이드바 펼치면 nvim이 수십 초 멈칫한다. URL에 `?connect_timeout=5`로 fail-fast.

## 결론

- **URL에 user 박고, 비번은 `pgpass.conf`로 분리**
- **Windows 경로는 `%APPDATA%\postgresql\pgpass.conf`** (절대 `~/.pgpass` 아님)
- **JDBC URL은 안 됨** — 접두어 떼기

## 참고

- libpq pgpass: <https://www.postgresql.org/docs/current/libpq-pgpass.html>
- vim-dadbod: <https://github.com/tpope/vim-dadbod>
- vim-dadbod-ui: <https://github.com/kristijanhusak/vim-dadbod-ui>

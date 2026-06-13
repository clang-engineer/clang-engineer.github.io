---
title       : SSH Broken Pipe Error 해결 방법
description : >-
  SSH 세션이 idle 시간 후 끊겨 Broken Pipe가 나는 원인과 클라이언트·서버 양쪽 keepalive 설정
date        : 2024-03-21 16:55:20 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [shell, "SSH·원격"]
tags        : [ssh]
pin         : false
hidden      : false
---

## 원인

서버(또는 중간 NAT/방화벽)는 일정 시간 트래픽이 없는 TCP 연결을 끊는다. 이걸 idle timeout이라 하고, 이미 끊긴 소켓에 클라이언트가 뭔가를 쓰려 하면 `Broken Pipe` 에러가 난다.

특히 회사 방화벽이나 클라우드 NAT 게이트웨이는 대개 5~15분 idle이면 끊는다.

## 해결 — 클라이언트 측

`~/.ssh/config`에 keepalive 신호를 주기적으로 보내도록 설정한다.

```sshconfig
Host *
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

| 옵션 | 의미 |
|---|---|
| `ServerAliveInterval` | 서버에 keepalive를 보내는 간격(초) |
| `ServerAliveCountMax` | 응답 없는 keepalive를 몇 번까지 참고 끊을지 |

위 설정이면 60초마다 신호를 보내고 3번 연속 응답이 없으면 끊는다(= 약 3분 후 종료). 방화벽 idle 임계보다 짧게 잡는 게 핵심.

## 해결 — 서버 측

서버에서 모든 클라이언트에 일괄 적용하려면 `sshd_config`에 설정한다.

```sshconfig
# /etc/ssh/sshd_config
ClientAliveInterval 60
ClientAliveCountMax 3
```

이름은 반대지만 의미는 똑같다. 서버가 클라이언트로 60초마다 신호를 보낸다.

## `TCPKeepAlive`와의 차이

`TCPKeepAlive yes`도 비슷해 보이지만 TCP 레이어 신호라 NAT 일부는 무시한다. `ServerAliveInterval`은 SSH 레벨 메시지를 보내므로 NAT/방화벽이 활동으로 인식한다. 이게 더 안전.

## 그래도 끊기는 경로라면

긴 세션이 자주 필요하면:

- `tmux`/`screen`으로 세션을 서버에 띄워두고 클라이언트는 attach/detach만 (끊겨도 작업 보존)
- `mosh`는 UDP 기반이라 connection drop에 강함

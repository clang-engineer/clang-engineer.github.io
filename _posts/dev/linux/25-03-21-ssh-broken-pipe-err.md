---
title       : SSH Broken Pipe Error 해결 방법
description : >-
  SSH를 통한 작업 중 발생하는 Broken Pipe 에러 해결 방법을 정리해보았습니다.
date        : 2024-03-21 16:55:20 +0900
updated     : 2024-03-21 16:58:25 +0900
categories  : [dev, linux]
tags        : [ssh, broken-pipe, error, network]
pin         : false
hidden      : false
---


## 원인
- 서버는 일정 시간동안 클라이언트로부터 요청이 없으면 연결(소켓)을 끊습니다. 이를 `Idle Timeout` 이라고 하고, 이렇게 연결이 끊어지면 클라이언트는 `Broken Pipe` 에러를 발생시킵니다.

## 해결 방법
- 위 문제를 해결하기 위해서는 서버와의 연결이 끊어지지 않도록 설정을 변경해야 합니다.
- `~/.ssh/config` 파일에 아래와 같이 설정을 추가합니다.

```sh
# ~/.ssh/config
Host *
  ServerAliveInterval 60
```

- SSH 클라이언트가 서버에게 주기적인 신호를 보내어 연결이 활성 상태인지 확인하도록 설정합니다.
- 설정된 간격(초)마다 클라이언트는 서버에게 "ServerAlive" 메시지를 보냅니다.
- 서버는 이 메시지를 수신하고 클라이언트에게 응답을 보내어 연결이 여전히 활성 상태임을 알려주게 됩니다.

# 참조
- [https://may0301.tistory.com/10](https://may0301.tistory.com/10)
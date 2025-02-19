---
layout  : wiki
title   : SSH Broken Pipe 
summary : 
date    : 2024-03-21 16:55:20 +0900
updated : 2024-03-21 16:58:25 +0900
tags    : 
toc     : true
public  : true
parent  : [[issue/index]]
latex   : false
---
* TOC
{:toc}


# 문제
- 터미널에서 ssh로 서버 연결후 서버로 작업중 또는 scp로 파일을 전송 중에 갑자기 연결이 끊어지는 현상이 발생했다.

# 원인
- 서버는 일정 시간동안 클라이언트로부터 요청이 없으면 연결(소켓)을 끊어버린다. 이렇게 서버와의 연결이 끊어지면 클라이언트는 `Broken Pipe` 에러를 발생시킨다.

# 해결
- 위 문제를 해결하기 위해서는 서버와의 연결이 끊어지지 않도록 설정을 변경해야 한다.
- `~/.ssh/config` 파일에 아래와 같이 설정을 추가한다.

```sh
# ~/.ssh/config
Host *
  ServerAliveInterval 60
```

- SSH 클라이언트가 서버에게 주기적인 신호를 보내어 연결이 활성 상태인지 확인한다. (초 단위)
- 설정된 간격(초)마다 클라이언트는 서버에게 "ServerAlive" 메시지를 보낸다.
- 서버는 이 메시지를 수신하고 클라이언트에게 응답을 보내어 연결이 여전히 활성 상태임을 알려주게 된다.

# 참조
- [https://may0301.tistory.com/10](https://may0301.tistory.com/10)
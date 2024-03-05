---
layout  : wiki
title   : Mac에서 Docker 실행시 Operation not permitted 에러 해결법
summary : 
date    : 2023-12-16 19:13:57 +0900
updated : 2023-12-16 19:14:17 +0900
tags    : 
toc     : true
public  : true
parent  : [[docker/index]]
latex   : false
---
* TOC
{:toc}

# 문제
- 간헐적으로 docker 실행시 아래와 같은 에러가 발생했다. "Operation not permitted"라는 문구를 보곤 권한 문제인가 싶어서 여러 방법을 시도해봤지만 해결되지 않았다. (sudo, chmod, chown 등)
```bash
Caused by: java.io.FileNotFoundException: central-config/localhost-config/application.yml (Operation not permitted)
```

# 해결
- 원인은 macOS의 시스템 설정에서 "Files and Folders"에 대한 docker의 권한이 없어서 발생한 문제였다.
- 아래와 같이 설정을 변경하고 재부팅하면 해결된다.
- System Preferences > Privacy & Security > Files and Folders > Docker > Desktop Folder 체크


# 참고
[https://stackoverflow.com/questions/58482352/operation-not-permitted-from-docker-container-logged-as-root](https://stackoverflow.com/questions/58482352/operation-not-permitted-from-docker-container-logged-as-root)
---
layout  : wiki
title   : nGrinder 먹통 이슈 
summary : 
date    : 2024-01-18 10:15:10 +0900
updated : 2024-01-18 10:20:42 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}

# 개요
```txt
// 컨트롤러
ERROR FileEntryRepository.java:192 : Error while fetching files from SVN for admin 

// 에이전트
agent controller: Waiting for agent controller server signal
```

- nGrinder 최신버전(3.5.8) 다운로드 받고 컨트롤러 실행, 에이전트 실행까지는 완료.
script를 만들기 위해 컨트롤러에서 script 항목을 클릭하면 컨트롤러 쪽에 위와 같은 에러 로그가 찍히면서 먹통.


# 해결
- nGrinder 사용자 설정 폴더를 완전히 삭제했다가 다시 실행하니 해결됨.
- nGrinder 사용자 설정 폴더 위치는 아래와 같다.
    - Windows: C:\Users\{사용자}\.ngrinder
    - Mac: /Users/{사용자}/.ngrinder

    
# 출처
> [https://github.com/naver/ngrinder/discussions/968](https://github.com/naver/ngrinder/discussions/968)

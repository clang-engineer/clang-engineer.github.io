---
layout  : wiki
title   : LeetCode CLI 
summary : 
date    : 2025-02-02 11:48:56 +0900
updated : 2025-02-02 11:48:56 +0900
tags    : 
toc     : true
public  : true
parent  : [[etc/index]]
latex   : false
---
* TOC
{:toc}

# LeetCode CLI
- leetcode의 문제를 터미널에서 풀 수 있는 cli 도구 사용법을 정리해보고자 합니다.
(vim, tmux, zsh 등을 사용하는 경우 터미널에서 바로 문제를 풀 수 있어서 편리합니다.)

# 설치
```bash
# node lts 18.0 이상 버전에서 테스트하였습니다. 
$ npm install -g leetcode-cli 
```

# 로그인
- leetcode user -l 명령어를 사용하여 로그인을 진행합니다.
```bash
$ leetcode user -l
> Input your username: [username]
> Input your password: [password]
```

> 위 과정에서 로그인 되지 않는다면, ~/.lc/leetcode/user.json 파일을 직접 수정하여 로그인 정보를 입력할 수 있습니다. (브라우저에서 로그인 후 쿠키를 직접 복사하여 입력)

# 문제풀기
- leetcode show <id> 명령어를 사용하여 문제를 확인할 수 있습니다.
- leetcode show <id> -g -l <language> 명령어를 사용하여 문제를 풀기 위한 파일을 생성할 수 있습니다.  // -g: 파일 생성, -l: 언어 지정, -x: 문제 설명을 파일에 추가
- leetcode show -c <id> 명령어를 사용하여 코드 템플릿을 확인할 수 있습니다.
- leetcode show -q eL : easy + unlocked 문제 중 임의 문제를 확인할 수 있습니다.
- leetcode test <id> 명령어를 사용하여 테스트 케이스를 실행할 수 있습니다.
- leetcode submit <id> 명령어를 사용하여 제출할 수 있습니다.
- leetcode submit <id> -f <file> 명령어를 사용하여 파일을 지정하여 제출할 수 있습니다.
- leetcode submit <id> -f <file> -l <language> 명령어를 사용하여 언어를 지정하여 제출할 수 있습니다.
- leetcode submit <id> -f <file> -l <language> -m <message> 명령어를 사용하여 메시지를 지정하여 제출할 수 있습니다.

# 기타 명령어
## 도움말
- leetcode -h 명령어를 사용하여 도움말을 확인할 수 있습니다.

## Cache
- leetcode cache 명령어를 사용하여 캐시된 문제 목록을 확인할 수 있습니다.
- 캐시된 문제는 ~/.lc/leetcode/cache.json 파일에 저장됩니다.
- leetcode cache <id> 명령어를 사용하여 문제를 캐시된 문제를 불러올 수 있습니다.
- leetcode cache -d <id> 명령어를 사용하여 캐시된 문제를 삭제할 수 있습니다.

## Config
- leetcode config 명령어를 사용하여 설정을 변경할 수 있습니다.
- 설정을 변경하면 ~/.lc/leetcode/config.json 파일에 저장됩니다.
- leetcode config <key> : 설정값을 확인합니다.
- leetcode config <key> <value> : 설정값을 변경합니다.
- leetcode config -d <key> : 설정값을 삭제합니다.

```bash
# 색상 설정 변경 (true: 색상 사용, false: 색상 미사용)
$ leetcode config color:enable false
```

## List
- leetcode list 명령어를 사용하여 문제 목록을 확인할 수 있습니다.
- leetcode list -q <query> 명령어를 사용하여 검색어를 이용하여 문제를 검색할 수 있습니다. // emhdls -> easy, medium, hard, done, locked, starred
- leetcode list -t <tag> 명령어를 사용하여 태그를 이용하여 문제를 검색할 수 있습니다. // algorithm, database, shell

## Plugin
- leetcode plugin 명령어를 사용하여 플러그인을 관리할 수 있습니다.
- leetcode plugin -i <plugin> 명령어를 사용하여 플러그인을 설치할 수 있습니다.

## Session
- leetcode session 명령어를 사용하여 세션을 관리할 수 있습니다.

## Star
- leetcode star <id> 명령어를 사용하여 문제를 즐겨찾기할 수 있습니다.
- leetcode star -d <id> 명령어를 사용하여 즐겨찾기한 문제를 삭제할 수 있습니다.


## Stat
- leetcode stat 명령어를 사용하여 통계를 확인할 수 있습니다.


# 참고
- [leetcode-cli](https://github.com/skygragon/leetcode-cli)
- [doc](https://github.com/skygragon/leetcode-cli/blob/master/docs/commands.md)
---
layout: post
title: "LeetCode CLI 사용법"
date: 2025-02-12 11:48:56 +0900
categories: [dev, tools]
tags: [leetcode, cli, algorithm, coding-test]
summary: "터미널에서 LeetCode 문제를 풀 수 있는 CLI 도구 사용법"
---

LeetCode의 문제를 터미널에서 풀 수 있는 CLI 도구 사용법을 정리합니다. vim, tmux, zsh 등을 사용하는 경우 터미널에서 바로 문제를 풀 수 있어서 편리합니다.

## 설치

```bash
# node lts 18.0 이상 버전에서 테스트하였습니다. 
$ npm install -g leetcode-cli 
```

## 로그인

leetcode user -l 명령어를 사용하여 로그인을 진행합니다.

```bash
$ leetcode user -l
> Input your username: [username]
> Input your password: [password]
```

> 위 과정에서 로그인 되지 않는다면, `~/.lc/leetcode/user.json` 파일을 직접 수정하여 로그인 정보를 입력할 수 있습니다. (브라우저에서 로그인 후 쿠키를 직접 복사하여 입력)

## 문제 풀기

- `leetcode show <id>` - 문제 확인
- `leetcode show <id> -g -l <language>` - 문제 파일 생성 (`-g`: 파일 생성, `-l`: 언어 지정, `-x`: 문제 설명을 파일에 추가)
- `leetcode show -c <id>` - 코드 템플릿 확인
- `leetcode show -q eL` - easy + unlocked 문제 중 임의 문제 확인
- `leetcode test <id>` - 테스트 케이스 실행
- `leetcode submit <id>` - 제출
- `leetcode submit <id> -f <file>` - 파일 지정하여 제출
- `leetcode submit <id> -f <file> -l <language>` - 언어 지정하여 제출
- `leetcode submit <id> -f <file> -l <language> -m <message>` - 메시지 지정하여 제출

## 기타 명령어

### 도움말

```bash
$ leetcode -h
```

### Cache

캐시된 문제 관리:

- `leetcode cache` - 캐시된 문제 목록 확인
- `leetcode cache <id>` - 캐시된 문제 불러오기
- `leetcode cache -d <id>` - 캐시된 문제 삭제

캐시된 문제는 `~/.lc/leetcode/cache.json` 파일에 저장됩니다.

### Config

설정 변경:

- `leetcode config` - 설정 확인
- `leetcode config <key>` - 설정값 확인
- `leetcode config <key> <value>` - 설정값 변경
- `leetcode config -d <key>` - 설정값 삭제

설정은 `~/.lc/leetcode/config.json` 파일에 저장됩니다.

```bash
# 색상 설정 변경 (true: 색상 사용, false: 색상 미사용)
$ leetcode config color:enable false
```

### List

문제 목록 확인:

- `leetcode list` - 문제 목록 확인
- `leetcode list -q <query>` - 검색어로 문제 검색 (emhdls → easy, medium, hard, done, locked, starred)
- `leetcode list -t <tag>` - 태그로 문제 검색 (algorithm, database, shell)

### Plugin

플러그인 관리:

- `leetcode plugin` - 플러그인 관리
- `leetcode plugin -i <plugin>` - 플러그인 설치

### Session

세션 관리:

```bash
$ leetcode session
```

### Star

즐겨찾기 관리:

- `leetcode star <id>` - 문제 즐겨찾기
- `leetcode star -d <id>` - 즐겨찾기 삭제

### Stat

통계 확인:

```bash
$ leetcode stat
```

## 참고

- [leetcode-cli GitHub](https://github.com/skygragon/leetcode-cli)
- [Commands Documentation](https://github.com/skygragon/leetcode-cli/blob/master/docs/commands.md)

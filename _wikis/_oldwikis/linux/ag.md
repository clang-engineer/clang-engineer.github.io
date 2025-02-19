---
layout  : wiki
title   : Ag 사용법
summary : 
date    : 2023-06-19 17:02:00 +0900
updated : 2023-06-19 17:02:23 +0900
tags    : 
toc     : true
public  : true
parent  : [linux/index]
latex   : false
---
* TOC
{:toc}

# Ag 사용법

## 설치

```sh
sudo apt install silversearcher-ag
```

## 사용법

```sh
ag [OPTION]... PATTERN [PATH]
```

## 예제

```sh
ag -i "hello world" .
```

## 주요 옵션

| 옵션 | 설명 |
| --- | --- |
| -i | 대소문자 구분 안함 |
| -w | 단어 단위로 검색 |
| -Q | 정규식 사용 안함 |
| -C | 검색 결과 앞뒤로 2줄씩 출력 |
| -A | 검색 결과 뒤로 2줄씩 출력 |
| -B | 검색 결과 앞으로 2줄씩 출력 |
| -G | 파일 이름으로 검색 |
| -g | 파일 이름으로 검색 |
| -l | 파일 이름만 출력 |
| -L | 파일 이름만 출력 |

## Ag vs Ack vs Grep

| | Ag | Ack | Grep |
| --- | --- | --- | --- |
| 속도 | 3~5배 빠름 | 2~3배 빠름 | 느림 |
| 정규식 | PCRE | Perl | POSIX |
| 기본 옵션 | -i, -w, -Q | -i, -w, -Q | -i, -w |
| 파일 이름 검색 | -G, -g | -G, -g | -r |
| 파일 이름 제외 | -L | -L | -r |
| 파일 이름만 출력 | -l | -l | -l |
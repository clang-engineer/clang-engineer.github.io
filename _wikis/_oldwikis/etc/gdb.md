---
layout  : wiki
title   : g++,  GDB 사용법
summary : 
date    : 2022-06-18 13:52:02 +0900
updated : 2022-08-18 09:47:52 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}


# 설치
```sh
# mac
brew install gdb

# linux
sudo apt-get install gdb
```

```sh
gcc –g test.c –o test
gdb test
```

# 사전 준비

- 컴파일시 -g 옵션IW ```sh
g++ -g test.c -o test	// 컴파일
gdb test	// 실행
```

# GDB 실행

```sh
gdb <프로그램명>
```

# 중단점 설정/확인/해제

## break : 중단점 설정

```sh
break <함수이름>
break <라인번호>
break <파일이름:라인번호>
break <파일이름:함수이름>
break <...> if <condition>	// 조건에 맞는 경우 중단점 설정
```

## info break :	중단점 확인

```sh
info break
info b
i b
```

## clear : 특정 중단점 삭제

```sh
clear <함수이름>
clear <라인번호>
clear <파일이름:라인번호>
clear <파일이름:함수이름>
```

## delete : 모든 중단점 삭제

```sh
delete	// 설정된 모든 중단점 삭제
delete <breakpoint 번호>	// 번호에 해당하는 중단점 삭제
delete <breakpoint 번호> <breakpoint 번호>	// 번호에 해당하는 모든\ 중단점 삭제
```

## disable / enable : 중단점 활성화/비활성화

```sh
en
enable
enable <breakpoint 번호>
enable <breakpoint 번호> <breakpoint 번호>

dis
disable
disable <breakpoint 번호>
disable <breakpoint 번호> <breakpoint 번호>
```

# 프로세스 실행

## run : 프로세스 실행 또는 재실행

```sh
run
```

## continue : 다음 중단점까지 프로세스 재채
```sh
continue
continue n
```

## next : 실행 중인 프로세스를 한 줄 실행(함수 실행 시 내부로 진입x)

```sh
next
next n
```

## step : 실행 중인 프로세스를 한 줄 실행(함수 실행 시 내부로 진입o)
```sh
step
step n
```

## finish : 현재 함수를 수행하고 빠져나간 후 리턴 값 출력
```sh
finish
```

# Call Stack 확인

## backtrace

```sh
backtrace
bt
bt N
bt -N
bt full
```

# 값 출력/변경

## print : 변수/주소 등을 출력

```sh
print <val>
p <val>
p <func:val>
p *<ptr>
p <addr>
p arr[n]
p -pretty *<구조체>
p/x <val>
```

## display : 매 실행(step, next, continue 등) 마다 출력

```sh
display expr
dsiplay/fmt expr 

info dis
info display

enable display
en dis
en dis <번호>< 번호>

disable display
dis dis
dis dis <번호><번호>
```

# 기타

## return : 현재 함수를 수행하지 않고 빠져나감
```sh
return
return -1
```

## list : 소스 파일을 출력
```sh
list
list 100
list function
list -
list start,end

set listsize count
set listsize unlimited
```

# Reference

> https://jangpd007.tistory.com/54
> https://dining-developer.tistory.com/13

---
layout  : wiki
title   : tmux cheat sheet
summary : 
date    : 2021-11-30 15:56:19 +0900
updated : 2024-03-29 10:20:07 +0900
tags    : 
toc     : true
public  : true
parent  : [[cheat-sheet/index]]
latex   : false
---
* TOC
{:toc}

![cheatsheet](https://github.com/clang-engineer/clang-engineer.github.io/assets/39648594/a0c5a05e-7a05-40ea-bd1a-9afc4ad999f9)
 
# tmux 세션
- tmux는 세션을 생성하여 여러개의 터미널을 관리할 수 있게 해준다.

1. 세션 생성
```bash
tmux
tmux new
tmux new-session
tmux new -s sessionname
```

2. 세션 접속
```bash
tmux a
tmux att
tmux attach
tmux attach-session
tmux a -t sessionname
```

3. 세션 종료
```bash
tmux kill-session
tmux kill-session -t sessionname
```

4. 단축키
- <ctrl+b> + $ : rename session
- <ctrl+b> + d : detach session
- <ctrl+b> + ) : next session
- <ctrl+b> + ( : previous session

# tmux windows
- 브라우저의 탭과 유사한 개념
 
## 기본 단축키
- <ctrl+b> + c : create window
- <ctrl+b> + n : move to next window
- <ctrl+b> + p : move to previous window
- <ctrl+b> + l : move to window last used
- <ctrl+b> + 0..9 : select window by nubmer
- <ctrl+b> + ' : select window by name
- <ctrl+b> + . : change window number
- <ctrl+b> + , : rename window
- <ctrl+b> + f : search windows
- <ctrl+b> + & : kill window
- <ctrl+b> + w : list windows
- <ctrl+b> + z : toggle pane zoom

## merge two window
```sh
// ctrl + b + : 로 tmux 명령 입력창 활성화
// 아래 명령어는 2번 윈도우를 1번 윈도우로 합치는 명령어. 반대로 하는 명령어는 break-pane
// tmux join-pane [-bdhv] [-l size | -p percentage] [-s src-pane] [-t dst-pane]
join-pane -s 2 -t 1 
break-pane -s 1 -t 2
```

# tmux panes
- 윈도우를 여러개의 패널로 나눠서 사용할 수 있다.

## 기본 단축키
- <ctrl+b> + % : vertical split
- <ctrl+b> + " : horizontal split
- <ctrl+b> + <left> : move to pane to the right
- <ctrl+b> + <right> : move to pane to the left
- <ctrl+b> + <up> : move up to pane
- <ctrl+b> + <right> : move down to pane 
- <ctrl+b> + o : go to next pane
- <ctrl+b> + ; : go to last active pane
- <ctrl+b> + } : move pane right 
- <ctrl+b> + { : move pane left 
- <ctrl+b> + ! : convert pane to window 
- <ctrl+b> + x : kill pane
- <ctrl+b> + <ctrl+o> : swap pane

# tmux 복사
## key bindings
- <ctrl+b> + [ : enter copy mode
- <ctrl+b> + ] : paster from buffer

## copy mode commands
- <space> : start selection
- <enter> : copy selection
- <esc> : clear selection
- g : go to top
- G : go to bottom
- h : move cursor left
- j : move cursor down
- k : move cursor up
- l : move cursor right
- / : search
- \# : list paste buffers
- q : quit
 
 

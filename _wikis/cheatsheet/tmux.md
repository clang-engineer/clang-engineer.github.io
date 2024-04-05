---
layout  : wiki
title   : tmux cheat sheet
summary : 
date    : 2021-11-30 15:56:19 +0900
updated : 2024-04-05 11:23:53 +0900
tags    : 
toc     : true
public  : true
parent  : [[cheat-sheet/index]]
latex   : false
---
* TOC
{:toc}

- ![cheatsheet](https://github.com/clang-engineer/clang-engineer.github.io/assets/39648594/a0c5a05e-7a05-40ea-bd1a-9afc4ad999f9)
 
# tmux 세션
- tmux는 세션을 생성하여 여러개의 터미널을 관리할 수 있게 해준다. 하나의 세션은 다른 세션과 독립적으로 동작한다.
- 세션은 여러개의 윈도우로 구성되어 있고, 윈도우는 여러개의 패널로 구성되어 있다. (세션 > 윈도우 > 패널)

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
    ```txt
    <ctrl+b> + $ : rename session
    <ctrl+b> + d : detach session
    <ctrl+b> + ) : next session
    <ctrl+b> + ( : previous session
    <ctrl+b> + w : list session
    ```

# tmux windows
- 브라우저의 탭과 유사한 개념으로서 하나의 세션에 여러개의 윈도우를 생성할 수 있다.
 
- 단축키 
    ```txt
    <ctrl+b> + c : create window
    <ctrl+b> + n : move to next window
    <ctrl+b> + p : move to previous window
    <ctrl+b> + l : move to window last used
    <ctrl+b> + 0..9 : select window by nubmer
    <ctrl+b> + ' : select window by name
    <ctrl+b> + . : change window number
    <ctrl+b> + , : rename window
    <ctrl+b> + f : search windows
    <ctrl+b> + & : kill window
    <ctrl+b> + w : list windows
    <ctrl+b> + z : toggle pane zoom
    ```

- merge two window
```sh
# ctrl + b + : 로 tmux 명령 입력창 활성화
# 아래 명령어는 2번 윈도우를 1번 윈도우로 합치는 명령어. 반대로 하는 명령어는 break-pane
# tmux join-pane [-bdhv] [-l size | -p percentage] [-s src-pane] [-t dst-pane]
join-pane -s 2 -t 1 
break-pane -s 1 -t 2
```

# tmux panes
- 윈도우를 여러개의 패널로 나눠서 사용할 수 있다.

- 단축키

    ```txt
    <ctrl+b> + % : vertical split
    <ctrl+b> + " : horizontal split
    <ctrl+b> + <left> : move to pane to the right
    <ctrl+b> + <right> : move to pane to the left
    <ctrl+b> + <up> : move up to pane
    <ctrl+b> + <right> : move down to pane 
    <ctrl+b> + o : go to next pane
    <ctrl+b> + ; : go to last active pane
    <ctrl+b> + } : move pane right 
    <ctrl+b> + { : move pane left 
    <ctrl+b> + ! : convert pane to window 
    <ctrl+b> + x : kill pane
    <ctrl+b> + <ctrl+o> : swap pane
    ```

# tmux 복사

- 복사모드로 들어가서 복사하고 붙여넣기를 할 수 있다.
    ```txt
    <ctrl+b> + [ : enter copy mode
    <ctrl+b> + ] : paster from buffer
    ```

- 복사모드 단축키
    ```txt
    <space> : start selection
    <enter> : copy selection
    <esc> : clear selection
    g : go to top
    G : go to bottom
    h : move cursor left
    j : move cursor down
    k : move cursor up
    l : move cursor right
    / : search
    \# : list paste buffers
    q : quit
    ```


# tmux 스크롤 하기
- tmux에서 스크롤을 하기 위해서는 복사모드로 들어가야 한다.
 
    ```txt
    <ctrl+b> + [
    ```

## 마우스로 스크롤하기
- 위의 방법은 키보드로 스크롤하는 방법이다. 마우스로 스크롤하기 위해서는 마우스모드를 활성화 해야 한다.
- .tmux.conf 파일에 아래 내용을 추가한다.
 
    ```txt
    set -g mouse on
    ```

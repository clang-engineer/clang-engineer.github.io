---
layout: post
title: "Zsh 명령어 & 단축키 모음"
date: 2025-02-07 10:45:00 +0900
categories: [cheatsheet]
tags: [zsh, shell, terminal, commands]
summary: "Zsh 내장 단축키와 자주 쓰는 명령어"
tool_name: Zsh
tool_icon: fa-solid fa-terminal
quick_commands:
  - "Ctrl+R (히스토리 검색)"
  - "Ctrl+A/E (줄 앞/뒤)"
  - "Alt+. (이전 인자)"
---

## ⌨️ 커서 이동

| 단축키 | 설명 |
|--------|------|
| `Ctrl+A` | 줄 맨 앞으로 |
| `Ctrl+E` | 줄 맨 뒤로 |
| `Alt+F` | 다음 단어로 이동 |
| `Alt+B` | 이전 단어로 이동 |
| `Ctrl+XX` | 줄 앞과 현재 위치 토글 |

## ✂️ 편집

| 단축키 | 설명 |
|--------|------|
| `Ctrl+K` | 커서부터 줄 끝까지 삭제 |
| `Ctrl+U` | 커서부터 줄 앞까지 삭제 |
| `Ctrl+W` | 커서 앞 단어 삭제 |
| `Alt+D` | 커서 뒤 단어 삭제 |
| `Ctrl+Y` | 마지막 삭제 내용 붙여넣기 |
| `Ctrl+_` | 실행 취소 (Undo) |
| `Alt+T` | 단어 순서 바꾸기 |
| `Ctrl+T` | 문자 순서 바꾸기 |

## 🔍 히스토리 & 검색

| 단축키 | 설명 |
|--------|------|
| `Ctrl+R` | 히스토리 역방향 검색 |
| `Ctrl+S` | 히스토리 정방향 검색 |
| `Ctrl+P` | 이전 명령어 |
| `Ctrl+N` | 다음 명령어 |
| `!!` | 마지막 명령어 재실행 |
| `!$` | 마지막 명령어의 마지막 인자 |
| `!*` | 마지막 명령어의 모든 인자 |
| `!<n>` | 히스토리 n번째 명령어 실행 |
| `!<str>` | str로 시작하는 최근 명령어 실행 |
| `^old^new` | 마지막 명령어의 old를 new로 교체 |
| `Alt+.` | 이전 명령어의 마지막 인자 (반복 가능) |

## 🎛️ 프로세스 제어

| 단축키 | 설명 |
|--------|------|
| `Ctrl+C` | 현재 프로세스 종료 |
| `Ctrl+Z` | 현재 프로세스 일시정지 |
| `Ctrl+D` | EOF 전송 (터미널 종료) |
| `Ctrl+L` | 화면 지우기 |
| `fg` | 백그라운드 프로세스를 포그라운드로 |
| `bg` | 일시정지된 프로세스를 백그라운드로 |
| `jobs` | 백그라운드 프로세스 목록 |

## 📜 자동완성 & 확장

| 단축키 | 설명 |
|--------|------|
| `Tab` | 자동완성 |
| `Tab Tab` | 자동완성 목록 표시 |
| `Ctrl+I` | Tab과 동일 |
| `Alt+/` | 경로 확장 |
| `**` + `Tab` | 재귀 디렉터리 자동완성 (예: `ls **/file.txt`) |

## 🌟 Zsh 전용 기능

### Glob 패턴

| 패턴 | 설명 | 예시 |
|------|------|------|
| `**/*.js` | 재귀 검색 | `ls **/*.js` |
| `*.{js,ts}` | 확장자 여러 개 | `rm *.{log,tmp}` |
| `file<1-10>.txt` | 숫자 범위 | `ls file<1-5>.txt` |
| `*.txt~test.txt` | 제외 패턴 | `ls *.txt~backup.txt` |
| `(#i)*.jpg` | 대소문자 무시 | `ls (#i)*.jpg` |

### 디렉터리 스택

| 명령어 | 설명 |
|--------|------|
| `cd -` | 이전 디렉터리로 |
| `dirs -v` | 디렉터리 스택 보기 (번호 포함) |
| `cd ~1` | 스택 1번 디렉터리로 이동 |
| `pushd <dir>` | 디렉터리 스택에 추가하고 이동 |
| `popd` | 스택에서 꺼내고 이동 |

## 🔧 자주 쓰는 명령어

### 파일 & 디렉터리

| 명령어 | 설명 |
|--------|------|
| `ls -la` | 숨김 파일 포함 상세 목록 |
| `ls -lh` | 파일 크기 읽기 쉽게 |
| `ls -lt` | 수정 시간 순 정렬 |
| `cd -` | 이전 디렉터리 |
| `mkdir -p a/b/c` | 경로 전체 생성 |
| `rm -rf <dir>` | 디렉터리 강제 삭제 |
| `cp -r <src> <dst>` | 디렉터리 복사 |
| `mv <old> <new>` | 이동/이름 변경 |
| `ln -s <target> <link>` | 심볼릭 링크 생성 |

### 검색 & 필터

| 명령어 | 설명 |
|--------|------|
| `grep "pattern" file` | 파일에서 패턴 검색 |
| `grep -r "pattern" .` | 디렉터리 재귀 검색 |
| `grep -i "pattern" file` | 대소문자 무시 검색 |
| `find . -name "*.txt"` | 파일명으로 찾기 |
| `find . -type f -mtime -7` | 7일 내 수정된 파일 |

### 프로세스

| 명령어 | 설명 |
|--------|------|
| `ps aux` | 모든 프로세스 목록 |
| `ps aux \| grep <name>` | 특정 프로세스 검색 |
| `kill <pid>` | 프로세스 종료 |
| `kill -9 <pid>` | 강제 종료 |
| `killall <name>` | 이름으로 프로세스 종료 |
| `top` | 프로세스 모니터 (실시간) |
| `htop` | 향상된 프로세스 모니터 |

### 시스템

| 명령어 | 설명 |
|--------|------|
| `df -h` | 디스크 사용량 |
| `du -sh *` | 폴더별 용량 |
| `free -h` | 메모리 사용량 |
| `uname -a` | 시스템 정보 |
| `uptime` | 시스템 가동 시간 |

### 네트워크

| 명령어 | 설명 |
|--------|------|
| `curl <url>` | URL 내용 가져오기 |
| `curl -o <file> <url>` | 다운로드 |
| `wget <url>` | 다운로드 |
| `ping <host>` | 연결 테스트 |
| `netstat -tuln` | 포트 리스닝 확인 |
| `lsof -i :<port>` | 포트 사용 프로세스 확인 |

## 💡 유용한 alias 예시

```bash
# ~/.zshrc에 추가
alias ll='ls -lah'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias h='history'
alias c='clear'
alias tf='tail -f'
alias ports='lsof -i -P -n | grep LISTEN'

# Git
alias g='git'
alias gs='git status -sb'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline --graph'

# Docker
alias d='docker'
alias dc='docker-compose'
alias dps='docker ps'
alias dimg='docker images'

# 빠른 편집
alias zshrc='vim ~/.zshrc'
alias reload='source ~/.zshrc'
```

## 🎨 Oh My Zsh 플러그인 추천

```bash
# ~/.zshrc
plugins=(
  git
  zsh-autosuggestions       # 명령어 자동 제안
  zsh-syntax-highlighting   # 문법 강조
  z                         # 디렉터리 점프
  docker
  kubectl
  extract                   # 압축 파일 자동 해제
)
```

### 플러그인 설치 (Oh My Zsh 사용 시)

```bash
# zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

## 🔑 환경변수

| 명령어 | 설명 |
|--------|------|
| `export VAR=value` | 환경변수 설정 |
| `echo $VAR` | 환경변수 출력 |
| `env` | 모든 환경변수 목록 |
| `export PATH=$PATH:/new/path` | PATH에 경로 추가 |
| `unset VAR` | 환경변수 제거 |

## 💾 입출력 리다이렉션

| 명령어 | 설명 |
|--------|------|
| `cmd > file` | 출력을 파일로 (덮어쓰기) |
| `cmd >> file` | 출력을 파일에 추가 |
| `cmd < file` | 파일을 입력으로 |
| `cmd 2> file` | 에러를 파일로 |
| `cmd &> file` | 출력+에러를 파일로 |
| `cmd1 \| cmd2` | cmd1 출력을 cmd2 입력으로 |
| `cmd > /dev/null` | 출력 버리기 |

## 🧠 자주 쓰는 조합

```bash
# 파일 내용 빠르게 확인
cat file.txt | less

# 용량 큰 폴더 찾기
du -sh * | sort -h

# 포트 사용 프로세스 죽이기
lsof -ti:3000 | xargs kill -9

# 파일 개수 세기
find . -type f | wc -l

# 최근 수정 파일 10개
ls -lt | head -10

# 디렉터리 크기 순 정렬
du -sh * | sort -hr | head -10

# 실시간 로그 모니터링
tail -f /var/log/app.log | grep ERROR
```

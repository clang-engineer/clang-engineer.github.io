---
layout: post
title: "Tmux 명령어 모음"
date: 2025-02-07 10:15:00 +0900
categories: [cheatsheet]
tags: [tmux, terminal, commands]
summary: "Tmux 세션/윈도우/패널 관리 명령어"
tool_name: Tmux
tool_icon: fa-solid fa-terminal
quick_commands:
  - "Ctrl+b c (새 윈도우)"
  - "Ctrl+b % (세로 분할)"
  - "Ctrl+b [ (스크롤 모드)"
---

> **Prefix Key**: `Ctrl+b` (기본 설정 기준)  
> 아래 명령어에서 `Prefix`는 `Ctrl+b`를 의미합니다.

## 🖥️ 세션 관리

| 명령어 | 설명 |
|--------|------|
| `tmux` | 새 세션 시작 |
| `tmux new -s <name>` | 이름 지정하여 세션 생성 |
| `tmux ls` | 세션 목록 |
| `tmux attach -t <name>` | 세션에 다시 연결 |
| `tmux attach` | 마지막 세션에 연결 |
| `tmux kill-session -t <name>` | 세션 종료 |
| `Prefix d` | 세션 detach (나가기) |
| `Prefix s` | 세션 목록 보기 (인터랙티브) |
| `Prefix $` | 현재 세션 이름 변경 |

## 🪟 윈도우 관리

| 명령어 | 설명 |
|--------|------|
| `Prefix c` | 새 윈도우 생성 |
| `Prefix ,` | 윈도우 이름 변경 |
| `Prefix .` | 윈도우 순서 이동 |
| `Prefix n` | 다음 윈도우 |
| `Prefix p` | 이전 윈도우 |
| `Prefix 0-9` | 번호로 윈도우 이동 |
| `Prefix '` | 윈도우 인덱스 직접 입력 |
| `Prefix w` | 윈도우 목록 (인터랙티브) |
| `Prefix f` | 윈도우/패널 이름으로 검색 |
| `Prefix &` | 윈도우 종료 (확인 필요) |
| `Prefix l` | 마지막 윈도우로 이동 |
| `Prefix i` | 윈도우 정보 표시 |

## 📐 패널 관리

| 명령어 | 설명 |
|--------|------|
| `Prefix %` | 세로로 패널 분할 |
| `Prefix "` | 가로로 패널 분할 |
| `Prefix o` | 다음 패널로 이동 |
| `Prefix ;` | 이전 패널로 이동 |
| `Prefix ←↑→↓` | 방향키로 패널 이동 |
| `Prefix Ctrl+←↑→↓` | 패널 크기 조정 |
| `Prefix z` | 패널 확대/축소 토글 |
| `Prefix x` | 패널 종료 (확인 필요) |
| `Prefix !` | 패널을 새 윈도우로 분리 |
| `Prefix q` | 패널 번호 표시 (번호 입력으로 이동) |
| `Prefix {` | 패널 왼쪽으로 이동 |
| `Prefix }` | 패널 오른쪽으로 이동 |
| `Prefix Space` | 패널 레이아웃 순환 |
| `Prefix m` | 현재 패널 마크 토글 |
| `Prefix M` | 설정된 마크 전체 해제 |
| `Prefix E` | 모든 패널을 균등하게 정렬 |
| `Prefix Alt+1` | even-horizontal 레이아웃 |
| `Prefix Alt+2` | even-vertical 레이아웃 |
| `Prefix Alt+3` | main-horizontal 레이아웃 |
| `Prefix Alt+4` | main-vertical 레이아웃 |
| `Prefix Alt+5` | tiled 레이아웃 |
| `Prefix Ctrl+o` | 패널을 순방향으로 회전 |
| `Prefix Alt+o` | 패널을 역방향으로 회전 |
| `Prefix Alt+←↑→↓` | 패널을 5칸씩 크기 조정 |

## 📜 복사 모드 & 스크롤

| 명령어 | 설명 |
|--------|------|
| `Prefix [` | 복사 모드 진입 (스크롤 가능) |
| `Prefix PgUp` | 복사 모드 진입 및 위로 스크롤 |
| `q` | 복사 모드 종료 |
| `Space` | 선택 시작 (Vi 모드) |
| `Enter` | 선택 복사 (Vi 모드) |
| `Prefix ]` | 최근 버퍼 붙여넣기 |
| `Prefix #` | 모든 붙여넣기 버퍼 나열 |
| `Prefix =` | 버퍼 목록에서 선택하여 붙여넣기 |
| `Prefix -` | 가장 최근 버퍼 삭제 |
| `Ctrl+u` / `Ctrl+d` | 반 페이지 위/아래 스크롤 |
| `g` / `G` | 맨 위/아래로 이동 (Vi 모드) |

## 🔧 기타

| 명령어 | 설명 |
|--------|------|
| `Prefix ?` | 키 바인딩 목록 |
| `Prefix /` | 특정 키 바인딩 설명 보기 |
| `Prefix t` | 시계 표시 |
| `Prefix ~` | 최근 메시지 확인 |
| `Prefix :` | 명령어 프롬프트 |
| `Prefix r` | 현재 클라이언트 리프레시 |
| `Prefix Ctrl+z` | tmux 클라이언트 일시 중지 |
| `tmux source-file ~/.tmux.conf` | 설정 파일 리로드 |

## 💡 자주 쓰는 패턴

### 세션 + 윈도우 빠르게 시작
```bash
# 새 세션 "work" 만들고 3개 윈도우 준비
tmux new -s work \; neww \; neww \; selectw -t 0
```

### 패널 4분할 레이아웃
```bash
# 현재 윈도우를 4개 패널로 분할
Prefix %    # 세로 분할
Prefix "    # 가로 분할
Prefix o    # 다음 패널 이동
Prefix "    # 다시 가로 분할
```

### 설정 파일 예시 (`~/.tmux.conf`)
```bash
# Prefix를 Ctrl+a로 변경
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix

# 패널 분할 단축키 직관적으로 변경
bind | split-window -h
bind - split-window -v

# Vi 모드 활성화
setw -g mode-keys vi

# 마우스 지원
set -g mouse on

# 설정 리로드
bind r source-file ~/.tmux.conf \; display "Config reloaded!"

# 윈도우/패널 번호를 1부터 시작
set -g base-index 1
setw -g pane-base-index 1
```

## 🎨 추천 플러그인

- **tmux-resurrect**: 세션 저장/복원
- **tmux-continuum**: 자동 세션 저장
- **tmux-yank**: 클립보드 통합

```bash
# TPM (Tmux Plugin Manager) 설치 후 .tmux.conf에 추가
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'

# Prefix + I 로 플러그인 설치
```

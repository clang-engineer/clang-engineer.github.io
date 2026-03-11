---
title       : 🧷 tmux 유용한 설정 정리 (.tmux.conf 기준)
description : 내 tmux 설정에서 바로 체감되는 옵션만 뽑아 핵심 동작, 패널, 세션 트리, 플러그인까지 한 번에 정리.
date        : 2026-02-21 10:25:00 +0900
updated     : 2026-02-21 10:25:00 +0900
categories  : [dev, tools]
tags        : [tmux, config, tips]
pin         : false
hidden      : false
---

# 🧷 tmux 유용한 설정 정리 (.tmux.conf 기준)

실제로 쓰는 `.tmux.conf`에서 체감이 큰 옵션만 따로 모았다.
목적은 "왜 이 옵션을 두는지"를 잊지 않게 기록하는 것.

---

# 1. 기본 동작

## 1) ESC 지연 제거

```tmux
set -sg escape-time 0
```

Vim/Neovim에서 ESC 반응이 즉각적으로 느껴져서 입력 리듬이 부드럽다.

## 2) True Color 활성화

```tmux
set -g default-terminal "tmux-256color"
set -ga terminal-overrides ",*256col*:Tc"
```

tmux 안에서도 테마 색이 흐려지지 않게 보인다.

## 3) 마우스 활성화

```tmux
set -g mouse on
```

패널 크기 조절이나 스크롤이 바로 가능해서 상황에 따라 편하다.

---

# 2. 패널/키바인딩

## 1) 분할 시 현재 경로 유지

```tmux
bind '"' split-window -v -c "#{pane_current_path}"
bind % split-window -h -c "#{pane_current_path}"
```

분할 후에도 현재 작업 디렉터리를 이어가서 흐름이 끊기지 않는다.

## 2) 패널 정보 표시

```tmux
set -g pane-border-status bottom
set -g pane-border-format " #P #{pane_current_command} "
```

패널 번호와 현재 명령어를 바로 확인할 수 있어 전환이 빠르다.

## 3) 복사 모드 vi 키

```tmux
setw -g mode-keys vi
```

vi 키로 복사 모드를 다루면 손이 덜 헷갈린다.

---

# 3. 세션 트리 정렬

## 1) 이름 기준 정렬

```tmux
bind s choose-tree -Zs -O name
```

세션/윈도우 목록을 이름 기준으로 정렬해서 빠르게 찾는다.

---

# 4. TPM 플러그인 구성

## 1) 플러그인 목록

```tmux
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'christoomey/vim-tmux-navigator'
set -g @plugin 'jimeh/tmux-themepack'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
```

- tmux-sensible: 기본값을 sane default로 정리
- vim-tmux-navigator: Ctrl+h/j/k/l로 vim ↔ tmux 이동
- tmux-themepack: 상태바 테마를 간단히 적용
- tmux-resurrect: 세션/패널 상태 저장 & 복원
- tmux-continuum: 자동 저장/자동 복원

## 2) 테마 선택

```tmux
set -g @themepack 'powerline/default/cyan'
```

## 3) 복원 옵션

```tmux
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'
```

---

# 5. 적용/리로드

## 1) TPM 초기화 (항상 마지막 줄)

```tmux
run '~/.tmux/plugins/tpm/tpm'
```

## 2) 설정 리로드

```bash
tmux source-file ~/.tmux.conf
```

---
title       : 🧷 Tmux 설정 & 플러그인 설명 (Markdown Version)
description : 아래는 TPM(Tmux Plugin Manager)과 함께 사용하는 대표 플러그인들의 설명을 포함한 `.tmux.conf` 설정 예시이다.
date        : 2025-11-17 09:52:39 +0900
updated     : 2025-11-17 09:53:15 +0900
categories  : [dev, tools]
tags        : [tmux, tpm, plugin]
pin         : false
hidden      : false
---

## 📦 TPM (Tmux Plugin Manager)

```sh
set -g @plugin 'tmux-plugins/tpm'
```

### 👉 역할

Tmux 플러그인을 설치, 업데이트, 삭제할 수 있는 **플러그인 관리자**.
tmux 플러그인 생태계를 사용하려면 반드시 필요함.

---

## 📚 플러그인 목록

### 1. `tmux-plugins/tmux-sensible`

```sh
set -g @plugin 'tmux-plugins/tmux-sensible'
```

#### ✔ 역할

tmux의 기본값을 **더 합리적인 설정(sane defaults)** 로 변경해주는 플러그인.
기본 키 설정, 패널 동작, 기타 비직관적 설정들을 개선해 주기 때문에 필수 플러그인으로 널리 사용됨.

---

### 2. `christoomey/vim-tmux-navigator`

```sh
set -g @plugin 'christoomey/vim-tmux-navigator'
```

#### ✔ 역할

Vim/Neovim 패널과 Tmux 패널 사이를 **Ctrl+h/j/k/l** 로 자연스럽게 이동할 수 있게 해줌.

#### ✔ 효과

* Vim 창 ↔ tmux pane 이동이 직관적
* Vim 사용자의 필수 플러그인

---

### 3. `jimeh/tmux-themepack`

```sh
set -g @plugin 'jimeh/tmux-themepack'
set -g @themepack 'powerline/default/cyan'
```

#### ✔ 역할

다양한 **상태바(theme)** 를 제공하는 테마 플러그인.

#### ✔ 효과

* Powerline 스타일 적용 가능
* 색상 조합을 쉽게 변경
* 테마 파일을 직접 수정할 필요 없음

---

### 4. `tmux-plugins/tmux-resurrect`

```sh
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @resurrect-capture-pane-contents 'on'
```

#### ✔ 역할

tmux 세션을 "부활(resurrect)" 시켜주는 플러그인.
저장된 시점의 **세션, 윈도우, 패널 레이아웃, 실행 중 명령** 등을 복원해줌.

#### ✔ 기능

* `prefix + Ctrl-s` → 세션 상태 저장
* `prefix + Ctrl-r` → 세션 복원
* 패널 내용까지 저장하려면 `@resurrect-capture-pane-contents='on'` 필요

---

### 5. `tmux-plugins/tmux-continuum`

```sh
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @continuum-restore 'on'
```

#### ✔ 역할

`tmux-resurrect`를 기반으로 **자동 백업 + 자동 복원** 기능을 제공.

#### ✔ 기능

* 자동 저장 (기본 15분 간격)
* 시스템 재부팅 후 tmux 자동 복원
* 개발 환경 그대로 복구 가능

👉 `tmux-resurrect`의 상위 확장 플러그인

---

## ⚙ 기타 tmux 설정

### 기본 터미널 및 마우스 활성화

```sh
set -g default-terminal "screen-256color"
set -g mouse on
```

#### 설명

* `screen-256color`: 256색을 지원하도록 설정 (테마와 호환성↑)
* `mouse on`: 마우스로 패널 크기 조절, 선택, 스크롤 가능

---

## 🏁 TPM 초기화

```sh
run '~/.tmux/plugins/tpm/tpm'
```

tmux conf 맨 마지막 줄에 위치해야 함.

---

## 🧩 최종 `.tmux.conf` (플러그인 설명 포함)

```tmux
# --- TPM ---
set -g @plugin 'tmux-plugins/tpm'

# --- Plugin list ---
set -g @plugin 'tmux-plugins/tmux-sensible'       # sane tmux defaults
set -g @plugin 'christoomey/vim-tmux-navigator'   # navigate between vim <-> tmux with Ctrl-hjkl
set -g @plugin 'jimeh/tmux-themepack'             # tmux status bar themes
set -g @plugin 'tmux-plugins/tmux-resurrect'      # save & restore tmux sessions
set -g @plugin 'tmux-plugins/tmux-continuum'      # auto-save & auto-restore

# --- Theme config ---
set -g @themepack 'powerline/default/cyan'

# --- Resurrect settings ---
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'

# --- Tmux settings ---
set -g default-terminal "screen-256color"
set -g mouse on

# --- Initialize TPM (must be last) ---
run '~/.tmux/plugins/tpm/tpm'
```

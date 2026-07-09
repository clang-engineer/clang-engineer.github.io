---
title       : 🧩 tmux 플러그인은 어떻게 만드나 — CLI가 곧 API
description : "tmux 플러그인엔 런타임도 SDK도 없다. TPM이 실행하는 .tmux 셸 스크립트가 tmux CLI를 호출하는 게 전부. 진입 스크립트 구조·설정형/상호작용형·hooks·배포까지."
date        : 2026-07-09 10:40:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [plugin, guide]
pin         : false
hidden      : false
---

> 이 글은 **플러그인을 직접 만드는 법**이다. 기존 플러그인을 *쓰는* 법(TPM으로 sensible·resurrect·themepack 설치·설정)은 [tmux 설정 & 플러그인 설명](/posts/tmux/2025-11-17-tmux-tpm/)에, 입문부터 자동화까지 전체 경로는 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)에 있다.
{: .prompt-tip }

## 핵심 한 줄

**tmux 플러그인엔 런타임도 SDK도 없다.** "플러그인"이란 건 사실 **tmux CLI(명령줄)를 대신 호출해 주는 셸 스크립트 + 그걸 담은 git 저장소**일 뿐이다. tmux 자신은 "플러그인"이라는 개념조차 모른다 — 이 생태계는 전부 **TPM**(Tmux Plugin Manager, tmux 플러그인 관리자) 이라는 관례 위에 얹혀 있다.

이 사실을 알면 플러그인 제작이 "새로운 프레임워크 배우기"가 아니라 **`man tmux`의 명령을 셸에서 잘 부리는 것**으로 바뀐다.

## 동작 사슬

`.tmux.conf` 맨 아래 한 줄에서 시작한다.

```bash
run '~/.tmux/plugins/tpm/tpm'
```

이 줄이 TPM을 부트스트랩하고, 그다음은 이렇게 흐른다.

```text
run '~/.tmux/plugins/tpm/tpm'
      │
      ▼
TPM 이 ~/.tmux/plugins/ 안의 각 플러그인 폴더에서
  *.tmux 파일을 찾아 "실행 파일로" 돌린다  (내부적으로 run-shell)
      │
      ▼
그 스크립트가  tmux set-option / tmux bind-key / tmux source-file  같은
  CLI 명령으로 "실행 중인 tmux 서버"를 설정한다
```

즉 플러그인이 하는 일은 **당신이 손으로 칠 `tmux ...` 명령을 대신 쳐 주는 것**이다. `bind-key`, `set-option`, `display-popup`, `set-hook`, `run-shell` — 이 커맨드들이 곧 플러그인 API다.

## 최소 구조

플러그인 하나 = 폴더 + `<이름>.tmux` 진입 스크립트 하나. 이게 전부다.

```bash
#!/usr/bin/env bash
# my-plugin.tmux — TPM이 이 파일을 실행 파일로 돌린다

# 1) 자기 위치 파악 (헬퍼 스크립트를 sourcing 하려고)
CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 2) 사용자 설정 읽기
#    사용자가 .tmux.conf 에 `set -g @foo 'bar'` 로 준 값을 읽어온다
get_opt() { tmux show-option -gqv "$1"; }   # -g 전역  -q 조용히(없어도 에러X)  -v 값만

# 3) 실제 동작: tmux CLI 호출로 서버를 설정
tmux bind-key C-g display-popup -E "echo hello"   # 키 바인딩 추가
tmux set-option -g status-right "custom"          # 옵션 설정
```

파일에 실행 권한(`chmod +x my-plugin.tmux`)을 주는 것만 잊지 말자. TPM이 실행 파일로 돌리기 때문이다.

### 실증: themepack

유명한 [tmux-themepack](https://github.com/jimeh/tmux-themepack)도 정확히 이 패턴이다. 진입 스크립트가 하는 일은 딱 두 가지 — 사용자가 고른 테마 이름을 읽고, 해당 테마 파일을 `source-file`로 로드한다.

```bash
# themepack.tmux (요약)
main() {
  theme="$(get-tmux-option "@themepack" "basic")"   # @themepack 값 읽기
  tmux source-file "$CURRENT_DIR/powerline/${theme}.tmuxtheme"
}
```

그리고 그 `.tmuxtheme` 파일은 **`set -g status-left ...`, `set -g message-style ...` 같은 `set` 명령 수백 줄**일 뿐이다. "테마 플러그인"의 정체가 결국 셸이 대신 쳐 주는 `set` 명령 묶음이라는 것 — 그래서 테마의 버그 하나가 실은 `set` 한 줄의 문제로 환원되기도 한다.[^fill]

## 플러그인은 크게 두 종류

| 종류 | 로드 시점 동작 | 예시 |
|------|----------------|------|
| **설정형** | 로드할 때 `set`/`bind`만 하고 끝 (일회성) | themepack, tmux-sensible |
| **상호작용형** | 키에 스크립트를 바인딩 → 누를 때마다 실행 | tmux-resurrect, tmux-continuum, fzf 메뉴류 |

**설정형**은 위 예시처럼 로드 시 옵션·바인딩만 걸고 끝난다.

**상호작용형**은 `bind-key`로 키를 잡고, 그 키가 눌리면 `display-popup`(팝업 창)·`display-menu`(메뉴)·`command-prompt`(입력 프롬프트)·`run-shell`(스크립트 실행) 같은 명령으로 실제 작업을 한다. 예를 들어 tmux-continuum은 상태바에 `#(save-script.sh)`를 심어, 상태바가 갱신될 때마다 저장 스크립트를 돌리는 식으로 "자동 저장"을 구현한다.

```bash
# 상호작용형 예: prefix + G 로 세션 목록을 fzf 팝업에 띄우기
tmux bind-key G display-popup -E \
  "tmux list-sessions -F '#S' | fzf --reverse | xargs -r tmux switch-client -t"
```

## 이벤트에 반응하려면: hooks

로드 시점 말고 "새 창이 생겼을 때", "팬에 포커스가 갔을 때" 같은 **이벤트**에 반응하려면 `set-hook`을 쓴다.

```bash
tmux set-hook -g after-new-window 'run-shell "~/.tmux/plugins/my-plugin/on-new-window.sh"'
```

`after-new-window`, `pane-focus-in`, `client-attached` 등 tmux가 제공하는 훅 종류는 `man tmux`의 *HOOKS* 절에 정리돼 있다.

## 만들어서 배포하기

1. `~/dev/my-plugin/my-plugin.tmux` 작성 후 `chmod +x`.
2. **로컬 테스트** — 저장소로 올리기 전에, `.tmux.conf`에 아래 한 줄로 직접 실행해 본다.
   ```bash
   run-shell ~/dev/my-plugin/my-plugin.tmux
   ```
3. GitHub 저장소로 올리고, README에 설치법을 안내한다.
   ```bash
   set -g @plugin 'your-name/my-plugin'
   ```
4. 사용자는 그 줄을 추가한 뒤 `prefix + I`(TPM install)를 누르면 TPM이 저장소를 클론하고 `*.tmux`를 실행한다.

## 정리

- tmux 플러그인 = **tmux CLI를 대신 호출하는 셸 스크립트**. 특별한 런타임/SDK는 없다.
- TPM은 `~/.tmux/plugins/*/`의 `*.tmux` 파일을 실행 파일로 돌리는 관례일 뿐.
- 설정형은 로드 시 `set`/`bind`만, 상호작용형은 키에 `display-popup`/`run-shell` 등을 건다.
- 시점이 아니라 이벤트에 반응하려면 `set-hook`.
- 그래서 플러그인 제작의 실체는 **`man tmux` 명령을 셸에서 조합하는 것**이다.

[^fill]: 실제 사례 — themepack이 `message-style`에서 `fill=` 속성을 빠뜨려 명령 프롬프트가 상태바에 겹치는 버그. `set` 한 줄이 원인이었다.

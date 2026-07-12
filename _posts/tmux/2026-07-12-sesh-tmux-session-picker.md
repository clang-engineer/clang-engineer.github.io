---
title       : "🔀 sesh — fzf·zoxide로 즉석 tmux 세션 전환 (부트스트래퍼에서 피커로)"
description : "sesh는 선언형 세션 매니저(smug·tmuxp)와 다른 범주다 — 레이아웃을 만드는 게 아니라 디렉토리·git repo에서 세션을 즉석으로 열고 전환하는 피커. 설치·prefix+T 바인딩·핵심 CLI와, smug에서 옮기며 배운 '범주 오선택'까지."
date        : 2026-07-12 12:00:00 +0900
updated     : 2026-07-12 12:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [terminal, guide, sesh]
pin         : false
hidden      : false
---

`sesh`(session의 축약)는 tmux 세션 매니저지만, [smug](/posts/tmux/2026-07-11-smug-minimal-tmux-session-manager/)·tmuxp 같은 **선언형 부트스트래퍼와는 다른 범주**다. 저들이 "이런 레이아웃의 세션을 *만들어라*"라면, sesh는 "지금 있는(또는 필요한) 세션으로 *빠르게 넘어가라*"다. [fzf](https://github.com/junegunn/fzf)(fuzzy finder)와 [zoxide](https://github.com/ajeetdsouza/zoxide)(자주 가는 디렉토리를 학습해 점프)를 엮어, 디렉토리·git repo에서 세션을 **즉석으로 열고 전환**하는 데 특화돼 있다.

> 이 글은 [tmux 세션 부트스트랩](/posts/tmux/2026-02-21-tmux-bootstrap/) 글이 "스코프 밖이지만 방향은 알아둘 것"이라며 예고했던 **온디맨드 세션 스위처**의 본편이다. 고정 레이아웃을 *선언*하는 그 글과 목적이 다르다. 전체 학습 순서는 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/).
{: .prompt-tip }

## 두 범주 — 부트스트래퍼 vs 피커

세션 자동화를 얘기할 때 흔히 한 덩어리로 묶지만, 실은 목적이 다른 두 축이다.

| | 부트스트래퍼 (smug·tmuxp·tmuxinator) | 피커/스위처 (sesh) |
|---|---|---|
| 하는 일 | 세션·윈도우·패널 **레이아웃을 선언 → 생성** | 디렉토리·세션 사이를 **즉석 전환** |
| 입력 | YAML config (파일 하나 = 세션 하나) | fzf 목록에서 고르기 (config 없어도 됨) |
| 대표 동작 | `smug start dev` → 3-pane 레이아웃 부팅 | `prefix+T` → 폴더 고르면 그 세션으로 점프 |
| 강점 | 복잡한 다중 패널 배치의 재현 | 프로젝트 수십 개를 오갈 때의 속도 |

둘은 경쟁이 아니라 **상호 보완**이다. "정해진 레이아웃을 반복 로드"가 필요하면 부트스트래퍼, "여러 프로젝트를 빠르게 왕복"이 필요하면 피커다. sesh는 심지어 선언형이 필요한 세션은 tmuxp/tmuxinator 스크립트에 위임할 수도 있어서, 피커를 앞단에 두고 뒤에 부트스트래퍼를 붙이는 조합도 된다.

## 설치 + tmux 바인딩

Homebrew 한 줄이면 끝난다. sesh는 Go 단일 바이너리라 런타임 의존이 없다.

```bash
brew install sesh
```

핵심 의존은 **fzf**(피커 UI)와 **zoxide**(디렉토리 점프)다. 둘 다 이미 깔려 있다면 sesh는 바로 풀 기능으로 돈다. 피커를 팝업으로 띄우려면 fzf에 딸려 오는 `fzf-tmux`, 디렉토리 검색 소스엔 `fd`가 쓰인다.

sesh의 일상은 사실상 **tmux 키 하나**로 수렴한다. `~/.tmux.conf`(또는 Oh my tmux! 사용자는 `.tmux.conf.local`)에 피커를 `prefix + T`에 바인딩한다.

```tmux
# sesh session picker — prefix+T; 팝업 안: ^a 전체 ^t tmux ^g 설정 ^x zoxide ^f 디렉토리, ^d kill
bind-key T run-shell "sesh connect \"$(
  sesh list --icons | fzf-tmux -p 80%,70% \
    --no-sort --ansi --border-label ' sesh ' --prompt '⚡  ' \
    --header '  ^a all ^t tmux ^g configs ^x zoxide ^d kill ^f find' \
    --bind 'tab:down,btab:up' \
    --bind 'ctrl-a:change-prompt(⚡  )+reload(sesh list --icons)' \
    --bind 'ctrl-t:change-prompt(🪟  )+reload(sesh list -t --icons)' \
    --bind 'ctrl-g:change-prompt(⚙️  )+reload(sesh list -c --icons)' \
    --bind 'ctrl-x:change-prompt(📁  )+reload(sesh list -z --icons)' \
    --bind 'ctrl-f:change-prompt(🔎  )+reload(fd -H -d 2 -t d -E .Trash . ~)' \
    --bind 'ctrl-d:execute(tmux kill-session -t {2..})+change-prompt(⚡  )+reload(sesh list --icons)' \
    --preview-window 'right:55%' \
    --preview 'sesh preview {}'
)\""
```

`prefix+T`를 누르면 팝업이 뜨고, 팝업 안에서 소스를 전환한다 — `^a` 전체, `^t` 열려 있는 tmux 세션, `^g` sesh 설정 세션, `^x` zoxide 디렉토리, `^f` `fd`로 홈 아래 디렉토리 검색, `^d`로 세션 kill. 고르면 그 폴더로 세션을 만들거나(없으면) 점프한다(있으면).

> tmux 설정 안의 `$(...)`는 **이스케이프하지 말 것**. `run-shell`이 문자열을 `/bin/sh`에 넘겨 거기서 평가하므로 `\$(`로 쓰면 깨진다. 또 이 스니펫을 chezmoi 같은 템플릿 도구로 관리한다면, `{2..}`·`$()`가 템플릿 문법과 충돌하지 않도록 해당 파일을 템플릿(`.tmpl`) **밖**에 두는 게 안전하다.
{: .prompt-warning }

## 자주 쓰는 CLI

피커가 90%지만, 터미널에서 직접 부르는 명령 몇 개가 손에 붙으면 더 빠르다.

```bash
sesh connect <이름/경로>   # 세션에 연결(없으면 생성). 부분 경로도 먹음
sesh last                  # 직전 세션으로 토글 — 두 프로젝트 왕복에 최고
sesh clone <git-url>       # repo 클론 + 그 세션으로 바로 진입
sesh list                  # 세션 목록 (-t tmux만, -z zoxide, -c 설정된 것)
sesh connect -c "<명령>" <경로>  # 새 세션 열며 명령 실행(기존 세션이면 무시)
```

특히 `sesh last`는 tmux 자체의 "이전 세션(`prefix + L`)"과 비슷하지만, sesh가 만든 디렉토리 기반 세션까지 포함해 토글한다. 프로젝트 두 개를 붙잡고 오갈 때 체감이 크다.

## 설정 파일은 선택이다

여기서 부트스트래퍼와의 차이가 다시 드러난다. **sesh는 config 파일 없이도 완전히 동작한다.** 디렉토리·zoxide·열린 tmux 세션을 소스로 삼아 피커가 채워지기 때문이다. smug처럼 "config를 먼저 써야 쓸 수 있는" 도구가 아니다.

`~/.config/sesh/sesh.toml`은 아래가 *필요해질 때* 도입하면 된다.

```toml
# 이름 붙은 세션 + 세션별 시작 명령
[[session]]
name = "dotfiles"
path = "~/dotfiles"
startup_command = "nvim ."

# 피커에서 특정 디렉토리 숨기기
[blacklist]
paths = ["~/Downloads"]
```

즉 **필요가 생긴 뒤에 설정을 붙이는** 방향이다. 처음부터 세션을 다 선언해두는 부트스트래퍼와 정반대의 워크플로다.

## smug에서 옮긴 이유 — 범주를 잘못 골랐었다

내가 원래 쓰던 smug config는 이게 전부였다.

```yaml
# ~/.config/smug/dev.yml
session: dev
root: ~/
windows:
  - name: dev
    layout: even-horizontal
    commands:
      - claude       # 왼쪽 pane에서 자동 실행
```

좌우로 나누고 왼쪽에서 명령 하나 실행 — 이건 **레이아웃을 재현하는 부트스트랩이 아니라, 그냥 "그 폴더로 세션 하나 여는" 점프에 가까웠다.** smug의 진짜 강점(복잡한 다중 패널 배치를 layout 문자열까지 써서 고정하는 것)은 하나도 안 쓰고 있었던 셈이다. 도구를 범주부터 잘못 고른 것이다.

그래서 sesh로 옮기면서 이 config는 **버렸다**. pane 분할과 명령 자동 실행이라는 "레이아웃"은 사라지지만, 애초에 내가 원한 건 레이아웃이 아니라 *빠른 세션 전환*이었으니 손해가 아니라 정리다. 명령 자동 실행이 특정 폴더에만 다시 필요해지면 그때 `sesh.toml`의 `startup_command` 한 줄이나 `sesh connect -c`로 되살리면 된다 — YAML을 미리 유지할 이유가 없다.

교훈은 도구 비교표보다 **범주 선택**이 먼저라는 것이다. "세션 매니저 뭐 쓰지"의 답은 smug냐 tmuxp냐 이전에, **레이아웃을 선언하고 싶은가(부트스트래퍼) vs 세션을 빠르게 오가고 싶은가(피커)**를 먼저 가르는 데 있다.

## 정리

- sesh는 선언형 부트스트래퍼가 아니라 **fzf·zoxide 기반 피커/스위처**다. 다른 축이고, 부트스트래퍼와 병행도 된다.
- 일상은 `prefix + T` 하나. CLI는 `connect`/`last`/`clone` 정도면 충분하다.
- config는 **선택** — 없어도 돌고, 이름 세션·시작 명령·blacklist가 필요해지면 그때 `sesh.toml`을 붙인다.
- "세션 매니저 뭐 쓰지"보다 **"부트스트랩이 필요한가, 점프가 필요한가"**를 먼저 물어라. 범주가 맞아야 도구 비교가 의미 있다.

> 반대 범주 — 복잡한 다중 패널 **레이아웃을 선언해 재현**하는 쪽은 [smug 심화 글](/posts/tmux/2026-07-11-smug-minimal-tmux-session-manager/)과 [세션 부트스트랩](/posts/tmux/2026-02-21-tmux-bootstrap/)에서. 세 도구(smug·tmuxp·tmuxinator) 비교와 조건부 순위도 그 글에 있다.
{: .prompt-tip }

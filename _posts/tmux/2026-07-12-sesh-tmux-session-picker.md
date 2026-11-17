---
title       : "🔀 sesh — fzf·zoxide로 즉석 tmux 세션 전환 (부트스트래퍼에서 피커로)"
description : "sesh의 내장 picker와 connect, tmux·zoxide 목록 출처를 설명한다. 프로젝트별 세션 구성과 설정 없이 시작하는 기본 동작도 구분한다."
date        : 2026-07-12 12:00:00 +0900
updated     : 2026-11-17 16:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [terminal, guide, sesh]
pin         : false
hidden      : false
---

[`sesh`](https://github.com/joshmedeski/sesh)는 tmux 세션 매니저지만, [smug](./2026-02-21-tmux-bootstrap.md)·tmuxp 같은 **선언형 부트스트래퍼와는 출발점이 다르다.** 저들이 "이런 레이아웃의 세션을 *만들어라*"라면, sesh는 "지금 있는(또는 필요한) 세션으로 *빠르게 넘어가라*"에 가깝다. 기존 tmux 세션과 [zoxide](https://github.com/ajeetdsouza/zoxide)의 디렉터리 이력을 목록으로 모아, 프로젝트별 세션을 만들고 오가도록 돕는다. 내장 picker로 시작할 수 있고, 필요하면 fzf 같은 외부 선택기를 붙인다.

> 이 글은 [tmux 세션 부트스트랩](./2026-02-21-tmux-bootstrap.md) 글이 "스코프 밖이지만 방향은 알아둘 것"이라며 예고했던 **온디맨드 세션 스위처**의 본편이다. 고정 레이아웃을 *선언*하는 그 글과 목적이 다르다. 전체 학습 순서는 [tmux 로드맵](./2026-06-16-00-tmux-roadmap.md).
{: .prompt-tip }

> **2026-11-17 보강 · sesh 2.26.2 확인 기준.** 내장 picker를 기본 예제로 추가하고, 목록의 출처와 세션 생성·전환의 차이를 구분했다. 아래 fzf 구성은 별도의 확장 대안으로 남긴다.
{: .prompt-info }

## 먼저 관리 단위 — 프로젝트를 window로 나눌까, session으로 나눌까?

tmux는 **session 안에 window, window 안에 pane**이 있는 구조다. sesh가 주로 고르는 단위는 session이다. 프로젝트 폴더는 세션을 찾거나 새로 만들 때의 출발점이지, 폴더가 tmux의 새로운 관리 단위가 되는 것은 아니다.

프로젝트마다 window 하나면 충분하다면 **한 session 안에서 window별로 프로젝트를 나눠도 된다.** sesh를 쓰려고 기존 구성을 강제로 갈아엎을 필요는 없다. 반대로 프로젝트 하나마다 코딩·서버·로그용 window가 여러 개 필요하다면, 프로젝트별 session이 묶음 단위가 된다. 세션을 바꾸면 그 안의 window·pane과 실행 중인 작업을 함께 오갈 수 있다.

한 세션의 모든 pane이 같은 폴더에 있어야 하는 것도 아니다. 각 pane에서 다른 폴더로 `cd`해도 된다. **프로젝트별 session은 작업 정리 방식이지 tmux의 제약이 아니다.**

## 두 범주 — 부트스트래퍼 vs 피커

세션 자동화를 얘기할 때 흔히 한 덩어리로 묶지만, 실은 목적이 다른 두 축이다.

| | 부트스트래퍼 (smug·tmuxp·tmuxinator) | 피커/스위처 (sesh) |
|---|---|---|
| 하는 일 | 세션·윈도우·패널 **레이아웃을 선언 → 생성** | 디렉토리·세션 사이를 **즉석 전환** |
| 입력 | YAML config로 레이아웃 정의 | 내장 picker 또는 외부 선택기에서 세션·디렉터리 선택 |
| 대표 동작 | `smug start dev` → 3-pane 레이아웃 부팅 | picker에서 폴더 선택 → 해당 세션으로 이동, 없으면 생성 |
| 강점 | 복잡한 다중 패널 배치의 재현 | 프로젝트 수십 개를 오갈 때의 속도 |

둘은 경쟁이 아니라 **상호 보완**이다. "정해진 레이아웃을 반복 로드"가 필요하면 부트스트래퍼, "여러 프로젝트를 빠르게 왕복"이 필요하면 피커부터 시작한다. sesh에도 시작 명령과 window 설정이 있으므로 레이아웃을 전혀 다루지 않는 도구라는 뜻은 아니다. 더 복잡한 부트스트랩이 필요하면 시작 명령에서 기존 도구를 호출하는 식으로 조합할 수 있다.

## 설치 + tmux 바인딩

macOS에서는 Homebrew로 설치할 수 있다. sesh 자체는 Go로 만든 실행 파일이며, **관리 대상인 tmux는 계속 필요하다.**

```bash
brew install sesh
```

### TPM 플러그인 대신 외부 CLI인 이유

sesh는 `set -g @plugin`으로 로드하는 TPM 플러그인이 아니다. **tmux 명령을 호출해 세션을 찾고 만들고 연결하는 독립 CLI**다. tmux 안의 단축키뿐 아니라 일반 셸이나 스크립트에서도 같은 `sesh connect`를 호출할 수 있다. tmux 밖에서 실행할 수 있다는 말이지, Ghostty 같은 터미널 앱 자체의 탭·분할을 관리한다는 뜻은 아니다. 제작자의 의도를 추정하기보다는 이 실행 경계로 이해하면 된다.

### 가장 작은 시작 — 내장 picker를 팝업으로

내장 picker에는 **fzf가 필수가 아니다.** zoxide는 방문한 디렉터리를 후보에 더하는 연동이고, `fzf-tmux`와 `fd`는 뒤의 fzf 확장 예제에서 사용한다. 기본 시작에는 복잡한 선택기 스크립트가 필요 없다.

`~/.tmux.conf`에, Oh My Tmux! 사용자라면 `~/.tmux.conf.local`에 다음 한 줄을 둔다.

```tmux
bind-key T display-popup -h 90% -w 70% -E "sesh picker -i"
```

설정을 다시 로드하면 **prefix를 누르고 뗀 뒤 `Shift+t`**로 아이콘을 표시한 picker가 열린다. `T`는 sesh의 내장 기본 단축키가 아니라 **이 설정에서 선택한 키**다. picker에서 항목을 검색하고 Enter로 접속한다. 이 바인딩은 2026-11-17에 실제 tmux 클라이언트에서 팝업 실행을 확인했다. 내장 picker 예제는 [공식 문서](https://github.com/joshmedeski/sesh/tree/v2.26.2#sesh-picker)에도 있다.

## connect와 picker — 목적지를 지정할까, 목록에서 고를까?

| 명령 | 접속 대상을 고르는 방법 |
|---|---|
| `sesh connect ~/projects/api` | 지정한 경로의 세션으로 바로 접속. 없으면 생성 |
| `sesh picker` | 후보 목록을 검색하고 선택한 대상으로 접속. 해당 세션이 없으면 생성 |

**picker에서 선택한 항목이 접속 대상**이다. 이미 존재하는 tmux 세션을 고르면 그 세션으로 이동하고, 디렉터리를 고르면 그 경로에 대응하는 세션을 찾거나 만든다. 디렉터리 경로 전체가 그대로 세션 이름이 되는 것은 아니다. sesh가 Git 저장소·remote·디렉터리 정보를 바탕으로 이름을 정하므로, 이름이 모호해질 때는 목록이나 명시적 세션 설정을 확인한다.

기존 세션으로 돌아갈 때 window·pane을 새로 만드는 것은 아니다. **tmux 서버가 살아 있고 세션을 지우지 않았다면** 실행 중인 작업으로 돌아간다. 서버 재시작 후의 저장·복원은 sesh의 빠른 전환과 별개의 문제다.

### 목록은 어디서 오는가?

- **tmux**: 현재 존재하는 세션. sesh로 만들지 않은 세션도 후보가 된다.
- **zoxide**: 셸 이동으로 기록되거나 직접 추가한 디렉터리 이력.
- **sesh 설정**: `sesh.toml`에 이름과 경로를 등록한 세션.

따라서 **zoxide만 보여주는 목록도, 디스크 전체나 Git 저장소를 자동 검색한 결과도 아니다.** 설정 세션이 없다면 주로 tmux 세션과 zoxide 디렉터리가 보인다. 아래 fzf 예제의 `Ctrl+f`는 별도로 `fd`를 실행해 디렉터리를 찾는 기능이며, 내장 picker의 기본 목록 출처와 구분한다.

## fzf 통합은 확장 대안

미리보기와 후보 소스 전환을 직접 구성하고 싶을 때 [공식 fzf 예제](https://github.com/joshmedeski/sesh/tree/v2.26.2#tmux--fzf)를 사용한다. 내장 picker가 기본 사용을 맡고, fzf는 선택 화면을 직접 조립하는 대안이다.

<details markdown="1">
<summary>소스 전환·미리보기·세션 삭제를 포함한 fzf 구성</summary>

아래도 `T`를 사용하므로 **앞의 내장 picker 바인딩과 둘 중 하나만 적용**한다. `fzf`·`fzf-tmux`가 필요하고, `Ctrl+f` 검색에는 `fd`가 필요하다.

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

**주의:** 여기의 `Ctrl+d`는 선택한 tmux 세션을 삭제한다. 실행 중인 작업도 종료될 수 있으므로 탐색용 키로 무심코 누르지 않는다. 이 소스 전환·삭제 키들은 위 fzf 스크립트의 설정이지, `sesh picker`에 자동으로 생기는 키가 아니다.

</details>

## 자주 쓰는 CLI

피커가 90%지만, 터미널에서 직접 부르는 명령 몇 개가 손에 붙으면 더 빠르다.

```bash
sesh picker                # 내장 목록 선택기
sesh last                  # 직전 세션으로 토글 — 두 프로젝트 왕복에 최고
sesh clone <git-url>       # repo 클론 + 그 세션으로 바로 진입
sesh list                  # 세션 목록 (-t tmux만, -z zoxide, -c 설정된 것)
sesh connect -c "<명령>" <경로>  # 새 세션 열며 명령 실행(기존 세션이면 무시)
```

`sesh last`는 직전 세션으로 돌아갈 때 쓴다. 위 명령은 tmux 세션을 대상으로 하며, 터미널 앱의 탭 전환 명령이 아니다. 전체 옵션은 `sesh --help`와 [공식 사용법](https://github.com/joshmedeski/sesh/tree/v2.26.2#how-to-use)을 기준으로 확인한다.

## 설정 파일은 선택이다

**sesh는 설정 파일 없이도 기본 생성·전환이 동작한다.** 이 글의 최소 구성에서도 `sesh.toml`을 만들지 않는다. 내장 picker를 쓰기 위해 필수로 작성해야 하는 파일이 아니다.

별도 시작 명령이 없다면 새 세션은 **선택한 디렉터리에서 셸 pane 하나**로 시작한다. 좌우 분할이나 에디터·AI 도구 실행은 기본 동작이 아니라 사용자가 추가하는 자동화다. 2026-11-17에는 설정 파일이 없는 상태에서 새 디렉터리에 접속해 pane 하나와 시작 명령이 없는 상태를 확인했다.

이름 붙인 프로젝트나 그 프로젝트만의 시작 명령이 필요해지면 `~/.config/sesh/sesh.toml`에 추가한다.

```toml
# 이름 붙은 세션 + 세션별 시작 명령
[[session]]
name = "dotfiles"
path = "~/dotfiles"
startup_command = "nvim ."
# startup_command는 이 세션을 새로 만들 때만 실행된다.
```

즉 **필요가 생긴 뒤에 설정을 붙이는** 방향이다. 처음부터 세션을 다 선언해두는 부트스트래퍼와 정반대의 워크플로다.

반대로 `[default_session]`에 분할·프로그램 실행을 넣으면, 개별 설정으로 달리 지정하지 않은 새 프로젝트들에도 그 자동화가 적용된다. 모든 프로젝트가 같은 구성을 쓰는 게 아니라면 기본값은 비워 두고, 필요한 `[[session]]`에만 명시하는 편이 예상하기 쉽다. 기존 세션에 다시 연결할 때는 시작 명령을 반복 실행하지 않는다.

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

- sesh는 **tmux 전용 외부 CLI**다. tmux 객체 전반을 관리하는 [tmux-fzf나 TPM 세션 플러그인과의 역할 차이](./2026-07-11-tmux-plugins-beyond-essentials.md)를 먼저 구분한다.
- `connect`는 목적지 지정, `picker`는 목록 선택이다. 내장 picker로 시작하고 fzf 통합은 필요할 때 추가한다.
- 후보는 tmux 세션·zoxide 이력·설정 세션을 합친다. `prefix + Shift+t`는 직접 등록한 바인딩이다.
- config는 **선택**이다. 기본은 셸 하나로 시작하고, 프로젝트별 이름·시작 명령이 필요해질 때만 설정을 붙인다.
- "세션 매니저 뭐 쓰지"보다 **"부트스트랩이 필요한가, 점프가 필요한가"**를 먼저 물어라. 범주가 맞아야 도구 비교가 의미 있다.

> 반대 범주 — 복잡한 다중 패널 **레이아웃을 선언해 재현**하는 쪽은 [smug 심화 글](./2026-02-21-tmux-bootstrap.md)과 [세션 부트스트랩](./2026-02-21-tmux-bootstrap.md)에서. 세 도구(smug·tmuxp·tmuxinator) 비교와 조건부 순위도 그 글에 있다.
{: .prompt-tip }

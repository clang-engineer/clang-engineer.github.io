---
title       : "tmux 클립보드 경계 — Buffer·OSC52·pbcopy와 SSH"
description : "tmux Buffer와 OS 클립보드의 차이, OSC52·pbcopy 전달 경로, 로컬/원격 tmux 설정, 한글 깨짐 진단."
date        : 2026-06-10 12:00:00 +0900
updated     : 2026-11-15 20:30:00 +0900
categories  : [tmux, "설정·옵션"]
tags        : [osc52, ghostty, tty, pty, ssh, clipboard, hangul, encoding, utf-8]
pin         : false
hidden      : false
---

tmux Copy Mode에서 복사한 텍스트는 **기본적으로 tmux Buffer에 저장**된다. Mac의 다른 앱에서 붙여넣으려면 **OS 클립보드로 전달하는 경로**가 추가로 필요하다. 대표적인 방법이 OSC52와 `copy-pipe`다.

> [tmux 로드맵](./2026-06-16-00-tmux-roadmap.md)의 클립보드 심화편. 기본 키 조작과 플러그인 소개는 각각 치트시트와 [플러그인 비교](./2026-07-11-tmux-plugins-beyond-essentials.md)에서 다룬다.
{: .prompt-tip }

## 1. 저장 공간과 복사 경로

```text
Neovim의 y ──> Neovim Register ──> p
                   │
                   └── 클립보드 provider(예: OSC52) ──┐
                                                     ▼
tmux Copy Mode ──> tmux Buffer ──> Prefix + ]       Mac Clipboard
                       │                             ▲
                       ├── OSC52 ──> Ghostty ─────────┤
                       └── copy-pipe ──> pbcopy ──────┘
```

- **Neovim Register**: 편집기 내부 복사 저장소. `y`/`p`가 사용한다. `"+y`는 `+` 레지스터의 클립보드 provider를 사용하며, OSC52 자체를 의미하지는 않는다.
- **tmux Buffer**: tmux 서버가 관리하는 복사 저장소. `Prefix + ]`는 이 Buffer를 현재 pane에 붙여넣는다. 다른 tmux 서버의 Buffer와는 독립적이다.
- **OS Clipboard**: Ghostty에서 `Cmd + V`로 붙여넣는 Mac의 클립보드. tmux Buffer와 동일한 저장 공간이 아니다.

**OSC52**는 프로그램이 터미널 출력으로 `ESC ] 52 ; c ; BASE64_DATA BEL` 형태의 제어 시퀀스를 보내는 규약이다. 최종적으로 이를 해석하는 **터미널 에뮬레이터(Ghostty)**가 OS 클립보드를 갱신한다. Base64는 인코딩이지 암호화가 아니다.

**`pbcopy`**는 macOS에서 실행되는 프로그램이다. 표준 입력으로 받은 텍스트를 **그 프로그램이 실행되는 Mac의 클립보드**에 기록한다. `pbpaste`는 반대 방향이다.

```sh
printf '한글 테스트' | pbcopy
pbpaste
```

| 경로 | 누가 클립보드를 갱신하나? | 원격 Linux에서 Mac 클립보드로? |
|---|---|---|
| OSC52 | 출력 경로 끝의 터미널(Ghostty) | 중간 tmux와 터미널이 허용하면 가능 |
| `copy-pipe "pbcopy"` | `pbcopy`를 실행한 Mac | 원격 Linux에서 직접 실행하는 방식은 아님 |
| `xclip` / `wl-copy` | 연결된 X11/Wayland 클립보드 | 보통 원격 그래픽 세션 대상; 별도 포워딩은 예외 |

## 2. TTY·PTY·SSH — OSC52는 어디로 가나?

- **TTY**: 터미널 입출력 인터페이스를 가리키는 개념.
- **PTY**: 셸이나 tmux pane이 사용하는 소프트웨어 터미널 장치.
- **Ghostty**: 터미널 출력을 화면에 렌더링하고 OSC52 같은 제어 시퀀스를 해석하는 터미널 에뮬레이터.

SSH는 로컬 키보드 입력을 원격으로 전달하고, 원격 출력은 다시 로컬로 돌려준다. **OSC52는 원격 셸에서 실행하는 명령이 아니라 터미널 출력 스트림에 포함된 데이터**다.

```text
Mac                                   Linux
Ghostty ← 로컬 tmux ← SSH 출력 ← 원격 Neovim
  │          │                         │
  │          └── OSC52 처리 가능       └── OSC52 출력
  └── Mac Clipboard
```

로컬 tmux가 원격 프로그램의 OSC52를 수락하려면 일반적으로 `set-clipboard on`이 필요하다. 중간 tmux가 시퀀스를 차단하거나 Ghostty가 허용하지 않으면 Mac 클립보드는 바뀌지 않는다.

### 로컬 tmux와 원격 tmux는 별개

```text
A. Ghostty → Mac tmux → SSH → 원격 Shell
                 └─ 로컬 Copy Mode → Mac tmux Buffer
                    OSC52 → Ghostty → Mac Clipboard

B. Ghostty → Mac tmux → SSH → 원격 tmux → Shell
                 │                  └─ 원격 Copy Mode → 원격 Buffer
                 └─ 로컬 Copy Mode → 로컬 Buffer

   원격 OSC52 → SSH → 로컬 tmux(수락) → Ghostty → Mac Clipboard
```

원격 Neovim에서 `y`를 누르면 기본적으로 **원격 Neovim 레지스터**에 복사된다. 로컬 tmux의 Copy Mode로 원격 로그 출력을 복사하는 경우에는 원격 Neovim이나 원격 셸에 OSC52 설정이 필요 없다.

붙여넣기 방향도 구분한다.

| 입력 | 출처 | 결과 |
|---|---|---|
| `Prefix + ]` | 해당 tmux 서버의 Buffer | 현재 pane으로 입력 |
| Ghostty의 `Cmd + V` | Mac Clipboard | 터미널에 입력; SSH 중이면 원격 프로그램까지 전달 |
| Neovim의 `p` | Neovim Register | Neovim 문서에 붙여넣기 |

## 3. tmux 자체 OSC52 설정 — Oh My Tmux! 불필요

tmux의 `set-clipboard`는 **서버 옵션**이다. 정확한 의미는 다음과 같다.

| `set-clipboard` | tmux 자체 복사 → 터미널 OSC52 | pane 안 프로그램의 OSC52를 tmux Buffer로 수락 |
|---|---|---|
| `on` | 예 | 예 |
| `external` (일반적인 기본값) | 예 | 아니요 |
| `off` | 아니요 | 아니요 |

**주의:** `external`도 tmux 자체 복사의 OSC52 전송을 수행한다. 따라서 `external`로 바꾸는 것은 tmux Buffer 전용 복사 모드를 만드는 방법이 아니다. 또한 `on`에서는 pane 내부 프로그램도 클립보드를 갱신할 수 있으므로 신뢰하지 않는 프로그램의 OSC52 출력에 주의한다.

```tmux
# ~/.tmux.conf — Neovim이나 중첩 tmux의 OSC52까지 수락하려는 경우
set -s set-clipboard on
```

Copy Mode의 **기존 복사 키**를 그대로 사용한다. vi 모드에서 `y`를 사용하고 싶다면 실제 바인딩을 확인한다. tmux 버전이나 설정 배포판에 따라 키가 다를 수 있다.

```sh
tmux show -s set-clipboard
tmux list-keys -T copy-mode-vi
tmux info | grep 'Ms:'
```

OSC52가 실제로 작동하려면 **외부 터미널의 `Ms` capability 인식**과 **Ghostty의 클립보드 쓰기 허용**도 필요하다. `Ms: [missing]`이면 tmux의 `terminal-features`/terminfo 설정을 점검한다. `TERM` 이름만 보고 무조건 지원된다고 단정하지 않는다.

### 중첩 tmux에서는

원격 tmux가 OSC52를 보낼 때, 바깥쪽 **로컬 tmux가 pane 프로그램의 OSC52를 받아야 하므로 `set-clipboard on`**이 필요하다. 원격 tmux에도 `Ms`가 있어야 하고, Ghostty에서도 허용해야 한다. 이는 tmux 공식 [Clipboard 문서](https://github.com/tmux/tmux/wiki/Clipboard)의 중첩 tmux 설명과 같다.

## 4. copy-pipe — OS 클립보드 명령 직접 실행

Mac에서 실행되는 tmux라면 OSC52 대신 `pbcopy`를 호출할 수 있다.

```tmux
# ~/.tmux.conf — macOS
setw -g mode-keys vi
set -s set-clipboard off
bind -T copy-mode-vi y send-keys -X copy-pipe-and-cancel "LANG=ko_KR.UTF-8 pbcopy"
```

`y`는 **tmux Buffer에 저장하면서 `pbcopy`의 stdin에도 전달**한다. 이 예시는 vi Copy Mode의 `y`를 사용자 정의로 덮어쓴다. `set-clipboard off`는 OSC52와 `pbcopy`가 중복으로 OS 클립보드를 갱신하지 않게 하려는 선택이다. 단, pane 내부 Neovim의 OSC52도 tmux가 처리하지 않으므로 용도에 맞게 결정한다.

tmux 3.2 이상에서는 `copy-command` 옵션을 이용해 기본 복사 바인딩과 OS 명령을 연결할 수도 있다.

```tmux
set -s copy-command "LANG=ko_KR.UTF-8 pbcopy"
```

이 옵션은 **`copy-pipe`를 명령 인자 없이 사용하는 바인딩**에 적용된다. 기존에 명령을 명시한 바인딩을 자동으로 덮어쓰지는 않는다.

### Buffer 복사와 OS 복사를 의도적으로 분리

Mac에서 `y`는 tmux Buffer에만 저장하고, **별도 키**로 최근 Buffer를 Mac 클립보드에 보낼 수도 있다.

```tmux
setw -g mode-keys vi
set -s set-clipboard off
bind -T copy-mode-vi y send-keys -X copy-selection-and-cancel
bind -T prefix Y run-shell 'tmux save-buffer - | LANG=ko_KR.UTF-8 pbcopy'
```

- Copy Mode `y`: tmux Buffer에만 복사
- `Prefix + Y`: 최근 tmux Buffer를 Mac Clipboard로 전송
- `Prefix + ]`: tmux Buffer를 현재 pane에 붙여넣기

`Prefix + Y`는 **직접 정의한 예시 키**이며 tmux/Oh My Tmux!의 기본 키라고 가정하면 안 된다. 이 구성은 `set-clipboard off`로 pane 내부 OSC52도 차단한다. 원격 Neovim의 OSC52를 함께 쓰고 싶다면 이 방식 대신 **`on`과 별도 키·바인딩 전략을 재설계**해야 한다.

### Oh My Tmux! 옵션과의 차이

`tmux_conf_copy_to_os_clipboard`는 **Oh My Tmux!의 커스텀 변수**이지 tmux 내장 옵션이 아니다. Oh My Tmux!가 OS 클립보드 명령을 활용하도록 복사 바인딩을 구성하는 데 쓰인다. 반면 `set-clipboard`는 tmux 자체의 OSC52 기능이다.

`tmux_conf_copy_to_os_clipboard=false`여도 OSC52가 동작할 수 있다. 실제 설정은 `tmux show -s set-clipboard`와 `tmux list-keys`로 확인한다.

## 5. 검증 — Buffer와 OS 클립보드를 따로 확인

```sh
tmux source-file ~/.tmux.conf       # 설정 다시 읽기
tmux show -s set-clipboard         # on / external / off
tmux info | grep 'Ms:'             # OSC52 capability
tmux list-keys -T copy-mode-vi     # 실제 복사 키
tmux list-buffers                  # tmux 내부 복사 기록
```

OSC52 전송 경로만 별도로 확인하려면, **Mac의 Ghostty에 연결된 tmux 클라이언트에서** 다음을 시험할 수 있다.

```sh
tmux set-buffer -w '한글─테스트'
pbpaste
```

`set-buffer -w`는 외부 터미널에 Buffer를 쓰도록 시도하는 옵션이다. 이 테스트는 OSC52 전송 경로를 확인하는 것이지 Copy Mode 키 바인딩을 검증하는 것은 아니다. 또한 **활성 tmux 클라이언트와 터미널 capability**에 따라 결과가 달라질 수 있다.

## 6. 트러블슈팅 — pbcopy에서 한글이 깨질 때

### 증상과 원인

tmux에서 복사한 한글이나 박스 문자가 `‚îÄ`처럼 깨질 때는 **UTF-8 바이트를 다른 인코딩으로 해석한 문제**일 수 있다. 예를 들어 `─`(U+2500)의 UTF-8 바이트 `E2 94 80`를 MacRoman으로 해석하면 `‚îÄ`가 된다.

`pbcopy`는 로케일 환경변수의 영향을 받을 수 있다. tmux가 띄운 `pbcopy`와 대화형 셸에서 직접 실행한 `pbcopy`의 환경이 다르면 **셸에서는 정상, tmux 복사에서만 깨짐**이라는 차이가 생길 수 있다. 단, 같은 증상이면 무조건 `LANG` 누락이라고 단정하지 말고 경로를 분리해 진단한다.

```sh
echo "$LANG"
tmux show-environment -g | grep -E 'LANG|LC_'
tmux show-environment | grep -E 'LANG|LC_'
printf '한글─테스트\n' | LANG=ko_KR.UTF-8 pbcopy
pbpaste
```

tmux 서버는 시작할 때 환경을 상속받지만 **서버 전역 환경과 세션 환경, 새 창의 환경은 구분**된다. 이후 `update-environment`나 `set-environment`로 갱신할 수 있으므로, 서버 시작 시점에 영구 고정된다고 설명하면 부정확하다.

```sh
tmux show-options -g update-environment
tmux set-environment -g LANG ko_KR.UTF-8
```

로케일이 원인으로 확인되면 `copy-pipe`의 명령에 `LANG=ko_KR.UTF-8`를 명시하는 방법이 있다. 단, OS에 해당 로케일이 존재하는지도 확인한다.

### 경로별 진단

| 현상 | 우선 확인 |
|---|---|
| tmux Buffer는 정상인데 Mac 클립보드가 비어 있음 | `set-clipboard`, `Ms`, Ghostty 허용 여부 |
| 로컬 tmux 복사는 되는데 원격 Neovim OSC52만 안 됨 | 로컬 tmux의 `set-clipboard on`, 원격 Neovim provider |
| 원격 tmux에서만 안 됨 | 중첩 tmux의 양쪽 `Ms`와 바깥쪽 `set-clipboard on` |
| `pbcopy`를 쓸 때만 한글 깨짐 | tmux에서 실행한 명령의 `LANG`/`LC_CTYPE` |
| `Cmd + V`는 되는데 `Prefix + ]`가 다름 | Mac Clipboard와 tmux Buffer가 서로 다른 저장 공간 |

`tmux kill-server`는 **모든 tmux 세션을 종료**하므로 단순 진단용으로 권장하지 않는다. 설정을 다시 읽어도 해결되지 않을 때만 영향 범위를 이해하고 재시작한다.

## 참고

- [tmux 공식 Clipboard 위키](https://github.com/tmux/tmux/wiki/Clipboard) — `on`/`external`/`off`, `Ms`, SSH·중첩 tmux, 외부 클립보드 도구
- [tmux(1) 매뉴얼](https://man.openbsd.org/tmux.1) — `set-clipboard`, `copy-command`, `copy-pipe`, `set-buffer`
- `man pbcopy` — macOS 표준 입출력과 클립보드 연동

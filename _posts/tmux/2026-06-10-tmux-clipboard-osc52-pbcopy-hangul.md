---
title       : "tmux 클립보드 경계 — OSC52·pbcopy와 한글 깨짐"
description : "TTY·PTY와 SSH 출력 경로, Neovim 레지스터·tmux Buffer·OS 클립보드, OSC52·pbcopy 차이 및 한글 깨짐 진단."
date        : 2026-06-10 12:00:00 +0900
updated     : 2026-11-15 21:00:00 +0900
categories  : [tmux, "설정·옵션"]
tags        : [osc52, ghostty, tty, pty, ssh, clipboard, hangul, encoding, utf-8, daemon]
pin         : false
hidden      : false
---

tmux Copy Mode에서 복사한 텍스트가 macOS의 다른 앱에도 붙여넣어지는 이유는 무엇일까? **tmux Buffer와 시스템 클립보드는 별개의 저장 공간**이지만, OSC52 또는 `pbcopy` 같은 연결 경로가 있으면 함께 갱신할 수 있다.

> 이 글은 [tmux 로드맵](./2026-06-16-00-tmux-roadmap.md)의 **클립보드 경계와 트러블슈팅** 편이다. tmux 기본 사용법은 치트시트에서, 플러그인 선택은 [플러그인 비교](./2026-07-11-tmux-plugins-beyond-essentials.md)에서 다룬다.
{: .prompt-tip }

## 먼저 이해할 것 — 세 가지 저장 공간

```text
Neovim 레지스터         tmux Buffer              macOS 클립보드
  " / 0 / + 등          copy-selection             Cmd+V 대상
        │                     │                          ▲
        │                     ├── OSC52 ──> Ghostty ─────┤
        │                     └── copy-pipe ─> pbcopy ────┤
        └── 클립보드 provider / OSC52 등으로 연결 가능 ──┘
```

- **Neovim 레지스터**: 편집기 내부의 복사·삭제 결과를 저장한다. `"+y`는 시스템 클립보드 레지스터를 사용하려는 명령이며, 실제 동작은 클립보드 provider·터미널 지원에 달려 있다.
- **tmux Buffer**: Copy Mode에서 선택한 문자열을 저장한다. `Prefix ]`로 붙여넣는 것은 시스템 클립보드와 별개의 동작이다.
- **OS 클립보드**: macOS 앱 사이에서 `Cmd+V`로 공유되는 저장 공간이다.

### OSC52와 pbcopy는 어떻게 다른가?

```text
[OSC52: 터미널에 요청]              [pbcopy: OS 명령 실행]
tmux / Neovim                       tmux copy-pipe
     │                                   │ stdin
     ▼                                   ▼
OSC 52 ; c ; Base64 ...               pbcopy
     │ 터미널 출력 스트림                  │ macOS API
     ▼                                   ▼
Ghostty가 제어 시퀀스 해석          macOS 클립보드
     │
     ▼
macOS 클립보드
```

**OSC52**는 프로그램이 클립보드 내용을 Base64로 담은 터미널 제어 시퀀스를 출력하고, 터미널 에뮬레이터가 이를 해석해 로컬 클립보드를 갱신하는 규약이다. Base64는 암호화가 아니다. **`pbcopy`**는 macOS 명령으로, stdin으로 받은 텍스트를 OS 클립보드에 직접 기록한다. 반대 방향은 `pbpaste`다.

```sh
printf '한글 테스트' | pbcopy  # stdin → macOS 클립보드
pbpaste                      # macOS 클립보드 → stdout
```

### SSH에서 차이가 커지는 이유

```text
Mac Ghostty ─── SSH ─── 원격 Linux tmux
      ▲                         │
      └──── OSC52 출력 전달 ────┘
      │
      ▼
Mac 클립보드
```

원격 Linux에서 `pbcopy`를 직접 실행할 수는 없지만, 원격 프로그램의 OSC52 출력이 SSH와 중간 tmux 계층을 통과하고 **로컬 터미널이 허용한다면** Mac 클립보드를 갱신할 수 있다. 반대로 원격 프로그램이 클립보드를 덮어쓸 수도 있으므로 터미널의 OSC52 허용 정책을 확인한다.

### tmux와 Oh My Tmux!의 설정은 별개

| 설정 | 의미 |
|---|---|
| `set-clipboard on` | tmux 자체 복사를 OSC52로 전송하고 pane 내부 프로그램의 OSC52 요청도 처리 |
| `set-clipboard external` | tmux 자체 복사는 OSC52로 전송하지만, pane 내부 프로그램의 OSC52 요청으로 tmux Buffer를 변경하는 것은 허용하지 않음 |
| `set-clipboard off` | tmux의 OSC52 클립보드 연동 비활성화 |
| `tmux_conf_copy_to_os_clipboard=true` | Oh My Tmux!가 `pbcopy` 등 OS 명령을 이용하도록 Copy Mode 바인딩 구성 |

Oh My Tmux!의 `tmux_conf_copy_to_os_clipboard=false`는 **그 설정 계층의 OS 명령 연동이 꺼졌다는 뜻**이지, tmux의 `set-clipboard`까지 끄는 것은 아니다. 따라서 `false`여도 OSC52가 별도로 동작할 수 있다. 실제 실행 중인 서버에서는 `tmux show -s set-clipboard`와 `tmux info | grep 'Ms:'`로 확인한다.

---

## 터미널 출력의 경로 — TTY, PTY, SSH

OSC52를 이해하려면 먼저 **프로그램이 출력한 바이트가 어디로 가는지** 알아야 한다.

- **TTY**: 터미널 입출력 인터페이스를 가리키는 개념. `tty` 명령으로 현재 셸의 터미널 장치 경로를 확인할 수 있다.
- **PTY(Pseudo Terminal)**: 소프트웨어로 구현한 터미널 장치 쌍. 셸이나 tmux pane의 프로그램은 PTY를 통해 입력을 받고 출력을 보낸다.
- **터미널 에뮬레이터(Ghostty)**: 출력 바이트를 화면의 글자·색상·커서 이동 등으로 해석한다. 허용된 OSC52를 받으면 **Ghostty가 실행 중인 Mac의 클립보드**를 갱신한다.

```text
Mac: Ghostty → 로컬 tmux → SSH → 원격 셸
      ▲           ▲                  │
      │           └──── SSH 출력 ────┘
      └── tmux가 출력한 OSC52를 해석
```

SSH는 키보드 입력을 원격으로 보내는 동시에 **원격 출력도 로컬로 되돌려 준다**. OSC52는 원격 셸에 실행을 요청하는 명령이 아니라, 그 **출력 흐름에 실리는 제어 시퀀스**다. 중간의 tmux가 이를 처리하거나 막을 수 있으므로 반드시 Ghostty까지 도달하는 것은 아니다.

### 로컬 tmux와 원격 tmux는 구분한다

```text
A. Mac Ghostty → Mac tmux → SSH → 원격 Shell
                     │
                     └─ Copy Mode → Mac tmux Buffer
                        OSC52 → Mac Ghostty → Mac 클립보드

B. Mac Ghostty → Mac tmux → SSH → 원격 tmux → Shell
                     │                 │
                     │                 └─ 원격 Copy Mode → 원격 Buffer
                     └─ 로컬 Copy Mode → 로컬 Buffer

   원격 tmux의 OSC52 → SSH → 로컬 tmux → Ghostty → Mac 클립보드
   (중간 tmux와 Ghostty의 지원·허용 설정이 필요)
```

**Buffer는 tmux 인스턴스마다 별개**다. 원격 Neovim의 `y` 역시 원격 Neovim 레지스터에 복사하며, 그것만으로 Mac이나 원격 OS 클립보드가 바뀌지는 않는다. 반대로 로컬 tmux의 Copy Mode로 SSH 출력 이력을 복사할 때는 원격 프로그램에 OSC52 설정이 없어도 된다.

### 복사와 붙여넣기는 방향이 다르다

| 동작 | 실제 경로 |
|---|---|
| 로컬 tmux Copy Mode 복사 | 로컬 tmux Buffer에 저장, 설정에 따라 OSC52로 Mac 클립보드 갱신 |
| 원격 tmux Copy Mode 복사 | 원격 tmux Buffer에 저장, 설정에 따라 OSC52 출력 |
| `Prefix + ]` | **해당 tmux 인스턴스의 Buffer**를 현재 pane에 입력 |
| Ghostty에서 `Cmd + V` | **Mac 클립보드** 내용을 현재 터미널 입력으로 전달; SSH 중이면 원격 프로그램으로 입력 |
| 원격 Neovim `y` / `p` | 원격 Neovim 레지스터에서 복사 / 붙여넣기 |
| 원격 Neovim `"+y` | 클립보드 provider 설정에 따라 OSC52 등으로 외부 클립보드에 복사 |

원격 Linux의 `xclip`·`wl-copy`는 일반적으로 **원격 그래픽 세션의 클립보드**를 대상으로 한다. GUI나 클립보드 서비스가 없는 서버에서는 사용하지 못할 수도 있다.

### Oh My Tmux!의 옵션과 혼동하지 말 것

`tmux_conf_copy_to_os_clipboard=true`는 **Oh My Tmux!의 커스텀 변수**다. tmux 자체의 `set-clipboard` 옵션이 아니다. Oh My Tmux!가 `copy-pipe`와 `pbcopy`·`xclip`·`wl-copy` 같은 OS별 도구를 이용하는 복사 바인딩을 구성하도록 한다. 이런 도구는 **실행되는 호스트의 클립보드**를 대상으로 하며, 원격 Linux에서 실행했다고 Mac의 `pbcopy`가 실행되는 것은 아니다.

반면 `set-clipboard on`은 tmux 자체의 OSC52 연동이다. **OSC52의 목적지는 출력 경로에서 최종적으로 요청을 받아 처리하는 터미널**이다. 두 설정 모두 tmux Buffer 저장을 없애는 옵션이 아니며, 설정에 따라 Buffer와 OS 클립보드를 동시에 갱신할 수 있다.

따라서 Mac에서 이미 Copy Mode 복사가 잘 된다면 Oh My Tmux!의 옵션을 무조건 켤 필요는 없다. 실제 동작은 `tmux show -s set-clipboard`와 현재 바인딩을 확인한다.

---

## 1. OSC52 경로 — `set-clipboard`

### OSC52 전송 조건

tmux가 OSC52로 클립보드를 갱신하려면 다음이 모두 충족돼야 한다.

1. **`set -s set-clipboard on`** — 기본값 `external`도 tmux 자체 복사는 OSC52로 보내지만, pane 내부 프로그램의 OSC52 요청을 허용하려면 `on`이 필요함.
2. **터미널의 Ms capability 인식** — `tmux info | grep Ms`로 확인. 터미널 종류와 tmux 버전에 따라 자동 인식 여부가 다르므로 실제 결과를 확인한다.
3. **`terminal-features`에 `clipboard` 등록** — `Ms`가 없다면 터미널 종류에 맞는 `terminal-features`를 추가해야 한다.

### 검증

```bash
# 1) 발사 회로 자체 확인 (set-clipboard 무관, 직접 OSC52 발사)
tmux set-buffer -w "한글─테스트"
sleep 0.5 && pbpaste     # → "한글─테스트" 나오면 회로 정상

# 2) 옵션/capability 점검
tmux show-options -gv set-clipboard           # 기대: on
tmux info | grep "Ms:"                        # OSC52 escape 형식 보여야 함
tmux show-options -g terminal-features        # xterm*:clipboard 포함 확인
```

### 함정 — Active client에만 발사된다

`tmux send-keys -X copy-selection-and-cancel`로 **detached 윈도우의 copy를 자동 trigger하면 OSC52가 발사되지 않는다.** OSC52는 "그 pane을 보고 있는 client의 PTY"로만 발사되기 때문. 자동 검증 스크립트에서는 `tmux set-buffer -w`로 회로 자체를 시험하는 게 깔끔하다.

### 결과: 깔끔한 tmux.conf

```tmux
## Copy mode
setw -g mode-keys vi
set -g set-clipboard on    # tmux copy → OSC52 → 시스템 클립보드 자동 전달
```

이 방식에서는 `copy-pipe-and-cancel "pbcopy"` 같은 OS별 바인딩이 필요하지 않다. 다만 기존에 설정한 바인딩이 자동으로 삭제되지는 않으므로 중복 실행 여부를 확인한다.

---

## tmux 단독 설정 — OMT 없이 클립보드 복사하기

Oh My Tmux!가 없어도 **tmux 내장 기능**만으로 시스템 클립보드에 복사할 수 있다. 복사한 텍스트는 기본적으로 tmux Buffer에 저장되며, 아래 설정은 시스템 클립보드로 보내는 **추가 경로**를 만든다.

### A. OSC52 — 복사할 때마다 터미널 클립보드로 전달

`~/.tmux.conf`:

```tmux
setw -g mode-keys vi
set -s set-clipboard on
```

이 방식은 tmux 자체의 OSC52 전송을 켠다. **Copy Mode의 기존 복사 키**(예: vi 모드에서 `y`로 복사하도록 바인딩된 환경)를 그대로 사용하면 된다. `y`는 tmux 기본 설정이나 배포 설정에 따라 바인딩이 다를 수 있으므로 `tmux list-keys -T copy-mode-vi`로 확인한다.

```text
Copy Mode 복사 ──┬── tmux Buffer
                 └── OSC52 → (중간 tmux/SSH) → Ghostty → Mac 클립보드
```

OSC52는 tmux가 실행되는 OS의 클립보드 도구를 호출하지 않는다. 따라서 원격 tmux에서 복사한 데이터를 로컬 Mac 클립보드로 전달하려는 경우에도 적합하지만, **중간 tmux의 처리 및 터미널의 허용 설정**이 필요하다.

### B. copy-pipe — macOS에서 pbcopy를 직접 실행

Mac에서 실행되는 tmux에 다음처럼 설정할 수 있다.

```tmux
setw -g mode-keys vi
bind -T copy-mode-vi y send-keys -X copy-pipe-and-cancel "LANG=ko_KR.UTF-8 pbcopy"
```

Copy Mode에서 `y`를 누르면 선택 텍스트를 tmux Buffer에 저장하면서 `pbcopy`의 stdin으로도 전달한다. 이 설정은 **`y` 바인딩을 덮어쓰므로**, OSC52와의 중복 연동을 원하지 않으면 설정을 함께 점검한다. 원격 Linux에서 `pbcopy`를 실행할 수 있다고 가정하면 안 된다.

### C. 내부 복사와 OS 클립보드 복사를 별도 키로 분리 (macOS)

Mac에서 tmux Buffer는 평소처럼 사용하고, 필요할 때만 OS 클립보드에 보내고 싶다면:

```tmux
setw -g mode-keys vi
set -s set-clipboard off
bind -T copy-mode-vi y send-keys -X copy-selection-and-cancel
bind -T prefix Y run-shell 'tmux save-buffer - | LANG=ko_KR.UTF-8 pbcopy'
```

- Copy Mode에서 `y`: **tmux Buffer에만** 복사
- `Prefix + Y` (대문자): **최근 tmux Buffer**를 `pbcopy`로 전달
- `Prefix + ]`: tmux Buffer를 현재 pane에 붙여넣기
- Ghostty의 `Cmd + V`: macOS 클립보드를 터미널에 입력

여기서 `set-clipboard external`도 tmux 자체 복사를 OSC52로 전송하므로 **내부 복사와 OS 클립보드 복사를 분리하는 설정으로는 사용할 수 없다**. 아래 분리 예시에서는 `off`를 사용한다. `off`를 쓰면 pane 내부 Neovim 등의 OSC52도 tmux에서 차단될 수 있으므로, 두 동작을 동시에 원한다면 별도의 조건부 바인딩이나 설정 설계가 필요하다. `Prefix + Y`는 예시로 만든 **사용자 정의 바인딩**이며 OMT의 기본 단축키와 다르다.

### 적용 및 확인

```sh
tmux source-file ~/.tmux.conf
tmux show -s set-clipboard
tmux list-keys -T copy-mode-vi | grep -E ' y |copy'
tmux list-keys -T prefix | grep ' Y '
tmux info | grep 'Ms:'
```

실행 중인 tmux 서버의 **실제 옵션과 바인딩**을 확인해야 한다. OMT 사용 여부만으로 OSC52 동작을 단정할 수 없다.

---

## 2. pbcopy 경로를 써야 한다면 — LANG 인라인 필수

터미널 OSC52 처리에 의심이 가거나, 정책상 pbcopy 직호출을 유지해야 한다면 한글 깨짐을 막기 위한 처방이 필요하다.

### 증상 — `‚îÄ` 시그니처

tmux에서 한글이 든 영역을 복사해 다른 곳에 붙여넣을 때 `‚îÄ‚îÄ‚îÄ` 같은 패턴으로 깨진다면, `pbcopy`가 입력을 **MacRoman으로 해석**해버린 것이다. tmux server가 셸의 `LANG`을 상속받지 못해 발생한다.

`─` (U+2500, BOX DRAWINGS LIGHT HORIZONTAL)의 UTF-8 바이트는 `E2 94 80`. 이 3바이트를 MacRoman으로 해석하면 정확히 `‚îÄ`가 된다. 즉 **입력은 UTF-8인데 디코딩은 MacRoman으로 한 결과**라는 명확한 시그니처다.

### 진단

`pbcopy`는 `LANG`/`LC_CTYPE`이 없으면 `__CF_USER_TEXT_ENCODING` 환경변수를 보는데, 그 값이 `0x1F5:0x0:0x0`처럼 마지막 두 필드가 `0x0`이면 MacRoman으로 fallback한다.

```bash
# tmux server 환경에 LANG이 있는지 확인 (없으면 범인)
tmux show-environment -g | grep -i lang

# 같은 경로 재현
printf '한글─테스트\n' | env -u LANG -u LC_ALL -u LC_CTYPE pbcopy
pbpaste   # → ÌïúÍ∏Ä‚îÄÌÖåÏä§Ìä∏  (깨짐)

printf '한글─테스트\n' | LANG=ko_KR.UTF-8 pbcopy
pbpaste   # → 한글─테스트       (정상)
```

셸에서 직접 `pbcopy`는 멀쩡한데 tmux 복사만 깨지는 비대칭이 핵심 단서다. 셸엔 `LANG`이 있고 tmux server엔 없으니까.

### 해결 — copy-pipe에 LANG 인라인

```tmux
# ~/.tmux.conf
bind -T copy-mode-vi Enter             send -X copy-pipe-and-cancel "LANG=ko_KR.UTF-8 pbcopy"
bind -T copy-mode-vi MouseDragEnd1Pane send -X copy-pipe-no-clear   "LANG=ko_KR.UTF-8 pbcopy"
bind -T copy-mode    MouseDragEnd1Pane send -X copy-pipe-no-clear   "LANG=ko_KR.UTF-8 pbcopy"
```

적용은 `tmux source-file ~/.tmux.conf`로 즉시 가능. tmux server 재시작 불필요.

### OSC52와 pbcopy 경로 분리 검증

같은 `‚îÄ` 시그니처가 OSC52에서 나오는 건지, pbcopy에서 나오는 건지 헷갈리기 쉽다. **`tmux set-buffer -w`는 set-clipboard 설정과 무관하게 OSC52만 단독으로 발사**하므로, 이걸로 터미널 자체의 OSC52 한글 처리 능력을 깔끔하게 분리해 시험할 수 있다.

```bash
# OSC52 단독 테스트 (tmux의 copy-pipe pbcopy 경로를 안 거침)
tmux set-buffer -w "한글─테스트"
sleep 0.5 && pbpaste
# → "한글─테스트"가 정상으로 나오면 터미널 OSC52는 무죄
```

Ghostty 1.3.1 + tmux 3.6a 환경에서 직접 확인했을 때 OSC52는 한글을 멀쩡히 처리했다. **그러니 OSC52를 의심하기 전에 pbcopy 경로의 LANG부터 의심하라.** 두 원인은 같은 mojibake 시그니처를 만들어서 외관만으로는 구분이 안 된다.

---

## 3. 비대칭의 정체 — tmux server는 환경을 캡처해서 영구 보관한다

tmux server는 **처음 시작될 때의 환경을 전역 환경으로 복사**한다. 이후 세션 환경과 서버 전역 환경은 별도로 관리되며 `set-environment` 등으로 변경할 수 있다. 따라서 초기 환경이 잘못되었다고 해서 서버를 반드시 종료해야 하는 것은 아니다.

```bash
# server에 박힌 환경 (시작 시점에 고정)
tmux show-environment -g | grep -E "LANG|PATH"

# 그 환경이 server가 자식 프로세스(copy-pipe의 pbcopy 등) 띄울 때 사용됨
echo "$LANG"                          # 셸: ko_KR.UTF-8
tmux run-shell 'echo $LANG'           # tmux 자식: 비어있을 수 있음 ← 불일치
```

### 어떤 변수가 자동 갱신되는가

`update-environment` 옵션에 등록된 변수만 새 client attach마다 갱신된다. 기본값(tmux 3.x):

```text
DISPLAY KRB5CCNAME SSH_ASKPASS SSH_AUTH_SOCK
SSH_AGENT_PID SSH_CONNECTION WINDOWID XAUTHORITY
```

**`LANG`은 없다.** `update-environment`는 새 클라이언트 연결 시 세션 환경을 갱신하는 옵션이지 서버 전역 환경을 자동으로 덮어쓰는 기능이 아니다. 세션과 전역 환경의 차이를 확인해야 한다.

```tmux
# ~/.tmux.conf
set -g update-environment "LANG LC_ALL LC_CTYPE DISPLAY SSH_AUTH_SOCK SSH_CONNECTION"
```

또는 server 시작 전부터 강제로 박기:

```tmux
set-environment -g LANG "ko_KR.UTF-8"
```

### 진단/복구 명령

```bash
tmux show-environment -g              # server 전역 환경
tmux show-environment                  # 현재 session 환경
tmux show-options -g update-environment

# 잘못된 server 자체를 끊고 새 환경으로 다시 시작
tmux kill-server                       # 최후의 수단: 모든 세션 종료, 작업 손실 주의
```

### 함정 요약

| 증상 | 원인 |
|---|---|
| 셸 `pbcopy`는 OK, tmux 안에서만 깨짐 | server에 LANG 없음 |
| 어제까진 멀쩡했는데 오늘부터 깨짐 | 어제 사이 tmux server가 재시작됨(재부팅/`pkill tmux`/Ghostty 첫 spawn 등) |
| `~/.tmux.conf` reload해도 변화 없음 | server 환경은 conf reload로 안 바뀜, `tmux set-environment -g` 필요 |

---

## 왜 갑자기 깨졌나 — 2단계 함정

1. **OSC52 경로**: `set-clipboard`가 `on` 또는 `external`이고 터미널이 지원하면 tmux 자체 복사는 OSC52로 전달될 수 있다. Base64 인코딩을 사용하지만 터미널·중간 계층의 구현에 따라 문제는 발생할 수 있다.
2. **OSC52 우회 도입**: 터미널의 OSC52 한글 처리 버그를 (실제로든 의심으로든) 만나 `set -g set-clipboard off`로 끄고 `pbcopy` 직호출로 전환 → 이때 **LANG 누락이라는 두 번째 함정**이 드러남.

즉 "원래 멀쩡했는데 어느 날 깨지더라"는 보통 클립보드 경로 자체가 OSC52 → pbcopy로 바뀐 순간이다. **가능하다면 OSC52 경로를 우선 검토한다.** 다만 현재 동작하는 설정을 무조건 바꾸지 말고 실제 `set-clipboard`, `Ms`, 터미널 권한과 키 바인딩을 확인한다.

## 참고

- `pbcopy(1)` 맨페이지: stdin을 시스템 페이스트보드에 넣을 때 LANG/LC_CTYPE을 본다.
- `tmux set-buffer -w`: OSC52 직접 발사 (set-clipboard 옵션 무관).
- 터미널 OSC52가 한글을 정상 처리한다면 `set-clipboard off`를 빼도 무방하지만, pbcopy 경로가 이미 잘 동작하면 굳이 이중 발사로 바꿀 실익은 없다.

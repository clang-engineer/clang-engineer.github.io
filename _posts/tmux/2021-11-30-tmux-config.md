---
title       : "tmux 기본 조작 Cheat Sheet — session·window·pane"
description : "tmux의 session·window·pane 구조, attach/detach, 기본 키, copy-mode, target 문법을 빠르게 확인하는 입문용 조작 Reference. 설정·플러그인은 별도 글로 분리한다."
date        : 2021-11-30 22:50:30 +0900
updated     : 2026-10-07 00:00:00 +0900
categories  : [tmux, "구조·개념"]
tags        : [terminal, cheatsheet]
pin         : false
hidden      : false
---

tmux는 하나의 terminal 안에서 여러 작업 공간을 유지하는 **terminal multiplexer**다. 기본 구조는 아래처럼 잡으면 된다.

```text
session
└─ window
   └─ pane
```

- **session**: tmux가 유지하는 작업 묶음. detach해도 background에 남는다.
- **window**: session 안의 탭 같은 단위.
- **pane**: window 안에서 분할된 실제 shell/process 영역.

> 이 글은 [tmux 로드맵](./2026-06-16-tmux-roadmap.md)의 **입문 Reference**다. `.tmux.conf` 설정은 [tmux 유용한 설정 정리](./2026-02-21-tmux-tips.md), TPM 플러그인은 [tmux 설정 & 플러그인 설명](./2025-11-17-tmux-tpm.md), 세션 자동화는 [tmux 세션 부트스트랩](./2026-02-21-tmux-bootstrap.md)에서 이어진다.
{: .prompt-tip }

---

## 설치와 설정 파일

```bash
brew install tmux         # macOS
sudo apt-get install tmux # Ubuntu
sudo yum install tmux     # CentOS
```

설정 파일은 보통 `~/.tmux.conf`에 둔다. 현재 server에 다시 읽히려면 다음을 실행한다.

```bash
tmux source-file ~/.tmux.conf
```

---

## session

### 생성

```bash
tmux
tmux new
tmux new-session
tmux new -s work
```

### 접속 / 분리

```bash
tmux attach
tmux attach-session
tmux a
tmux a -t work
```

| 키 | 설명 |
|---|---|
| `Ctrl+b` `d` | 현재 session detach |
| `Ctrl+b` `$` | session 이름 변경 |
| `Ctrl+b` `)` | 다음 session |
| `Ctrl+b` `(` | 이전 session |
| `Ctrl+b` `w` | session/window 목록 |

### 종료

```bash
tmux kill-session
tmux kill-session -t work
```

전체 tmux server를 종료하려면 다음을 쓴다.

```bash
tmux kill-server
```

---

## window

window는 session 안의 탭 같은 단위다.

| 키 | 설명 |
|---|---|
| `Ctrl+b` `c` | 새 window 생성 |
| `Ctrl+b` `n` | 다음 window |
| `Ctrl+b` `p` | 이전 window |
| `Ctrl+b` `l` | 마지막으로 사용한 window |
| `Ctrl+b` `0`~`9` | 번호로 이동 |
| `Ctrl+b` `'` | 번호/이름 입력 후 이동 |
| `Ctrl+b` `,` | window 이름 변경 |
| `Ctrl+b` `.` | window 번호 변경 |
| `Ctrl+b` `&` | window 종료 |
| `Ctrl+b` `f` | window 검색 |
| `Ctrl+b` `z` | 현재 pane 확대/축소 |

---

## pane

pane은 window 안에서 분할된 실제 process 영역이다.

| 키 | 설명 |
|---|---|
| `Ctrl+b` `%` | 좌우 분할 |
| `Ctrl+b` `"` | 상하 분할 |
| `Ctrl+b` 방향키 | pane 이동 |
| `Ctrl+b` `o` | 다음 pane |
| `Ctrl+b` `;` | 이전 pane |
| `Ctrl+b` `{` / `}` | pane 위치 이동 |
| `Ctrl+b` `!` | pane을 새 window로 분리 |
| `Ctrl+b` `x` | pane 종료 |
| `Ctrl+b` `q` | pane 번호 표시 |

크기 조절은 명령 프롬프트(`Ctrl+b` `:`)에서 실행할 수 있다.

```tmux
resize-pane -D 10
resize-pane -U 10
resize-pane -L 10
resize-pane -R 10
```

---

## copy-mode와 scroll

| 키 | 설명 |
|---|---|
| `Ctrl+b` `[` | copy-mode 진입 / scroll 시작 |
| `Ctrl+b` `]` | paste buffer 붙여넣기 |
| `q` | copy-mode 종료 |

vi 스타일 copy-mode를 쓰려면 설정에 아래 한 줄을 둔다.

```tmux
setw -g mode-keys vi
```

vi key 기준 기본 조작은 다음과 같다.

| 키 | 설명 |
|---|---|
| `Space` | 선택 시작 |
| `Enter` | 선택 복사 |
| `Esc` | 선택 취소 |
| `h`/`j`/`k`/`l` | 이동 |
| `g` / `G` | 위/아래 끝 이동 |
| `/` | 검색 |
| `#` | paste buffer 목록 |

마우스 scroll과 pane 선택이 필요하면 설정에 다음을 추가한다.

```tmux
set -g mouse on
```

---

## target 문법: `session:window.pane`

`join-pane`, `swap-pane`, `move-window` 같은 명령은 대상을 주소로 지정한다.

```text
session:window.pane
```

예를 들어 `work:2.1`은 `work` session의 2번 window, 1번 pane을 뜻한다. 생략한 자리는 현재 위치로 채워진다.

```text
-t 1      현재 session의 window 1
-t .1     현재 window의 pane 1
-t work:2 work session의 window 2
```

핵심은 `-s`와 `-t`다.

- `-s`는 **source**, 움직이는 대상이다.
- `-t`는 **target**, 도착지다.
- `swap-*` 계열은 자리 교환이라 방향성이 약하지만, 그래도 source/target 주소를 명시하면 실수가 줄어든다.

---

## window·pane 이동 명령

명령 프롬프트(`Ctrl+b` `:`)나 shell에서 실행할 수 있다.

```tmux
join-pane -s 2 -t 1      # window 2의 pane을 window 1로 이동
join-pane -h -s 2 -t 1   # 오른쪽에 붙이기(-h). -v는 아래
join-pane -b -s 2 -t 1   # before: 반대쪽에 붙이기
break-pane -s 1 -t 2     # pane을 다른 window로 분리
swap-pane -s 1 -t 2      # pane 자리 교환
swap-window -s 1 -t 2    # window 자리 교환
move-window -s 1 -t 5    # window 1을 빈 번호 5로 이동
move-window -r           # window 번호를 빈칸 없이 재정렬
```

> pane을 "합친다"고 말하기 쉽지만, 실제로는 살아 있는 process를 다른 window로 **이동**하는 것이다. 이 정신 모델은 [tmux엔 왜 pane '병합(merge)'이 없을까](./2026-07-13-tmux-pane-is-a-process-no-merge.md)에서 더 자세히 다룬다.
{: .prompt-info }

---

## 다음에 볼 글

| 목적 | 글 |
|---|---|
| 체감 설정 정리 | [tmux 유용한 설정 정리](./2026-02-21-tmux-tips.md) |
| TPM과 필수 플러그인 | [tmux 설정 & 플러그인 설명](./2025-11-17-tmux-tpm.md) |
| 추가 플러그인 선택 | [필수 그다음 — 요즘 얹는 tmux 플러그인](./2026-07-11-tmux-plugins-beyond-essentials.md) |
| 세션 자동 생성 | [tmux 세션 부트스트랩](./2026-02-21-tmux-bootstrap.md) |
| 전체 학습 순서 | [tmux 로드맵](./2026-06-16-tmux-roadmap.md) |

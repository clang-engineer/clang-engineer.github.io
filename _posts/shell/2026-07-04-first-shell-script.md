---
title       : "첫 셸 스크립트 만들고 실행하기 — shebang·실행 권한·PATH"
description : "터미널에 치던 명령을 파일 하나로 묶어 실행하기까지. shebang이 하는 일, `chmod +x` 실행 권한, `./script.sh`에서 `./`가 왜 필요한지, PATH에 등록해 어디서나 부르는 법, 그리고 permission denied·command not found·CRLF 같은 첫날 함정까지."
date        : 2026-07-04 09:00:00 +0900
updated     : 2026-09-05 21:18:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [bash, zsh, shell, scripting, shebang]
pin         : false
hidden      : false
---

터미널에 명령을 한 줄씩 치는 것과, 그 명령들을 **파일 하나로 묶어 실행**하는 것 사이에는 작지만 분명한 문턱이 있다. shebang은 뭐고, 왜 `chmod +x`를 해야 하고, 왜 `script.sh`가 아니라 `./script.sh`로 불러야 하는가 — 이 첫걸음을 넘고 나면 [셸 스크립트 문법 종합 가이드](/posts/shell/2026-07-03-bash-syntax-guide/)의 문법이 얹힐 바닥이 생긴다. 이 글은 딱 그 문턱을 넘는 데까지만 다룬다.

## 가장 짧은 스크립트

빈 파일 `hello.sh`를 만들고 두 줄을 넣는다.

```bash
#!/usr/bin/env bash
echo "hello, $(whoami)"
```

이걸 실행하는 방법은 세 가지다. 셋의 차이가 이 글의 본론이다.

```bash
bash hello.sh     # (1) 인터프리터를 직접 지정
./hello.sh        # (2) 파일 자체를 실행 (권한 필요)
hello             # (3) PATH에 등록해 어디서나
```

## shebang — 첫 줄 `#!`가 하는 일

첫 줄 `#!/usr/bin/env bash`를 **shebang**(셔뱅)이라 부른다. `#!`로 시작하는 이 줄은 "이 파일을 실행할 때 **어떤 인터프리터에 넘길지**"를 커널에게 알려준다.

`./hello.sh`처럼 파일을 직접 실행하면, 커널이 첫 줄을 읽어 `/usr/bin/env bash hello.sh`로 바꿔 실행한다. shebang이 없으면 커널은 이 파일을 무엇으로 돌려야 할지 몰라, 셸이 대신 자기(sh/bash)로 실행을 시도한다 — 운 좋으면 되지만, 의도한 인터프리터라는 보장이 없다.

`#!/bin/bash`가 아니라 `#!/usr/bin/env bash`를 쓰는 이유:

> `env bash`는 PATH에서 `bash`를 찾아 실행한다. bash 위치가 시스템마다 다를 때(예: Homebrew로 설치한 최신 bash는 `/opt/homebrew/bin/bash`, 시스템 bash는 `/bin/bash`) `env`가 알아서 골라준다. 반면 `#!/bin/bash`는 경로를 못 박아, 그 위치에 없으면 깨진다. **이식성이 필요하면 `env`, 위치를 확정하고 싶으면 절대경로** — 요즘 관행은 `env` 쪽이다.
{: .prompt-tip }

macOS에서 특히 주의할 점: mac 기본 셸은 **zsh**지만, 시스템에 딸려 오는 `/bin/bash`는 오래된 3.2 계열이다. 스크립트에 bash 4+ 문법(연관 배열 `declare -A` 등)을 쓴다면 Homebrew bash를 설치하고 shebang을 `#!/usr/bin/env bash`로 두어 PATH의 bash가 잡히게 할 수 있다.

## `chmod +x` — 실행 권한

`./hello.sh`로 실행하려면 파일에 **실행 권한**이 있어야 한다. 갓 만든 파일엔 없어서, 그냥 실행하면 이렇게 막힌다.

```console
$ ./hello.sh
zsh: permission denied: ./hello.sh
```

`chmod +x`로 실행 비트를 켠다.

```bash
chmod +x hello.sh
./hello.sh          # 이제 실행됨
```

`ls -l`로 보면 권한 문자열에 `x`가 붙은 걸 확인할 수 있다.

```console
$ ls -l hello.sh
-rwxr-xr-x  1 user  staff  38  7  4 09:00 hello.sh
```

`bash hello.sh`로 실행할 때는 권한이 필요 없다. 이 경우 파일을 "실행"하는 게 아니라, bash에게 "이 파일을 읽어서 처리해"라고 넘기는 것이기 때문이다. shebang도 이때는 그냥 주석(`#`)으로 무시된다.

## `./`는 왜 붙이나 — PATH 이야기

권한까지 줬는데도 이름만으로는 안 된다.

```console
$ hello.sh
zsh: command not found: hello.sh
$ ./hello.sh
hello, user
```

이유는 **PATH**다. 셸은 명령 이름을 받으면 PATH에 나열된 디렉토리들만 뒤져 실행 파일을 찾는다. 현재 디렉토리(`.`)는 보통 PATH에 넣지 않는다. 현재 디렉토리를 무조건 탐색하게 하면 이름이 같은 실행 파일을 의도치 않게 실행할 위험이 있기 때문이다.

그래서 "지금 이 폴더에 있는 이 파일을 실행하라"를 명시적으로 말해야 하고, 그게 `./`다. `.`은 현재 디렉토리, `./hello.sh`는 "현재 디렉토리의 hello.sh".

## PATH에 등록해 어디서나 부르기

`./`도 매번 붙이기 번거롭고, 진짜 도구라면 아무 데서나 이름만으로 부르고 싶다. 그러려면 스크립트를 **PATH에 있는 디렉토리**에 두면 된다. 개인 스크립트는 보통 `~/bin`이나 `~/.local/bin`에 모은다.

```bash
mkdir -p ~/.local/bin
mv hello.sh ~/.local/bin/hello
```

그리고 이 디렉토리를 PATH에 추가한다.

```bash
# ~/.zshrc (zsh) 또는 ~/.bashrc (bash)
export PATH="$HOME/.local/bin:$PATH"
```

새 셸을 열거나 현재 셸의 초기화 파일을 다시 읽으면, 이제 어느 폴더에서든 `hello`로 실행된다.

> `.sh` 확장자는 **필수가 아니다.** 셸은 확장자보다 실행 권한과 shebang을 본다. PATH에 넣는 "명령"은 `git`·`ls`처럼 확장자 없이 두는 경우가 많고, 다른 스크립트가 `source`로 읽는 라이브러리성 파일은 `.sh`를 붙여 구분하기도 한다.
{: .prompt-info }

## 첫날 흔한 함정

| 증상 | 원인 | 해결 |
|---|---|---|
| `permission denied` | 실행 권한 없음 | `chmod +x script.sh` |
| `command not found` | PATH에 없는데 이름만 부름 | `./script.sh` 또는 PATH 등록 |
| `bad interpreter: ... ^M` | Windows에서 만든 파일의 CRLF 줄바꿈 | 에디터에서 LF로 저장하거나 줄바꿈 변환 |
| shebang 무시됨 | `#!`가 첫 줄 첫 칸이 아님 | shebang을 파일 맨 첫 줄로 |
| 문법은 맞는데 이상 동작 | `sh script.sh`로 bash 확장 문법 실행 | `bash script.sh` 또는 `./`로 shebang 사용 |

특히 `bad interpreter: ...^M`은 Windows나 웹에서 복사해 온 스크립트에서 자주 나온다. CRLF 줄바꿈의 `\r`이 shebang 경로 끝에 붙어 `/usr/bin/env bash\r`라는 없는 인터프리터를 찾는 문제다. 이 경우 파일의 줄바꿈을 LF로 바꾸면 된다.

## 여기까지 오면

명령을 파일로 묶고, 실행 권한을 주고, `./`나 PATH로 실행하는 — 스크립트의 **실행 골격**이 잡혔다. 이제 그 안을 채우는 문법(변수·조건·반복·함수)이 필요하다. [셸 스크립트 문법 종합 가이드](/posts/shell/2026-07-03-bash-syntax-guide/)로 이어서, `set -euo pipefail`로 견고하게 만드는 데까지가 [셸 로드맵](/posts/shell/2026-07-03-shell-roadmap/)의 다음 걸음이다.

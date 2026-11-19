---
title       : zoxide로 디렉토리 이동 빠르게 — autojump 대체
description : "cd로 경로를 매번 다 치는 대신, 방문 기록(frecency)으로 디렉토리를 점프하는 zoxide. 설치·셸 연동부터 z/zi 사용법, autojump에서 갈아타기, fzf 연동까지 정리한다."
date        : 2026-07-03 20:00:00 +0900
updated     : 2026-11-19 00:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [zoxide, autojump, fzf, zsh, bash]
pin         : false
hidden      : false
---

## zoxide로 디렉토리 이동 빠르게

터미널에서 하루에도 수십 번 하는 `cd`는 은근히 손이 많이 갑니다.
`cd ~/work/project/backend/src/main` 같은 경로를 매번 다 치거나 탭 자동완성을 여러 번 눌러야 하죠.

`zoxide`는 **한 번이라도 가본 디렉토리라면 이름 일부만으로 점프**하게 해주는 도구입니다.
`cd`를 없애는 게 아니라, 자주 가는 곳으로 가는 지름길을 얹는다고 보면 됩니다.

반복해서 찾는 명령·진단표는 [devkit zoxide Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/zoxide.md)를 기준으로 본다. 여기서는 이동 방식을 바꾸는 이유와 셸 연동의 경계를 함께 설명한다.

---

## 1. 어떻게 동작하나 — frecency

zoxide는 셸이 방문한 디렉토리를 데이터베이스에 기록하고, **frecency** 점수로 순위를 매깁니다.

> **frecency = frequency(얼마나 자주) + recency(얼마나 최근에)**
>
> 자주 가면서 최근에도 간 디렉토리일수록 점수가 높습니다.
{: .prompt-info }

그래서 `z proj`라고 치면, `proj`가 들어간 디렉토리 중 **점수가 가장 높은 한 곳**으로 바로 이동합니다.
경로 전체를 기억할 필요 없이, 특징적인 단어 하나만 기억하면 됩니다.

기존에 `autojump`나 `z`를 써봤다면 같은 계열입니다. zoxide는 Rust로 다시 쓴 후발주자로, 여러 셸을 지원하고 속도가 빠릅니다.

---

## 2. 설치와 셸 연동

macOS 기준 Homebrew로 설치합니다.

```sh
brew install zoxide
# 대화형 선택(zi)을 쓰려면 fzf도 함께
brew install fzf
```

설치 후 셸 설정 파일에 초기화 코드를 추가합니다. [공식 설치 안내](https://github.com/ajeetdsouza/zoxide#installation)는 zoxide 초기화를 설정 파일 끝에 두도록 권장합니다. 모든 도구의 `eval`에 일괄 적용되는 규칙은 아니며, 다른 연동의 로드 순서도 함께 확인해야 합니다.

```sh
# ~/.zshrc
eval "$(zoxide init zsh)"
```

bash라면 `~/.bashrc`에 아래처럼 넣습니다.

```sh
# ~/.bashrc
eval "$(zoxide init bash)"
```

fish라면 `~/.config/fish/config.fish`에서 다음 구문을 사용합니다.

```fish
zoxide init fish | source
```

설정한 셸을 새로 열면 준비 끝입니다. 기본 초기화는 셸의 프롬프트·디렉터리 변경 관련 훅에 연결되어 방문 경로를 기록합니다. 구체적인 훅은 셸과 초기화 옵션에 따라 다릅니다.

### 2026-11-19 보강 — 설치했는데 왜 `z`는 따로 등록할까

`zoxide`는 설치된 외부 실행 파일이지만, 기본 초기화로 생기는 `z`와 `zi`는 **현재 셸에서 실행하는 함수**입니다. `zoxide query`는 목적지 경로를 계산해 출력할 수 있어도 부모 셸의 작업 디렉터리를 직접 바꾸지는 못합니다. 그 경로로 현재 셸의 `cd`를 수행하는 부분이 셸 함수에 필요합니다.

`zoxide init zsh`의 `init`과 `zsh`는 zoxide가 해석하는 인자입니다. 이 호출만으로 현재 셸에 함수가 등록되는 것은 아닙니다. 출력된 코드를 Zsh에서는 `eval`, fish에서는 `source`로 실행해야 이동 함수와 기록 훅이 연결됩니다. [`eval`·`source`의 실행 경계](./2026-07-03-bash-syntax-guide.md#2026-11-19-보강--eval로-초기화-코드를-현재-셸에-읽기)를 이해하면 초기화 한 줄이 하는 일이 보입니다.

따라서 Zsh에서 fish로 옮길 때 zoxide 실행 파일을 다시 만들 필요는 없습니다. 초기화 코드를 fish용으로 바꾸면 됩니다. 데이터 저장 경로가 같다면 기존 방문 기록도 공유합니다. **이식하는 것은 이동 알고리즘이 아니라 셸과의 연결부**입니다.

---

## 3. 기본 사용법 — z, zi

초기화하면 두 개의 명령이 생깁니다.

| 명령 | 동작 |
| --- | --- |
| `z <키워드>` | 키워드에 맞는 최고 점수 디렉토리로 바로 이동 |
| `zi <키워드>` | 후보가 여럿일 때 fzf로 골라서 이동 (interactive) |

```sh
z backend        # ...matching 'backend' 중 최고 점수 디렉토리로 점프
z proj src       # 여러 키워드 — 'proj'와 'src'를 모두 포함하는 경로
zi proj          # 후보 목록을 fzf로 띄워 직접 선택
```

일반 `cd`처럼 쓸 수 있는 형태도 그대로 동작합니다.

```sh
z ..             # 상위 디렉토리
z -              # 직전 디렉토리
z ~/work         # 절대/상대 경로를 주면 그냥 cd처럼 이동
```

> `z`가 엉뚱한 곳으로 가면, 그 디렉토리는 아직 점수가 낮은 것뿐입니다.
> 몇 번 더 방문하면 순위가 올라가 원하는 곳이 1순위가 됩니다.
{: .prompt-tip }

### cd를 아예 대체하고 싶다면

손에 익은 `cd`를 그대로 쓰면서 점프 기능만 얹고 싶다면 `--cmd` 옵션으로 `cd`를 덮어쓸 수 있습니다.

```sh
# ~/.zshrc
eval "$(zoxide init zsh --cmd cd)"
```

이러면 `cd`가 zoxide 버전이 되고, 대화형은 `cdi`가 됩니다. 별도 명령을 새로 외울 필요가 없어집니다.

---

## 4. autojump에서 갈아타기

이미 `autojump`를 쓰고 있었다면 그동안 쌓인 방문 기록을 그대로 가져올 수 있습니다.

```sh
# autojump 데이터베이스를 zoxide로 임포트
zoxide import --from=autojump ~/Library/autojump/autojump.txt
```

기존 `z`(rupa/z) 사용자라면 `~/.z` 파일을 임포트합니다.

```sh
zoxide import --from=z ~/.z
```

임포트 후에는 셸 설정에서 **autojump 초기화 라인을 제거**해 둘이 충돌하지 않게 합니다.
(예전 `[[ -s .../autojump.sh ]] && source .../autojump.sh` 같은 줄)

---

## 5. 데이터베이스 직접 다루기

zoxide의 기록은 명령으로 조회·편집할 수 있습니다.

| 명령 | 동작 |
| --- | --- |
| `zoxide query <키워드>` | 매칭되는 최고 점수 경로를 출력(이동은 안 함) |
| `zoxide query -l` | 기록된 전체 디렉토리를 점수 순으로 나열 |
| `zoxide add <경로>` | 경로를 수동으로 등록 |
| `zoxide remove <경로>` | 잘못 쌓였거나 사라진 경로를 제거 |
| `zoxide edit` | fzf에서 점수를 조정하거나 항목을 제거 |

```sh
zoxide query -l        # 지금 내 점프 목록이 어떻게 쌓였는지 확인
zoxide remove ~/tmp/throwaway   # 지워진 임시 디렉토리 정리
```

특정 경로가 검색 상단에 계속 나오면 `zoxide edit`에서 직접 순위를 조정할 수 있습니다.

| 키 | 동작 |
| --- | --- |
| `Ctrl-S` | 선택한 경로의 점수를 1 낮춤 |
| `Ctrl-D` | 선택한 경로를 데이터베이스에서 삭제 |
| `Ctrl-W` | 선택한 경로의 점수를 1 높임 |
| `Enter` | 편집 종료 |

경로를 완전히 제거하려면 대화형 편집기 대신 정확한 경로를 지정해도 됩니다.

```sh
zoxide remove "/삭제할/정확한/경로"
```

`z`가 이상하게 동작할 때 `zoxide query -l`로 상태를 들여다보면 원인이 대개 보입니다.

---

## 마무리

zoxide는 "경로를 다 기억하지 말고, 특징 단어 하나로 점프한다"는 작은 습관 하나를 바꿔줍니다.
정리하면:

- `brew install zoxide` → `eval "$(zoxide init zsh)"` 한 줄이면 준비 끝
- `z 키워드`로 점프, 후보가 많으면 `zi`로 골라서 이동
- `cd`째로 대체하려면 `--cmd cd`
- autojump/z 사용자는 `zoxide import`로 기록 이관

자주 오가는 프로젝트가 서너 개만 돼도 체감이 확실히 옵니다.

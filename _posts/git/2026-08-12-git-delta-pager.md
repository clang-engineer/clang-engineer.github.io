---
title       : "git-delta 사용법 — Git diff를 읽기 좋게 만드는 pager"
description : "delta가 Git과 pager 사이에서 하는 일, core.pager와 interactive.diffFilter의 차이, line-numbers·navigate·side-by-side·syntax-theme 선택 기준과 문제 해결법을 정리한다."
date        : 2026-08-12 18:00:00 +0900
updated     : 2026-08-12 18:00:00 +0900
categories  : [git, "도구·워크플로"]
tags        : [git, delta, diff, pager, cli]
pin         : false
hidden      : false
---

`git diff`는 정확하지만 큰 변경을 읽기에는 거칠다. 파일 경계와 hunk를 눈으로 찾아야 하고, 추가·삭제된 코드도 언어 문법과 무관한 한 가지 색으로 보인다. **git-delta**는 이 출력을 구문 강조, 행 번호, 파일·hunk 장식으로 다시 그려 주는 도구다.

먼저 역할을 분명히 해야 한다. delta는 diff를 계산하지 않는다. 어떤 줄이 바뀌었는지는 Git이 결정하고, delta는 그 결과를 표현한다. C++ 프로그램으로 보면 비교 알고리즘이 아니라 출력 formatter에 가깝다.

```text
Git이 diff 생성 → delta가 렌더링 → less가 화면 표시와 탐색 담당
```

이 구조를 알면 `core.pager`, `interactive.diffFilter`, `| delta`가 왜 서로 다른지 이해하기 쉽다.

## 설치와 기본 설정

macOS에서는 패키지 이름이 `git-delta`, 실행 파일 이름이 `delta`다.

```bash
brew install git-delta
delta --version
```

`~/.gitconfig`에는 다음 정도면 충분하다.

```ini
[core]
    pager = delta

[interactive]
    diffFilter = delta --color-only

[delta]
    navigate = true
    line-numbers = true
    side-by-side = false
    syntax-theme = Monokai Extended

[merge]
    conflictStyle = zdiff3
```

`git config --global`로 같은 설정을 넣을 수도 있다.

```bash
git config --global core.pager delta
git config --global interactive.diffFilter 'delta --color-only'
git config --global delta.navigate true
git config --global delta.line-numbers true
git config --global delta.side-by-side false
git config --global delta.syntax-theme 'Monokai Extended'
git config --global merge.conflictStyle zdiff3
```

## 평소 Git 명령은 그대로 쓴다

`core.pager = delta`를 설정했다면 별도의 delta 명령을 외울 필요가 없다.

```bash
git diff                 # working tree ↔ index
git diff --staged        # index ↔ HEAD
git show                 # 특정 commit과 patch
git log -p               # commit history와 patch
git diff main...HEAD     # merge-base 기준 branch 변경
```

저장소 밖의 파일 두 개도 Git의 diff 계산과 delta 출력을 함께 사용할 수 있다.

```bash
git diff --no-index old.conf new.conf
```

`git diff --no-index`는 차이가 있으면 상태 코드 1을 반환한다. 이는 오류가 아니라 `diff` 계열 명령의 일반적인 의미다.

delta를 잠시 우회해 Git 원본 출력을 보고 싶다면 다음처럼 실행한다.

```bash
git --no-pager diff
```

## `core.pager`와 `interactive.diffFilter`가 따로 있는 이유

`core.pager`는 `git diff`, `git show`, `git log`처럼 **완성된 출력을 읽는 명령**에 적용된다. delta가 렌더링한 뒤 `less`가 스크롤과 검색을 맡는다.

반면 `git add -p`는 hunk마다 `y`, `n`, `s`, `e`를 입력받는 **대화형 명령**이다. 전체 출력을 pager에 넘기면 Git의 입력 흐름을 방해한다. 그래서 Git이 상호작용을 계속 담당하고, 화면에 보여 줄 diff 조각만 filter를 거친다.

```ini
[interactive]
    diffFilter = delta --color-only
```

대화형 filter의 출력은 원본 diff와 행이 일대일로 대응해야 한다. `--color-only`는 행을 추가하거나 레이아웃을 바꾸지 않고 색과 문법 강조만 입혀 이 조건을 지킨다. `git add -p`의 hunk 선택 동작은 그대로 유지된다. hunk와 부분 스테이징 자체는 [Git hunk와 `git add -p`](/posts/git/2026-07-12-git-hunk-and-interactive-staging/)에서 따로 정리했다.

## 자주 쓰는 옵션의 선택 기준

### `navigate = true`

diff가 pager에서 열렸을 때 `n`과 `N`으로 다음·이전 파일 또는 hunk 경계를 이동한다. delta가 `less`의 초기 검색 패턴을 경계에 맞춰 주는 방식이다. `/문자열`로 새 검색을 시작하면 이후 `n`과 `N`은 그 문자열의 다음·이전 결과를 따른다.

| 키 | 동작 |
|---|---|
| `n` | 다음 파일·hunk로 이동 |
| `N` | 이전 파일·hunk로 이동 |
| `/문자열` | `less`에서 문자열 검색 |
| `q` | 종료 |

delta가 실제 화면 탐색까지 직접 구현하는 것은 아니다. 기본적으로 `less -R`을 pager로 실행하며, `DELTA_PAGER`, `BAT_PAGER`, `PAGER` 순서로 다른 pager 설정을 찾는다. 직접 지정한다면 ANSI 색상을 보존하는 `-R`을 빼지 않는 편이 안전하다.

```bash
export DELTA_PAGER='less -R'
```

### `line-numbers = true`

원본과 변경본의 행 번호를 함께 표시한다. 리뷰 중 실제 파일 위치를 찾기 쉬워져 대부분의 환경에서 켜 둘 만하다. 다만 터미널 폭을 조금 사용한다.

### `side-by-side = false`

`true`이면 삭제 전과 추가 후를 좌우로 나란히 보여 준다. 넓은 모니터에서 짧은 줄을 비교할 때는 좋지만, 긴 코드나 좁은 tmux pane에서는 각 열이 너무 좁아져 줄바꿈이 늘어난다.

```bash
git -c delta.side-by-side=true diff
```

전역 설정을 바꾸기 전에 위처럼 한 번만 켜 보고 판단할 수 있다. 일반적으로 tmux와 세로 분할을 자주 쓴다면 unified 형식인 `false`가 안정적이다.

### `syntax-theme`

테마는 diff 배경색이 아니라 코드 토큰의 구문 강조 색을 정한다. 터미널의 명암과 맞지 않으면 오히려 읽기 어려우므로 실제 출력으로 고른다.

```bash
delta --show-syntax-themes --dark
delta --show-syntax-themes --light
```

현재 적용된 delta 설정은 다음 명령으로 확인한다.

```bash
delta --show-config
git config --show-origin --get-regexp '^(core\.pager|interactive\.difffilter|delta\.)'
```

두 번째 명령은 값뿐 아니라 어느 Git 설정 파일에서 왔는지도 추적할 때 유용하다.

## `zdiff3`는 delta 옵션이 아니다

다음 설정은 delta 예제에 자주 같이 나오지만 Git 자체의 merge 설정이다.

```ini
[merge]
    conflictStyle = zdiff3
```

기본 `merge` 형식은 ours와 theirs만 보여 준다. `diff3`는 여기에 공통 조상(base)을 추가하고, `zdiff3`는 세 버전을 유지하면서 양쪽에서 동일한 부분을 충돌 영역 밖으로 밀어 더 압축해서 보여 준다. delta가 일반 diff를 읽기 좋게 만들고 `zdiff3`가 충돌 marker에 판단 근거를 더하므로 함께 추천될 뿐, 서로 의존하지 않는다.

## 직접 `| delta`로 연결할 때

Git이 아닌 명령이 unified diff를 출력한다면 delta를 직접 filter로 쓸 수 있다.

```bash
diff -u old.conf new.conf | delta
```

Git 출력을 pipe하면 Git은 terminal에 직접 쓰지 않으므로 `core.pager`를 실행하지 않는다. 따라서 다음 명령에서 delta가 두 번 실행되는 것은 아니지만, 사람이 terminal에서 결과를 읽는 용도라면 명시적 pipe가 필요 없다.

```bash
# 일반적인 대화형 사용에는 불필요함
git diff --no-index old.conf new.conf | delta
```

직접 pipe하면 shell이 기본적으로 마지막 명령인 delta의 상태 코드만 보고할 수도 있다. 그러면 차이를 뜻하는 `git diff`의 상태 코드 1이 가려진다. Git 명령은 pipe 없이 실행해 pager 설정에 맡기는 편이 출력과 종료 상태 모두 명확하다.

## 다른 도구에 연결할 때

lazygit처럼 자신이 화면과 키 입력을 관리하는 TUI(Terminal User Interface) 안에서는 delta가 pager를 다시 열면 안 된다. 렌더링만 하고 바로 결과를 돌려주도록 `--paging=never`를 사용한다.

```yaml
git:
  diffRenderers:
    - name: delta
      command: delta --dark --paging=never
      colorArg: always
```

같은 원칙으로, 다른 프로그램이 delta 출력을 받아 자체 화면에 그린다면 `--paging=never`를 검토한다. 사람이 터미널에서 직접 읽는 일반 `git diff`는 기본 `auto` paging이 알맞다.

## 문제가 생길 때 확인할 것

| 증상 | 확인할 설정 |
|---|---|
| delta가 실행되지 않음 | `git config --show-origin --get core.pager` |
| `git add -p`만 평범하게 보임 | `interactive.diffFilter = delta --color-only` |
| 색상 escape 문자가 그대로 보임 | custom pager에 `less -R`이 있는지 확인 |
| 출력이 두 번 paging됨 | TUI의 delta 명령에 `--paging=never` 추가 |
| 좁은 pane에서 코드가 심하게 줄바꿈됨 | `side-by-side = false` |
| 테마가 배경과 맞지 않음 | `--show-syntax-themes --dark` 또는 `--light`로 재선택 |
| 설정 출처를 모르겠음 | `git config --show-origin --get-regexp '^delta\.'` |

delta는 Git 동작을 바꾸지 않으면서 매일 보는 diff의 정보 밀도를 높인다. 처음부터 스타일을 세세하게 조정하기보다 `navigate`, `line-numbers`, 맞는 테마만 켜고, `side-by-side`는 사용하는 터미널 폭에 따라 고르는 것이 좋다.

명령만 빠르게 다시 볼 때는 [modern CLI 치트시트의 delta 절](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/modern-cli.md#delta--git-diff-페이저)을 참고한다.

## 참고

- [delta 공식 문서](https://dandavison.github.io/delta/)
- [delta GitHub 저장소](https://github.com/dandavison/delta)
- [Git `git-config` 문서](https://git-scm.com/docs/git-config)
